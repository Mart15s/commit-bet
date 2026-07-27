"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generateFinalReport, getAIProviderMetadata } from "@/lib/ai/service";
import { requireProjectOwner, requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createSupabaseFinalAuditDataSource,
  loadFinalAuditInput,
  reconcileFinalReport,
} from "@/lib/final-audit";
import {
  projectFinalizationInputSchema,
  projectFinalizationResultSchema,
} from "@/lib/validation";

export type FinalDecisionActionState = {
  status: "idle" | "error" | "success";
  message?: string;
};

function failedFinalization(message: string): FinalDecisionActionState {
  return {
    status: "error",
    message: `${message} The project was not finalized, no pledge statuses were changed, and you can retry.`,
  };
}

function safeFinalizationError(message: string) {
  if (message.includes("Only the project owner") || message.includes("Project not found")) {
    return "Only this project owner can confirm the final decision.";
  }
  if (message.includes("Only active projects")) {
    return "Only an active project can be finalized.";
  }
  if (message.includes("already finalized") || message.includes("already has a final decision")) {
    return "This project already has a final decision. Refresh to see it.";
  }
  if (message.includes("saved final report") || message.includes("final report")) {
    return "The selected saved final report is not valid for this project.";
  }
  if (message.includes("dispute")) {
    return "Resolve every open or escalated dispute before finalizing.";
  }
  if (
    message.includes("project member")
    || message.includes("project pledge")
    || message.includes("Final action")
  ) {
    return "The final action must cover every project member and pledge exactly once.";
  }
  if (message.includes("Idempotency key")) {
    return "This retry no longer matches the original final confirmation.";
  }
  return "The atomic finalization transaction failed.";
}

export async function generateFinal(formData: FormData) {
  const projectId = String(formData.get("project_id"));
  const { supabase, user, project } = await requireProjectOwner(projectId);
  if (project.status !== "active") {
    redirect(`/app/projects/${projectId}/final?error=Only active projects can generate a final report.`);
  }
  try {
    const input = await loadFinalAuditInput(
      createSupabaseFinalAuditDataSource(supabase),
      project,
    );
    const startedAt = Date.now();
    const report = reconcileFinalReport(
      input,
      await generateFinalReport(input),
    );
    const aiMetadata = getAIProviderMetadata();
    const { error: reportError } = await createAdminClient().from("ai_reports").insert({
      project_id: projectId,
      type: "final",
      input_snapshot: input,
      output: report,
      provider: aiMetadata.provider,
      model: aiMetadata.model,
      created_by: user.id,
      duration_ms: Date.now() - startedAt,
      status: "succeeded",
    });
    if (reportError) throw new Error(reportError.message);
    await supabase.from("audit_logs").insert({
      project_id: projectId,
      user_id: user.id,
      action: "final_report_generated",
      details: { confidence_score: report.confidence_score },
    });
  } catch (error) {
    redirect(`/app/projects/${projectId}/final?error=${encodeURIComponent(error instanceof Error ? error.message : "Report generation failed")}`);
  }
  revalidatePath(`/app/projects/${projectId}/final`);
}

export async function confirmFinalDecision(
  _previousState: FinalDecisionActionState,
  formData: FormData,
): Promise<FinalDecisionActionState> {
  if (formData.has("pledge_status") || formData.has("status")) {
    return failedFinalization(
      "Pledge status is database-owned and cannot be submitted.",
    );
  }
  const memberIds = formData.getAll("member_id").map(String);
  const returnPercentages = formData.getAll("return_percentage");
  if (memberIds.length !== returnPercentages.length) {
    return failedFinalization("The member decision payload is incomplete.");
  }

  const suppliedIdempotencyKey = String(
    formData.get("idempotency_key") ?? "",
  );
  const parsed = projectFinalizationInputSchema.safeParse({
    projectId: String(formData.get("project_id") ?? ""),
    finalReportId: String(formData.get("final_report_id") ?? ""),
    idempotencyKey: suppliedIdempotencyKey || randomUUID(),
    humanConfirmation: formData.get("human_confirmation") === "yes",
    confirmationNote: String(formData.get("confirmation_note") ?? ""),
    memberActions: memberIds.map((userId, index) => ({
      userId,
      returnPercentage: Number(returnPercentages[index]),
    })),
  });
  if (!parsed.success) {
    return failedFinalization(parsed.error.issues[0].message);
  }

  const { supabase, user } = await requireUser();
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, created_by")
    .eq("id", parsed.data.projectId)
    .single();
  if (
    projectError
    || !project
    || project.created_by !== user.id
  ) {
    return failedFinalization(
      "Only this project owner can confirm the final decision.",
    );
  }

  const { data, error } = await supabase.rpc("finalize_project", {
    p_project_id: parsed.data.projectId,
    p_final_report_id: parsed.data.finalReportId,
    p_idempotency_key: parsed.data.idempotencyKey,
    p_final_action: parsed.data.memberActions.map((action) => ({
      user_id: action.userId,
      return_percentage: action.returnPercentage,
    })),
    p_confirmation_note: parsed.data.confirmationNote || null,
  });
  if (error) {
    return failedFinalization(safeFinalizationError(error.message));
  }

  const result = projectFinalizationResultSchema.safeParse(data);
  if (
    !result.success
    || result.data.project_id !== parsed.data.projectId
    || result.data.final_report_id !== parsed.data.finalReportId
    || result.data.confirmed_by !== user.id
    || result.data.pledge_count !== parsed.data.memberActions.length
  ) {
    return {
      status: "error",
      message: "The committed database result could not be confirmed. Refresh before retrying; the same request key prevents a duplicate decision.",
    };
  }

  revalidatePath("/app");
  revalidatePath(`/app/projects/${parsed.data.projectId}`);
  revalidatePath(`/app/projects/${parsed.data.projectId}/final`);
  return {
    status: "success",
    message: result.data.replayed
      ? "This final decision was already committed. No duplicate was created."
      : "Final decision confirmed. Every project pledge is now finalized.",
  };
}
