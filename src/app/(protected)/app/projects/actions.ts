"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { normalizeAIError } from "@/lib/ai/gemini";
import { generateProjectPlan } from "@/lib/ai/service";
import { requireProjectOwner, requireUser } from "@/lib/auth";
import { splitList } from "@/lib/utils";
import { projectBasicsSchema, projectMemberSetupSchema } from "@/lib/validation";

export async function createProject(formData: FormData) {
  const { supabase, user } = await requireUser();
  const criteria = String(formData.get("success_criteria") ?? "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
  const memberIds = [...new Set(formData.getAll("member_id").map(String))];
  if (!memberIds.includes(user.id)) memberIds.push(user.id);
  const parsed = projectBasicsSchema.safeParse({
    teamId: String(formData.get("team_id") ?? ""),
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    goal: String(formData.get("goal") ?? ""),
    startDate: String(formData.get("start_date") ?? ""),
    endDate: String(formData.get("end_date") ?? ""),
    criteria,
    memberIds,
  });
  if (!parsed.success) {
    redirect(`/app/projects/new?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  const { data: memberships } = await supabase
    .from("team_members")
    .select("user_id")
    .eq("team_id", parsed.data.teamId)
    .in("user_id", parsed.data.memberIds);
  if (
    !memberships?.some((membership) => membership.user_id === user.id)
    || memberships.length !== parsed.data.memberIds.length
  ) {
    redirect("/app/projects/new?error=Every selected member must belong to this team.");
  }

  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      team_id: parsed.data.teamId,
      title: parsed.data.title,
      description: parsed.data.description,
      goal: parsed.data.goal,
      success_criteria: parsed.data.criteria.map((criterion) => ({ criterion })),
      start_date: parsed.data.startDate,
      end_date: parsed.data.endDate,
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error || !project) redirect(`/app/projects/new?error=${encodeURIComponent(error?.message || "Could not create project")}`);

  const memberSetup = parsed.data.memberIds.map((memberId) => projectMemberSetupSchema.safeParse({
    memberId,
    strengths: splitList(formData.get(`strengths_${memberId}`)),
    weaknesses: splitList(formData.get(`weaknesses_${memberId}`)),
    availabilityMinutesPerDay: Number(formData.get(`availability_${memberId}`)),
    preferredWorkTypes: splitList(formData.get(`work_types_${memberId}`)),
    notes: String(formData.get(`notes_${memberId}`) ?? ""),
    pledgeAmount: Number(formData.get(`pledge_${memberId}`)),
    pledgeCurrency: String(formData.get(`currency_${memberId}`) || "POINTS"),
  }));
  const invalidSetup = memberSetup.find((result) => !result.success);
  if (invalidSetup && !invalidSetup.success) {
    await supabase.from("projects").delete().eq("id", project.id);
    redirect(`/app/projects/new?error=${encodeURIComponent(invalidSetup.error.issues[0].message)}`);
  }
  const setup = memberSetup.map((result) => {
    if (!result.success) throw new Error("Invalid member setup");
    return result.data;
  });
  const profiles = setup.map((member) => ({
    project_id: project.id,
    user_id: member.memberId,
    strengths: member.strengths,
    weaknesses: member.weaknesses,
    availability_minutes_per_day: member.availabilityMinutesPerDay,
    preferred_work_types: member.preferredWorkTypes,
    notes: member.notes,
  }));
  const pledges = setup.map((member) => ({
    project_id: project.id,
    user_id: member.memberId,
    amount: member.pledgeAmount,
    currency: member.pledgeCurrency,
  }));

  const profileResult = await supabase.from("project_member_profiles").insert(profiles);
  const pledgeResult = await supabase.from("pledges").insert(pledges);
  if (profileResult.error || pledgeResult.error) {
    await supabase.from("projects").delete().eq("id", project.id);
    redirect(`/app/projects/new?error=${encodeURIComponent(profileResult.error?.message || pledgeResult.error?.message || "Could not save member setup")}`);
  }

  await supabase.from("audit_logs").insert({
    project_id: project.id,
    user_id: user.id,
    action: "project_created",
    details: { title: parsed.data.title },
  });
  redirect(`/app/projects/${project.id}`);
}

export async function generatePlan(formData: FormData) {
  const projectId = String(formData.get("project_id"));
  const { supabase, user, project } = await requireProjectOwner(projectId);
  if (project.status !== "draft") redirect(`/app/projects/${projectId}?error=Only draft projects can generate a plan.`);

  const { data: memberProfiles } = await supabase
    .from("project_member_profiles")
    .select("user_id, strengths, weaknesses, preferred_work_types, availability_minutes_per_day, notes, profiles(name)")
    .eq("project_id", projectId);

  const missingProfiles = (memberProfiles ?? []).filter((member) =>
    !member.strengths?.length
    || !member.preferred_work_types?.length
    || !member.availability_minutes_per_day
  );
  if (!memberProfiles?.length || missingProfiles.length) {
    redirect(`/app/projects/${projectId}?error=Complete every member skill profile before generating the AI plan.`);
  }

  const planInput = {
    title: project.title,
    description: project.description,
    goal: project.goal,
    successCriteria: (project.success_criteria as Array<{ criterion: string }>).map((item) => item.criterion),
    startDate: project.start_date,
    endDate: project.end_date,
    durationDays: Math.max(1, Math.ceil((new Date(`${project.end_date}T00:00:00Z`).getTime() - new Date(`${project.start_date}T00:00:00Z`).getTime()) / 86_400_000) + 1),
    members: (memberProfiles ?? []).map((member) => ({
      user_id: member.user_id,
      name: (member.profiles as unknown as { name: string }).name,
      strengths: member.strengths,
      weaknesses: member.weaknesses,
      preferred_work_types: member.preferred_work_types,
      availability_minutes_per_day: member.availability_minutes_per_day,
      notes: member.notes,
    })),
  };

  try {
    const { output: plan, model } = await generateProjectPlan(planInput);
    const { data: oldTasks } = await supabase.from("tasks").select("id").eq("project_id", projectId).eq("ai_generated", true);
    if (oldTasks?.length) await supabase.from("tasks").delete().in("id", oldTasks.map((task) => task.id));

    await supabase.from("ai_reports").insert({
      project_id: projectId,
      type: "plan",
      input_snapshot: planInput,
      output: plan,
      model,
      created_by: user.id,
    });

    for (const task of plan.tasks) {
      const { data: inserted, error } = await supabase.from("tasks").insert({
        project_id: projectId,
        title: task.title,
        description: task.description,
        acceptance_criteria: task.acceptanceCriteria,
        expected_evidence_types: task.expectedEvidenceTypes,
        priority: task.priority,
        due_date: task.dueDate,
        ai_generated: true,
      }).select("id").single();
      if (error || !inserted) throw error || new Error("Task insert failed");
      await supabase.from("task_assignments").insert({
        task_id: inserted.id,
        user_id: task.assignedUserId,
        assigned_reason: task.assignmentReason,
      });
    }
    await supabase.from("audit_logs").insert({
      project_id: projectId,
      user_id: user.id,
      action: "ai_plan_generated",
      details: { task_count: plan.tasks.length },
    });
  } catch (error) {
    redirect(`/app/projects/${projectId}?error=${encodeURIComponent(normalizeAIError(error))}`);
  }
  revalidatePath(`/app/projects/${projectId}`);
}

export async function updateDraftTask(formData: FormData) {
  const projectId = String(formData.get("project_id"));
  const taskId = String(formData.get("task_id"));
  const { supabase, project } = await requireProjectOwner(projectId);
  if (project.status !== "draft") return;
  await supabase.from("tasks").update({
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    due_date: String(formData.get("due_date") ?? ""),
    priority: String(formData.get("priority") ?? "medium"),
  }).eq("id", taskId).eq("project_id", projectId);
  await supabase.from("task_assignments").update({
    user_id: String(formData.get("assigned_user_id") ?? ""),
  }).eq("task_id", taskId);
  revalidatePath(`/app/projects/${projectId}`);
}

export async function startProject(formData: FormData) {
  const projectId = String(formData.get("project_id"));
  const { supabase, user, project } = await requireProjectOwner(projectId);
  if (project.status !== "draft") {
    redirect(`/app/projects/${projectId}?error=Only draft projects can be started.`);
  }
  const { count } = await supabase.from("tasks").select("*", { count: "exact", head: true }).eq("project_id", projectId);
  if (!count) redirect(`/app/projects/${projectId}?error=Generate at least one task before starting.`);
  await supabase.from("projects").update({ status: "active" }).eq("id", projectId);
  await supabase.from("audit_logs").insert({
    project_id: projectId,
    user_id: user.id,
    action: "project_started",
    details: { started_from: project.status },
  });
  revalidatePath("/app");
  redirect(`/app/projects/${projectId}`);
}
