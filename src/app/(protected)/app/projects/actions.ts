"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generateProjectPlan } from "@/lib/ai/service";
import { requireProjectOwner, requireUser } from "@/lib/auth";
import { projectBasicsSchema, projectMemberSetupSchema } from "@/lib/validation";

function parseList(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    return value.split(",");
  }
  return [];
}

export async function createProject(formData: FormData) {
  const { supabase, user } = await requireUser();
  const selectedSuccessCriteria = parseList(formData.get("selected_success_criteria"));
  const customSuccessCriteria = parseList(formData.get("custom_success_criteria"));
  const criteria = [...selectedSuccessCriteria, ...customSuccessCriteria]
    .map((item) => item.trim())
    .filter(Boolean);
  const memberIds = [...new Set(formData.getAll("member_id").map(String))];
  const pledgeAmount = Number(formData.get("pledge_amount"));
  const parsed = projectBasicsSchema.safeParse({
    teamId: String(formData.get("team_id") ?? ""),
    projectType: String(formData.get("project_type") ?? ""),
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    goal: String(formData.get("goal") ?? ""),
    startDate: String(formData.get("start_date") ?? ""),
    endDate: String(formData.get("end_date") ?? ""),
    selectedSuccessCriteria,
    customSuccessCriteria,
    criteria,
    memberIds,
    pledgeAmount,
    pledgeAmountIsCustom: String(formData.get("pledge_amount_is_custom")) === "true",
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
      project_type: parsed.data.projectType,
      title: parsed.data.title,
      description: parsed.data.description,
      goal: parsed.data.goal,
      success_criteria: parsed.data.criteria.map((criterion) => ({ criterion })),
      selected_success_criteria: parsed.data.selectedSuccessCriteria,
      custom_success_criteria: parsed.data.customSuccessCriteria,
      pledge_amount: parsed.data.pledgeAmount,
      pledge_amount_is_custom: parsed.data.pledgeAmountIsCustom,
      start_date: parsed.data.startDate,
      end_date: parsed.data.endDate,
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error || !project) redirect(`/app/projects/new?error=${encodeURIComponent(error?.message || "Could not create project")}`);

  const memberSetup = parsed.data.memberIds.map((memberId) => projectMemberSetupSchema.safeParse({
    memberId,
    roles: parseList(formData.get(`roles_${memberId}`)),
    strengths: parseList(formData.get(`strengths_${memberId}`)),
    weaknesses: parseList(formData.get(`weaknesses_${memberId}`)),
    availabilityMinutesPerDay: Number(formData.get(`availability_${memberId}`)),
    preferredWorkTypes: parseList(formData.get(`work_types_${memberId}`)),
    evidenceTypes: parseList(formData.get(`evidence_types_${memberId}`)),
    experienceLevel: String(formData.get(`experience_level_${memberId}`) ?? ""),
    bestWorkTime: String(formData.get(`best_work_time_${memberId}`) ?? ""),
    notes: String(formData.get(`notes_${memberId}`) ?? ""),
    customNotes: String(formData.get(`custom_notes_${memberId}`) ?? ""),
    pledgeAmount: parsed.data.pledgeAmount,
    pledgeCurrency: "POINTS",
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
    roles: member.roles,
    strengths: member.strengths,
    weaknesses: member.weaknesses,
    availability_minutes_per_day: member.availabilityMinutesPerDay,
    preferred_work_types: member.preferredWorkTypes,
    evidence_types: member.evidenceTypes,
    experience_level: member.experienceLevel,
    best_work_time: member.bestWorkTime,
    notes: member.notes,
    custom_notes: member.customNotes,
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
    .select("user_id, roles, strengths, weaknesses, preferred_work_types, evidence_types, availability_minutes_per_day, experience_level, best_work_time, custom_notes, profiles(name)")
    .eq("project_id", projectId);

  const planInput = {
    title: project.title,
    projectType: project.project_type,
    goal: project.goal,
    successCriteria: (project.success_criteria as Array<{ criterion: string }>).map((item) => item.criterion),
    startDate: project.start_date,
    endDate: project.end_date,
    members: (memberProfiles ?? []).map((member) => ({
      user_id: member.user_id,
      name: (member.profiles as unknown as { name: string }).name,
      roles: member.roles,
      strengths: member.strengths,
      weaknesses: member.weaknesses,
      preferred_work_types: member.preferred_work_types,
      evidence_types: member.evidence_types,
      availability_minutes_per_day: member.availability_minutes_per_day,
      experience_level: member.experience_level,
      best_work_time: member.best_work_time,
      custom_notes: member.custom_notes,
    })),
  };

  try {
    const plan = await generateProjectPlan(planInput);
    const { data: oldTasks } = await supabase.from("tasks").select("id").eq("project_id", projectId).eq("ai_generated", true);
    if (oldTasks?.length) await supabase.from("tasks").delete().in("id", oldTasks.map((task) => task.id));

    await supabase.from("ai_reports").insert({
      project_id: projectId,
      type: "plan",
      input_snapshot: planInput,
      output: plan,
      model: process.env.OPENAI_API_KEY && process.env.AI_PROVIDER === "openai"
        ? process.env.OPENAI_MODEL || "gpt-5.5"
        : "mock-v1",
    });

    for (const task of plan.tasks) {
      const { data: inserted, error } = await supabase.from("tasks").insert({
        project_id: projectId,
        title: task.title,
        description: task.description,
        acceptance_criteria: task.acceptance_criteria,
        expected_evidence_types: task.expected_evidence_types,
        priority: task.priority,
        due_date: task.due_date,
        ai_generated: true,
      }).select("id").single();
      if (error || !inserted) throw error || new Error("Task insert failed");
      await supabase.from("task_assignments").insert({
        task_id: inserted.id,
        user_id: task.assigned_user_id,
        assigned_reason: task.assigned_reason,
      });
    }
    await supabase.from("audit_logs").insert({
      project_id: projectId,
      user_id: user.id,
      action: "ai_plan_generated",
      details: { task_count: plan.tasks.length },
    });
  } catch (error) {
    redirect(`/app/projects/${projectId}?error=${encodeURIComponent(error instanceof Error ? error.message : "Plan generation failed")}`);
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
