"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generateDisputeRecommendation } from "@/lib/ai/service";
import { requireUser } from "@/lib/auth";
import { singleRelation } from "@/lib/utils";
import { evidenceSchema, reviewSchema } from "@/lib/validation";

async function assignedTask(taskId: string) {
  const { supabase, user } = await requireUser();
  const { data: task } = await supabase
    .from("tasks")
    .select("*, task_assignments!inner(user_id), projects(id, status)")
    .eq("id", taskId)
    .eq("task_assignments.user_id", user.id)
    .single();
  if (!task) redirect("/app");
  const project = singleRelation(task.projects as unknown as
    | { id: string; status: string }
    | Array<{ id: string; status: string }>);
  if (!project) redirect("/app");
  return { supabase, user, task, project };
}

function requireActiveProject(taskId: string, projectStatus: string) {
  if (projectStatus !== "active") {
    redirect(`/app/tasks/${taskId}?error=Tasks can only be updated while the project is active.`);
  }
}

export async function markInProgress(formData: FormData) {
  const taskId = String(formData.get("task_id"));
  const { supabase, task, project } = await assignedTask(taskId);
  requireActiveProject(taskId, project.status);
  if (!["todo", "needs_changes", "rejected"].includes(task.status)) {
    redirect(`/app/tasks/${taskId}?error=This task cannot be moved to in progress from its current status.`);
  }
  const { error } = await supabase.from("tasks").update({ status: "in_progress" }).eq("id", taskId);
  if (error) redirect(`/app/tasks/${taskId}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/app/tasks/${taskId}`);
}

export async function addEvidence(formData: FormData) {
  const taskId = String(formData.get("task_id"));
  const { supabase, user, task, project } = await assignedTask(taskId);
  requireActiveProject(taskId, project.status);
  if (!["todo", "in_progress", "needs_changes", "rejected"].includes(task.status)) {
    redirect(`/app/tasks/${taskId}?error=Evidence cannot be added at this stage.`);
  }
  const parsed = evidenceSchema.safeParse({
    taskId,
    type: String(formData.get("type")),
    url: String(formData.get("url") ?? ""),
    description: String(formData.get("description") ?? ""),
  });
  if (!parsed.success) redirect(`/app/tasks/${taskId}?error=${encodeURIComponent(parsed.error.issues[0].message)}`);

  let storagePath: string | undefined;
  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    if (file.size > 10 * 1024 * 1024) redirect(`/app/tasks/${taskId}?error=Files must be 10 MB or smaller.`);
    storagePath = `${task.project_id}/${user.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
    const upload = await supabase.storage.from("evidence").upload(storagePath, file, { upsert: false });
    if (upload.error) redirect(`/app/tasks/${taskId}?error=${encodeURIComponent(upload.error.message)}`);
  }

  const { error } = await supabase.from("evidence").insert({
    task_id: taskId,
    user_id: user.id,
    type: parsed.data.type,
    url: parsed.data.url || null,
    description: parsed.data.description,
    metadata: storagePath ? { storage_path: storagePath, file_name: (file as File).name } : {},
  });
  if (error) redirect(`/app/tasks/${taskId}?error=${encodeURIComponent(error.message)}`);
  await supabase.from("audit_logs").insert({
    project_id: task.project_id,
    user_id: user.id,
    action: "evidence_added",
    details: { task_id: taskId, type: parsed.data.type },
  });
  revalidatePath(`/app/tasks/${taskId}`);
}

export async function submitTask(formData: FormData) {
  const taskId = String(formData.get("task_id"));
  const { supabase, user, task, project } = await assignedTask(taskId);
  requireActiveProject(taskId, project.status);
  if (!["in_progress", "needs_changes"].includes(task.status)) {
    redirect(`/app/tasks/${taskId}?error=Only work in progress can be submitted for review.`);
  }
  const { count } = await supabase.from("evidence").select("*", { count: "exact", head: true }).eq("task_id", taskId);
  if (!count) redirect(`/app/tasks/${taskId}?error=Add at least one evidence item before submitting.`);
  const { error } = await supabase.from("tasks").update({
    status: "submitted",
    submitted_at: new Date().toISOString(),
  }).eq("id", taskId);
  if (error) redirect(`/app/tasks/${taskId}?error=${encodeURIComponent(error.message)}`);
  await supabase.from("audit_logs").insert({
    project_id: task.project_id,
    user_id: user.id,
    action: "task_submitted",
    details: { task_id: taskId },
  });
  revalidatePath(`/app/tasks/${taskId}`);
  redirect(`/app/tasks/${taskId}`);
}

export async function reviewTask(formData: FormData) {
  const { supabase, user } = await requireUser();
  const parsed = reviewSchema.safeParse({
    taskId: String(formData.get("task_id")),
    status: String(formData.get("status")),
    comment: String(formData.get("comment") ?? ""),
  });
  if (!parsed.success) redirect(`/app/tasks/${formData.get("task_id")}?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  const { data: task } = await supabase.from("tasks").select("project_id").eq("id", parsed.data.taskId).single();
  const { error } = await supabase.rpc("review_submitted_task", {
    reviewed_task_id: parsed.data.taskId,
    review_status: parsed.data.status,
    review_comment: parsed.data.comment,
  });
  if (error) redirect(`/app/tasks/${parsed.data.taskId}?error=${encodeURIComponent(error.message)}`);
  await supabase.from("audit_logs").insert({
    project_id: task?.project_id,
    user_id: user.id,
    action: `task_${parsed.data.status}`,
    details: { task_id: parsed.data.taskId, comment: parsed.data.comment },
  });
  revalidatePath(`/app/tasks/${parsed.data.taskId}`);
}

export async function openDispute(formData: FormData) {
  const taskId = String(formData.get("task_id"));
  const { supabase, user, task, project } = await assignedTask(taskId);
  requireActiveProject(taskId, project.status);
  if (task.status !== "rejected") redirect(`/app/tasks/${taskId}?error=Only rejected tasks can be disputed.`);
  const { data: review } = await supabase.from("reviews").select("comment").eq("task_id", taskId).eq("status", "rejected").order("created_at", { ascending: false }).limit(1).single();
  const { count } = await supabase.from("evidence").select("*", { count: "exact", head: true }).eq("task_id", taskId);
  const performerExplanation = String(formData.get("performer_explanation") ?? "");
  const reason = String(formData.get("reason") ?? "");
  const { data: dispute, error } = await supabase.from("disputes").insert({
    task_id: taskId,
    opened_by: user.id,
    reason,
    performer_explanation: performerExplanation,
    reviewer_rejection_reason: review?.comment || "No rejection reason recorded.",
  }).select("id").single();
  if (error || !dispute) redirect(`/app/tasks/${taskId}?error=${encodeURIComponent(error?.message || "Could not open dispute")}`);

  const recommendation = await generateDisputeRecommendation({
    taskTitle: task.title,
    performerExplanation,
    rejectionReason: review?.comment || "",
    evidenceCount: count || 0,
  });
  await supabase.rpc("attach_dispute_recommendation", { dispute_id: dispute.id, recommendation });
  await supabase.from("tasks").update({ status: "disputed" }).eq("id", taskId);
  await supabase.from("ai_reports").insert({
    project_id: task.project_id,
    type: "dispute",
    input_snapshot: { task_id: taskId, reason, performerExplanation },
    output: recommendation,
    model: process.env.OPENAI_API_KEY && process.env.AI_PROVIDER === "openai" ? process.env.OPENAI_MODEL || "gpt-5.5" : "mock-v1",
  });
  await supabase.from("audit_logs").insert({
    project_id: task.project_id,
    user_id: user.id,
    action: "dispute_opened",
    details: { task_id: taskId, dispute_id: dispute.id },
  });
  revalidatePath(`/app/tasks/${taskId}`);
  redirect(`/app/disputes/${dispute.id}`);
}

export async function resolveDispute(formData: FormData) {
  const { supabase, user } = await requireUser();
  const disputeId = String(formData.get("dispute_id"));
  const resolution = String(formData.get("resolution"));
  if (!["approve", "reject", "needs_changes"].includes(resolution)) {
    redirect(`/app/disputes/${disputeId}?error=Choose a valid resolution.`);
  }
  const { data: dispute } = await supabase.from("disputes").select("*, tasks(project_id)").eq("id", disputeId).single();
  if (!dispute) redirect("/app");
  if (dispute.status !== "open") {
    redirect(`/app/disputes/${disputeId}?error=This dispute has already been resolved.`);
  }
  const projectId = (dispute.tasks as unknown as { project_id: string }).project_id;
  const { data: project } = await supabase.from("projects").select("created_by, status").eq("id", projectId).single();
  if (project?.created_by !== user.id) redirect(`/app/disputes/${disputeId}?error=Only the project owner can resolve this dispute.`);
  if (project.status !== "active") {
    redirect(`/app/disputes/${disputeId}?error=Disputes can only be resolved while the project is active.`);
  }
  const taskStatus = resolution === "approve" ? "approved" : resolution === "reject" ? "rejected" : "needs_changes";
  const disputeResult = await supabase
    .from("disputes")
    .update({ status: "resolved", final_resolution: resolution })
    .eq("id", disputeId)
    .eq("status", "open");
  if (disputeResult.error) {
    redirect(`/app/disputes/${disputeId}?error=${encodeURIComponent(disputeResult.error.message)}`);
  }
  const taskResult = await supabase.from("tasks").update({
    status: taskStatus,
    approved_at: taskStatus === "approved" ? new Date().toISOString() : null,
  }).eq("id", dispute.task_id);
  if (taskResult.error) {
    redirect(`/app/disputes/${disputeId}?error=${encodeURIComponent(taskResult.error.message)}`);
  }
  await supabase.from("audit_logs").insert({
    project_id: projectId,
    user_id: user.id,
    action: "dispute_resolved",
    details: { dispute_id: disputeId, resolution },
  });
  revalidatePath(`/app/tasks/${dispute.task_id}`);
  redirect(`/app/tasks/${dispute.task_id}`);
}
