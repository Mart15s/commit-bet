"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generateDisputeRecommendation } from "@/lib/ai/service";
import { requireUser } from "@/lib/auth";
import { disputeResolutionSchema, evidenceSchema, reviewSchema, taskTransitionSchema } from "@/lib/validation";

async function assignedTask(taskId: string) {
  const { supabase, user } = await requireUser();
  const { data: task } = await supabase
    .from("tasks")
    .select("*, task_assignments!inner(user_id), projects(id, status)")
    .eq("id", taskId)
    .eq("task_assignments.user_id", user.id)
    .single();
  if (!task) redirect("/app");
  return { supabase, user, task };
}

export async function markInProgress(formData: FormData) {
  const parsed = taskTransitionSchema.safeParse({ taskId: String(formData.get("task_id") ?? "") });
  if (!parsed.success) redirect("/app?error=Invalid task.");

  const { supabase } = await requireUser();
  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("status")
    .eq("id", parsed.data.taskId)
    .single();
  if (taskError || !task) redirect(`/app/tasks/${parsed.data.taskId}?error=Task not found.`);

  const rpcName = ["needs_changes", "rejected"].includes(task.status)
    ? "reopen_task_after_changes"
    : "start_task";
  const { error } = await supabase.rpc(rpcName, { target_task_id: parsed.data.taskId });
  if (error) redirect(`/app/tasks/${parsed.data.taskId}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/app/tasks/${parsed.data.taskId}`);
}

export async function addEvidence(formData: FormData) {
  const taskId = String(formData.get("task_id"));
  const { supabase, user, task } = await assignedTask(taskId);
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
  const parsed = taskTransitionSchema.safeParse({ taskId: String(formData.get("task_id") ?? "") });
  if (!parsed.success) redirect("/app?error=Invalid task.");

  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("submit_task", { target_task_id: parsed.data.taskId });
  if (error) redirect(`/app/tasks/${parsed.data.taskId}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/app/tasks/${parsed.data.taskId}`);
  redirect(`/app/tasks/${parsed.data.taskId}`);
}

export async function reviewTask(formData: FormData) {
  const { supabase } = await requireUser();
  const parsed = reviewSchema.safeParse({
    taskId: String(formData.get("task_id")),
    status: String(formData.get("status")),
    comment: String(formData.get("comment") ?? ""),
  });
  if (!parsed.success) redirect(`/app?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  const { error } = await supabase.rpc("review_submitted_task", {
    reviewed_task_id: parsed.data.taskId,
    review_status: parsed.data.status,
    review_comment: parsed.data.comment,
  });
  if (error) redirect(`/app/tasks/${parsed.data.taskId}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/app/tasks/${parsed.data.taskId}`);
}

export async function openDispute(formData: FormData) {
  const taskId = String(formData.get("task_id"));
  const { supabase, user, task } = await assignedTask(taskId);
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
  const { error: recommendationError } = await supabase.rpc("attach_dispute_recommendation", {
    dispute_id: dispute.id,
    recommendation,
  });
  if (recommendationError) {
    redirect(`/app/tasks/${taskId}?error=${encodeURIComponent(recommendationError.message)}`);
  }
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
  const parsed = disputeResolutionSchema.safeParse({
    disputeId: String(formData.get("dispute_id") ?? ""),
    resolution: String(formData.get("resolution") ?? ""),
  });
  if (!parsed.success) redirect("/app?error=Invalid dispute resolution.");

  const { supabase } = await requireUser();
  const { data: taskId, error } = await supabase.rpc("resolve_project_dispute", {
    dispute_id: parsed.data.disputeId,
    resolution: parsed.data.resolution,
  });
  if (error || !taskId) {
    redirect(`/app/disputes/${parsed.data.disputeId}?error=${encodeURIComponent(error?.message || "Could not resolve dispute")}`);
  }
  revalidatePath(`/app/tasks/${taskId}`);
  redirect(`/app/tasks/${taskId}`);
}
