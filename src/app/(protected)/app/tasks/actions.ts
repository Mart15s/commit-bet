"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  generateDisputeRecommendation,
  getAIProviderMetadata,
  reviewEvidence,
} from "@/lib/ai/service";
import { requireUser } from "@/lib/auth";
import {
  MAX_TEAM_STORAGE_BYTES,
  safeEvidenceExtension,
  validateEvidenceFile,
} from "@/lib/evidence";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  disputeResolutionSchema,
  evidenceDeleteSchema,
  evidenceSchema,
  reviewSchema,
  taskTransitionSchema,
} from "@/lib/validation";

async function assignedTask(taskId: string) {
  const { supabase, user } = await requireUser();
  const { data: task } = await supabase
    .from("tasks")
    .select("*, task_assignments!inner(user_id), projects(id, team_id, created_by, status)")
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
  if (["submitted", "approved", "disputed"].includes(task.status)) {
    redirect(`/app/tasks/${taskId}?error=Evidence cannot be changed while this task is locked for review.`);
  }

  let storagePath: string | undefined;
  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    const validationError = validateEvidenceFile(file);
    if (validationError) {
      redirect(`/app/tasks/${taskId}?error=${encodeURIComponent(validationError)}`);
    }

    const projectRelation = task.projects as {
      team_id: string;
    };
    const { data: teamEvidence, error: usageError } = await supabase
      .from("evidence")
      .select("metadata, tasks!inner(projects!inner(team_id))")
      .eq("tasks.projects.team_id", projectRelation.team_id);
    if (usageError) {
      redirect(`/app/tasks/${taskId}?error=Team storage usage could not be checked.`);
    }
    const usedBytes = (teamEvidence ?? []).reduce((total, item) => {
      const size = Number((item.metadata as { file_size?: number } | null)?.file_size ?? 0);
      return total + (Number.isFinite(size) && size > 0 ? size : 0);
    }, 0);
    if (usedBytes + file.size > MAX_TEAM_STORAGE_BYTES) {
      redirect(`/app/tasks/${taskId}?error=This upload would exceed the team evidence storage limit.`);
    }

    storagePath = `${task.project_id}/${user.id}/${crypto.randomUUID()}${safeEvidenceExtension(file.name)}`;
    const upload = await createAdminClient().storage.from("evidence").upload(storagePath, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });
    if (upload.error) {
      redirect(`/app/tasks/${taskId}?error=The evidence file could not be uploaded.`);
    }
  }

  const { data: evidence, error } = await supabase.from("evidence").insert({
    task_id: taskId,
    user_id: user.id,
    type: parsed.data.type,
    url: parsed.data.url || null,
    description: parsed.data.description,
    metadata: storagePath ? {
      storage_path: storagePath,
      file_name: (file as File).name,
      file_size: (file as File).size,
      mime_type: (file as File).type,
      content_reviewed_by_ai: false,
    } : {},
  }).select("id").single();
  if (error || !evidence) {
    if (storagePath) {
      await createAdminClient().storage.from("evidence").remove([storagePath]);
    }
    redirect(`/app/tasks/${taskId}?error=The evidence record could not be saved. The uploaded file was rolled back.`);
  }
  const { error: auditError } = await supabase.from("audit_logs").insert({
    project_id: task.project_id,
    user_id: user.id,
    action: "evidence_added",
    details: { task_id: taskId, evidence_id: evidence.id, type: parsed.data.type },
  });
  if (auditError) {
    await supabase.from("evidence").delete().eq("id", evidence.id);
    if (storagePath) await createAdminClient().storage.from("evidence").remove([storagePath]);
    redirect(`/app/tasks/${taskId}?error=Evidence could not be audited, so the upload was rolled back.`);
  }
  revalidatePath(`/app/tasks/${taskId}`);
}

export async function deleteEvidence(formData: FormData) {
  const parsed = evidenceDeleteSchema.safeParse({
    evidenceId: String(formData.get("evidence_id") ?? ""),
    confirmed: formData.get("confirm_delete") === "yes",
  });
  if (!parsed.success) redirect("/app?error=Confirm the evidence deletion.");

  const { supabase, user } = await requireUser();
  const { data: evidence } = await supabase
    .from("evidence")
    .select("id, task_id, user_id, metadata, tasks!inner(project_id, projects!inner(created_by, status))")
    .eq("id", parsed.data.evidenceId)
    .single();
  if (!evidence) redirect("/app?error=Evidence not found.");

  const task = evidence.tasks as unknown as {
    project_id: string;
    projects: { created_by: string; status: string };
  };
  if (evidence.user_id !== user.id && task.projects.created_by !== user.id) {
    redirect(`/app/tasks/${evidence.task_id}?error=You cannot delete this evidence.`);
  }
  if (task.projects.status === "completed") {
    redirect(`/app/tasks/${evidence.task_id}?error=Finalized project evidence is preserved for the audit history.`);
  }

  await supabase.from("audit_logs").insert({
    project_id: task.project_id,
    user_id: user.id,
    action: "evidence_deletion_requested",
    details: { task_id: evidence.task_id, evidence_id: evidence.id },
  });

  const storagePath = (evidence.metadata as { storage_path?: string } | null)?.storage_path;
  const mutationClient =
    evidence.user_id === user.id ? supabase : createAdminClient();
  if (storagePath) {
    const removal = await createAdminClient().storage.from("evidence").remove([storagePath]);
    if (removal.error) {
      redirect(`/app/tasks/${evidence.task_id}?error=The stored file could not be removed. The evidence record was kept.`);
    }
  }

  const { error } = await mutationClient.from("evidence").delete().eq("id", evidence.id);
  if (error) {
    redirect(`/app/tasks/${evidence.task_id}?error=The evidence record could not be removed.`);
  }
  await supabase.from("audit_logs").insert({
    project_id: task.project_id,
    user_id: user.id,
    action: "evidence_deleted",
    details: { task_id: evidence.task_id, evidence_id: evidence.id },
  });
  revalidatePath(`/app/tasks/${evidence.task_id}`);
}

export async function requestEvidenceAIReview(formData: FormData) {
  const parsed = taskTransitionSchema.safeParse({
    taskId: String(formData.get("task_id") ?? ""),
  });
  if (!parsed.success) redirect("/app?error=Invalid task.");

  const { supabase, user } = await requireUser();
  const { data: task } = await supabase
    .from("tasks")
    .select("id, project_id, title, description, acceptance_criteria, expected_evidence_types, status, task_assignments(user_id)")
    .eq("id", parsed.data.taskId)
    .single();
  if (!task) redirect("/app?error=Task not found.");

  const { count } = await supabase
    .from("ai_reports")
    .select("*", { count: "exact", head: true })
    .eq("project_id", task.project_id)
    .eq("type", "evidence_review");
  if ((count ?? 0) >= 20) {
    redirect(`/app/tasks/${task.id}?error=This sprint has reached its AI evidence review limit.`);
  }

  const { data: evidence, error: evidenceError } = await supabase
    .from("evidence")
    .select("id, type, url, description, metadata, created_at")
    .eq("task_id", task.id)
    .order("created_at");
  if (evidenceError || !evidence?.length) {
    redirect(`/app/tasks/${task.id}?error=Add evidence before asking Gemini for a recommendation.`);
  }

  const input = {
    task: {
      title: task.title,
      description: task.description,
      acceptance_criteria: task.acceptance_criteria,
      expected_evidence_types: task.expected_evidence_types,
      status: task.status,
    },
    evidence: evidence.map((item) => {
      const metadata = item.metadata as {
        file_name?: string;
        file_size?: number;
        mime_type?: string;
        extracted_text?: string;
      } | null;
      return {
        type: item.type,
        description: item.description,
        url: item.url,
        file_name: metadata?.file_name,
        file_size: metadata?.file_size,
        mime_type: metadata?.mime_type,
        extracted_text: metadata?.extracted_text?.slice(0, 12_000),
        content_was_extracted: Boolean(metadata?.extracted_text),
        created_at: item.created_at,
      };
    }),
    reviewer_context: String(formData.get("reviewer_context") ?? "").slice(0, 2000),
  };

  const startedAt = Date.now();
  let recommendation;
  try {
    recommendation = await reviewEvidence(input);
  } catch {
    redirect(`/app/tasks/${task.id}?error=Gemini could not review this evidence. No task status was changed.`);
  }
  const metadata = getAIProviderMetadata();
  const admin = createAdminClient();
  const { error: reportError } = await admin.from("ai_reports").insert({
    project_id: task.project_id,
    task_id: task.id,
    type: "evidence_review",
    input_snapshot: input,
    output: recommendation,
    provider: metadata.provider,
    model: metadata.model,
    created_by: user.id,
    duration_ms: Date.now() - startedAt,
    status: "succeeded",
  });
  if (reportError) {
    redirect(`/app/tasks/${task.id}?error=The Gemini recommendation could not be saved. No task status was changed.`);
  }
  await supabase.from("audit_logs").insert({
    project_id: task.project_id,
    user_id: user.id,
    action: "ai_evidence_review_generated",
    details: { task_id: task.id },
  });
  revalidatePath(`/app/tasks/${task.id}`);
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
  const { count: disputeAnalysisCount, error: disputeCountError } = await supabase
    .from("ai_reports")
    .select("*", { count: "exact", head: true })
    .eq("project_id", task.project_id)
    .eq("type", "dispute");
  if (disputeCountError) {
    redirect(`/app/tasks/${taskId}?error=Dispute AI usage could not be checked.`);
  }
  if ((disputeAnalysisCount ?? 0) >= 3) {
    redirect(`/app/tasks/${taskId}?error=This sprint has reached its three AI dispute analyses.`);
  }
  const [{ data: review }, { data: evidence }, { data: reviewHistory }] = await Promise.all([
    supabase.from("reviews").select("comment").eq("task_id", taskId).eq("status", "rejected").order("created_at", { ascending: false }).limit(1).single(),
    supabase.from("evidence").select("type, url, description, metadata, created_at").eq("task_id", taskId).order("created_at"),
    supabase.from("reviews").select("status, comment, created_at").eq("task_id", taskId).order("created_at"),
  ]);
  const performerExplanation = String(formData.get("performer_explanation") ?? "");
  const reason = String(formData.get("reason") ?? "");
  const { data: disputeId, error } = await supabase.rpc("open_project_dispute", {
    target_task_id: taskId,
    dispute_reason: reason,
    performer_argument: performerExplanation,
    rejection_reason: review?.comment || "No rejection reason recorded.",
  });
  if (error || !disputeId) {
    redirect(`/app/tasks/${taskId}?error=${encodeURIComponent(error?.message || "Could not open dispute")}`);
  }

  const mediatorInput = {
    taskTitle: task.title,
    performerExplanation,
    rejectionReason: review?.comment || "",
    evidenceCount: evidence?.length || 0,
    task: {
      description: task.description,
      acceptance_criteria: task.acceptance_criteria,
      expected_evidence_types: task.expected_evidence_types,
    },
    evidence: (evidence ?? []).map((item) => {
      const safeMetadata = item.metadata as {
        file_name?: string;
        file_size?: number;
        mime_type?: string;
        extracted_text?: string;
      } | null;
      return {
        type: item.type,
        url: item.url,
        description: item.description,
        safe_metadata: {
          file_name: safeMetadata?.file_name,
          file_size: safeMetadata?.file_size,
          mime_type: safeMetadata?.mime_type,
          extracted_text: safeMetadata?.extracted_text?.slice(0, 12_000),
          content_was_extracted: Boolean(safeMetadata?.extracted_text),
        },
        created_at: item.created_at,
      };
    }),
    review_history: reviewHistory ?? [],
  };
  let recommendation;
  const startedAt = Date.now();
  try {
    recommendation = await generateDisputeRecommendation(mediatorInput);
  } catch {
    redirect(`/app/disputes/${disputeId}?error=The dispute was opened, but Gemini could not create a recommendation. A human owner can still review it.`);
  }
  const admin = createAdminClient();
  const { error: recommendationError } = await admin.rpc("attach_dispute_recommendation_server", {
    target_dispute_id: disputeId,
    actor_id: user.id,
    recommendation,
  });
  if (recommendationError) {
    redirect(`/app/tasks/${taskId}?error=${encodeURIComponent(recommendationError.message)}`);
  }
  const aiMetadata = getAIProviderMetadata();
  const { error: reportError } = await admin.from("ai_reports").insert({
    project_id: task.project_id,
    task_id: taskId,
    type: "dispute",
    input_snapshot: { task_id: taskId, reason, ...mediatorInput },
    output: recommendation,
    provider: aiMetadata.provider,
    model: aiMetadata.model,
    created_by: user.id,
    duration_ms: Date.now() - startedAt,
    status: "succeeded",
  });
  if (reportError) {
    redirect(`/app/disputes/${disputeId}?error=The dispute was opened and the task was locked, but its AI report could not be saved.`);
  }
  revalidatePath(`/app/tasks/${taskId}`);
  redirect(`/app/disputes/${disputeId}`);
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
