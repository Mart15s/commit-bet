"use server";

import { createHash, randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  generateProjectPlan,
  getAIProviderMetadata,
} from "@/lib/ai/service";
import { requireProjectOwner, requireUser } from "@/lib/auth";
import {
  aiPlanReplacementResultSchema,
  draftTaskUpdateSchema,
  projectPlanActionRequestSchema,
  projectPlanSchema,
  projectCreationSchema,
} from "@/lib/validation";

export type CreateProjectActionState = {
  error?: string;
};

export type GeneratePlanActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

function parseJsonList(value: FormDataEntryValue | null): unknown {
  if (typeof value !== "string") return [];
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

const projectPlanRequestSchema = projectPlanActionRequestSchema;

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

function failedPlan(message: string): GeneratePlanActionState {
  return {
    status: "error",
    message: `${message} The previous plan is unchanged. You can retry.`,
  };
}

function safePlanPersistenceError(message: string) {
  if (message.includes("Only draft projects")) {
    return "Only draft projects can replace an AI plan.";
  }
  if (message.includes("after generated task activity exists")) {
    return "This plan has project activity and can no longer be regenerated safely.";
  }
  if (message.includes("Idempotency key was already used")) {
    return "This retry no longer matches the original plan request. Refresh the project before trying again.";
  }
  if (
    message.includes("project owner")
    || message.includes("caller team")
    || message.includes("Project owner is not a project member")
  ) {
    return "You are not allowed to replace this project plan.";
  }
  return "The AI plan could not be saved.";
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value) ?? "null";
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  return `{${Object.entries(value)
    .filter(([, item]) => item !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`)
    .join(",")}}`;
}

function hashPlanRequest(value: unknown) {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
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

export async function generatePlan(
  _previousState: GeneratePlanActionState,
  formData: FormData,
): Promise<GeneratePlanActionState> {
  const projectId = String(formData.get("project_id") ?? "");
  const suppliedIdempotencyKey = String(
    formData.get("idempotency_key") ?? "",
  );
  const requestIdentity = suppliedIdempotencyKey || randomUUID();
  const requestParsed = projectPlanRequestSchema.safeParse({
    projectId,
    idempotencyKey: requestIdentity,
  });
  if (!requestParsed.success) {
    return failedPlan("The plan request is invalid.");
  }

  const { supabase, user } = await requireUser();
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, team_id, created_by, status, title, project_type, goal, success_criteria, start_date, end_date")
    .eq("id", requestParsed.data.projectId)
    .single();
  if (projectError || !project) {
    return failedPlan("The project could not be loaded.");
  }
  if (project.created_by !== user.id) {
    return failedPlan("Only the project owner can replace the AI plan.");
  }
  if (project.status !== "draft") {
    return failedPlan("Only draft projects can replace an AI plan.");
  }
  const { count: planGenerationCount, error: planCountError } = await supabase
    .from("ai_reports")
    .select("*", { count: "exact", head: true })
    .eq("project_id", requestParsed.data.projectId)
    .eq("type", "plan");
  if (planCountError) {
    return failedPlan("AI plan usage could not be checked.");
  }
  if ((planGenerationCount ?? 0) >= 2) {
    return failedPlan("This beta project has reached its two AI plan generations.");
  }

  const { data: memberProfiles, error: memberProfilesError } = await supabase
    .from("project_member_profiles")
    .select("user_id, roles, strengths, weaknesses, preferred_work_types, evidence_types, availability_minutes_per_day, experience_level, best_work_time, custom_notes, profiles(name)")
    .eq("project_id", requestParsed.data.projectId)
    .order("user_id");
  if (memberProfilesError || !memberProfiles?.length) {
    return failedPlan("Project member planning data could not be loaded.");
  }

  const planInput = {
    title: project.title,
    projectType: project.project_type,
    goal: project.goal,
    successCriteria: Array.isArray(project.success_criteria)
      ? project.success_criteria
        .map((item) => (
          typeof item === "object"
          && item !== null
          && "criterion" in item
          && typeof item.criterion === "string"
            ? item.criterion
            : ""
        ))
        .filter(Boolean)
      : [],
    startDate: project.start_date,
    endDate: project.end_date,
    members: (memberProfiles ?? []).map((member) => ({
      user_id: member.user_id,
      name: (member.profiles as unknown as { name?: string } | null)?.name
        ?? "Project member",
      roles: member.roles ?? [],
      strengths: member.strengths ?? [],
      weaknesses: member.weaknesses ?? [],
      preferred_work_types: member.preferred_work_types ?? [],
      evidence_types: member.evidence_types ?? [],
      availability_minutes_per_day: member.availability_minutes_per_day,
      experience_level: member.experience_level ?? "",
      best_work_time: member.best_work_time ?? "",
      custom_notes: member.custom_notes ?? "",
    })),
  };

  let generatedPlan: unknown;
  try {
    generatedPlan = await generateProjectPlan(planInput);
  } catch {
    return failedPlan("The AI provider could not generate a plan.");
  }

  const parsedPlan = projectPlanSchema.safeParse(generatedPlan);
  if (!parsedPlan.success) {
    return failedPlan("The AI provider returned an invalid plan.");
  }

  const projectMemberIds = new Set(
    memberProfiles.map((member) => member.user_id),
  );
  if (
    parsedPlan.data.tasks.some(
      (task) => !projectMemberIds.has(task.assigned_user_id),
    )
  ) {
    return failedPlan("The AI plan assigned work outside this project.");
  }
  if (
    parsedPlan.data.tasks.some(
      (task) => (
        task.due_date < project.start_date
        || task.due_date > project.end_date
      ),
    )
  ) {
    return failedPlan("The AI plan contains a due date outside the project.");
  }

  const metadata = getAIProviderMetadata();
  const payloadHash = hashPlanRequest({
    projectId: requestParsed.data.projectId,
    plan: parsedPlan.data,
    provider: metadata.provider,
    model: metadata.model,
    inputSnapshot: planInput,
  });
  const { data: replacement, error: replacementError } = await supabase.rpc(
    "replace_ai_project_plan",
    {
      p_project_id: requestParsed.data.projectId,
      p_idempotency_key: requestParsed.data.idempotencyKey,
      p_plan: parsedPlan.data,
      p_ai_provider: metadata.provider,
      p_ai_model: metadata.model,
      p_input_snapshot: planInput,
      p_payload_hash: payloadHash,
    },
  );
  if (replacementError) {
    return failedPlan(safePlanPersistenceError(replacementError.message));
  }

  const parsedReplacement = aiPlanReplacementResultSchema.safeParse(
    replacement,
  );
  if (
    !parsedReplacement.success
    || parsedReplacement.data.project_id !== requestParsed.data.projectId
    || parsedReplacement.data.idempotency_key
      !== requestParsed.data.idempotencyKey
    || parsedReplacement.data.task_count !== parsedPlan.data.tasks.length
  ) {
    return failedPlan("The saved AI plan could not be confirmed.");
  }

  revalidatePath(`/app/projects/${requestParsed.data.projectId}`);
  return {
    status: "success",
    message: parsedReplacement.data.replayed
      ? "This plan request was already saved. No duplicate data was created."
      : "AI plan saved.",
  };
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
  const { supabase, project } = await requireProjectOwner(projectId);
  if (project.status !== "draft") {
    redirect(`/app/projects/${projectId}?error=Only draft projects can be started.`);
  }
  const { error } = await supabase.rpc("start_project", {
    target_project_id: projectId,
  });
  if (error) {
    redirect(`/app/projects/${projectId}?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath("/app");
  redirect(`/app/projects/${projectId}`);
}

export async function deleteDraftProject(formData: FormData) {
  const projectId = String(formData.get("project_id") ?? "");
  if (formData.get("confirm_delete") !== "yes") {
    redirect(`/app/projects/${projectId}?error=Confirm the draft deletion.`);
  }
  const { supabase } = await requireProjectOwner(projectId);
  const { error } = await supabase.rpc("delete_draft_project", {
    target_project_id: projectId,
  });
  if (error) {
    redirect(`/app/projects/${projectId}?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath("/app");
  redirect("/app?notice=Draft project deleted");
}
