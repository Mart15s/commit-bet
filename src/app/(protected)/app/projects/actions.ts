"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generateProjectPlan } from "@/lib/ai/service";
import { requireProjectOwner, requireUser } from "@/lib/auth";
import {
  draftTaskUpdateSchema,
  projectCreationSchema,
} from "@/lib/validation";

export type CreateProjectActionState = {
  error?: string;
};

function parseJsonList(value: FormDataEntryValue | null): unknown {
  if (typeof value !== "string") return [];
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function safeProjectCreationError(message: string) {
  if (message.includes("not allowed to create a project")) {
    return "You are not allowed to create a project for this team.";
  }
  if (message.includes("Every selected member must belong")) {
    return "Every selected member must belong to this team.";
  }
  if (message.includes("creator must be a selected member")) {
    return "The project creator must be a selected member.";
  }
  if (
    message.includes("creation request already used")
    || message.includes("request ID is already in use")
  ) {
    return "This project creation request conflicts with an earlier submission. Refresh the page and try again.";
  }
  return "Could not create the project. Review the setup and try again.";
}

export async function createProject(
  _previousState: CreateProjectActionState,
  formData: FormData,
): Promise<CreateProjectActionState> {
  const { supabase, user } = await requireUser();
  const pledgeAmount = Number(formData.get("pledge_amount"));
  const memberIds = formData.getAll("member_id").map(String);
  const parsed = projectCreationSchema.safeParse({
    requestId: String(formData.get("request_id") ?? ""),
    teamId: String(formData.get("team_id") ?? ""),
    projectType: String(formData.get("project_type") ?? ""),
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    goal: String(formData.get("goal") ?? ""),
    startDate: String(formData.get("start_date") ?? ""),
    endDate: String(formData.get("end_date") ?? ""),
    selectedSuccessCriteria: parseJsonList(
      formData.get("selected_success_criteria"),
    ),
    customSuccessCriteria: parseJsonList(
      formData.get("custom_success_criteria"),
    ),
    memberSetups: memberIds.map((memberId) => ({
      memberId,
      roles: parseJsonList(formData.get(`roles_${memberId}`)),
      strengths: parseJsonList(formData.get(`strengths_${memberId}`)),
      weaknesses: parseJsonList(formData.get(`weaknesses_${memberId}`)),
      availabilityMinutesPerDay: Number(
        formData.get(`availability_${memberId}`),
      ),
      preferredWorkTypes: parseJsonList(
        formData.get(`work_types_${memberId}`),
      ),
      evidenceTypes: parseJsonList(
        formData.get(`evidence_types_${memberId}`),
      ),
      experienceLevel: String(
        formData.get(`experience_level_${memberId}`) ?? "",
      ),
      bestWorkTime: String(
        formData.get(`best_work_time_${memberId}`) ?? "",
      ),
      notes: String(formData.get(`notes_${memberId}`) ?? ""),
      customNotes: String(formData.get(`custom_notes_${memberId}`) ?? ""),
      pledgeAmount,
      pledgeCurrency: "POINTS",
    })),
    pledgeAmount,
    pledgeAmountIsCustom:
      String(formData.get("pledge_amount_is_custom")) === "true",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  if (
    !parsed.data.memberSetups.some((member) => member.memberId === user.id)
  ) {
    return { error: "The project creator must be a selected member." };
  }

  const { data: projectId, error } = await supabase.rpc(
    "create_project_with_members",
    {
      p_request_id: parsed.data.requestId,
      p_team_id: parsed.data.teamId,
      p_project_type: parsed.data.projectType,
      p_title: parsed.data.title,
      p_description: parsed.data.description,
      p_goal: parsed.data.goal,
      p_selected_success_criteria: parsed.data.selectedSuccessCriteria,
      p_custom_success_criteria: parsed.data.customSuccessCriteria,
      p_start_date: parsed.data.startDate,
      p_end_date: parsed.data.endDate,
      p_pledge_amount: parsed.data.pledgeAmount,
      p_pledge_amount_is_custom: parsed.data.pledgeAmountIsCustom,
      p_members: parsed.data.memberSetups.map((member) => ({
        member_id: member.memberId,
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
        pledge: {
          amount: member.pledgeAmount,
          currency: member.pledgeCurrency,
        },
      })),
    },
  );
  if (error) {
    return { error: safeProjectCreationError(error.message) };
  }

  if (projectId !== parsed.data.requestId) {
    return {
      error: "The project could not be confirmed after creation. Please try again.",
    };
  }

  revalidatePath("/app");
  revalidatePath(`/app/projects/${projectId}`);
  redirect(`/app/projects/${projectId}`);
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
  const parsed = draftTaskUpdateSchema.safeParse({
    projectId: String(formData.get("project_id") ?? ""),
    taskId: String(formData.get("task_id") ?? ""),
    title: String(formData.get("title") ?? ""),
    dueDate: String(formData.get("due_date") ?? ""),
    priority: String(formData.get("priority") ?? ""),
    assignedUserId: String(formData.get("assigned_user_id") ?? ""),
  });
  if (!parsed.success) {
    redirect(`/app?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  const { supabase } = await requireProjectOwner(parsed.data.projectId);
  const { error } = await supabase.rpc("update_draft_task", {
    draft_project_id: parsed.data.projectId,
    draft_task_id: parsed.data.taskId,
    draft_title: parsed.data.title,
    draft_due_date: parsed.data.dueDate,
    draft_priority: parsed.data.priority,
    draft_assigned_user_id: parsed.data.assignedUserId,
  });
  if (error) {
    redirect(`/app/projects/${parsed.data.projectId}?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath(`/app/projects/${parsed.data.projectId}`);
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
