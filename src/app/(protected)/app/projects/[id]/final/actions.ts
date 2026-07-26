"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generateFinalReport } from "@/lib/ai/service";
import { requireProjectOwner } from "@/lib/auth";
import {
  createSupabaseFinalAuditDataSource,
  loadFinalAuditInput,
  reconcileFinalReport,
} from "@/lib/final-audit";
import { validateReturnPercentage } from "@/lib/progress";

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
    const report = reconcileFinalReport(
      input,
      await generateFinalReport(input),
    );
    const { error: reportError } = await supabase.from("ai_reports").insert({
      project_id: projectId,
      type: "final",
      input_snapshot: input,
      output: report,
      model: process.env.OPENAI_API_KEY && process.env.AI_PROVIDER === "openai" ? process.env.OPENAI_MODEL || "gpt-5.5" : "mock-v1",
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

export async function confirmFinalDecision(formData: FormData) {
  const projectId = String(formData.get("project_id"));
  const { supabase, user, project } = await requireProjectOwner(projectId);
  if (project.status !== "active") {
    redirect(`/app/projects/${projectId}/final?error=Only active projects can be completed.`);
  }
  if (formData.get("human_confirmation") !== "yes") redirect(`/app/projects/${projectId}/final?error=Human confirmation is required.`);
  const { data: report } = await supabase.from("ai_reports").select("output").eq("project_id", projectId).eq("type", "final").order("created_at", { ascending: false }).limit(1).single();
  if (!report) redirect(`/app/projects/${projectId}/final?error=Generate a final report first.`);
  const { data: pledges } = await supabase.from("pledges").select("user_id, profiles(name)").eq("project_id", projectId);
  const decisions = (pledges ?? []).map((pledge) => ({
    userId: pledge.user_id,
    name: (pledge.profiles as unknown as { name: string }).name,
    returnPercentage: Number(formData.get(`return_${pledge.user_id}`)),
  }));
  if (decisions.some((decision) => !validateReturnPercentage(decision.returnPercentage))) {
    redirect(`/app/projects/${projectId}/final?error=Every pledge return must be between 0 and 100 percent.`);
  }
  const finalAction = Object.fromEntries(decisions.map((decision) => [
    decision.userId,
    { name: decision.name, return_percentage: decision.returnPercentage },
  ]));
  const { error } = await supabase.from("final_decisions").insert({
    project_id: projectId,
    ai_recommendation: report.output,
    confirmed_by: user.id,
    final_action: finalAction,
  });
  if (error) redirect(`/app/projects/${projectId}/final?error=${encodeURIComponent(error.message)}`);
  await supabase.from("projects").update({ status: "completed" }).eq("id", projectId);
  await supabase.from("audit_logs").insert({
    project_id: projectId,
    user_id: user.id,
    action: "final_decision_confirmed",
    details: { final_action: finalAction },
  });
  revalidatePath("/app");
  redirect(`/app/projects/${projectId}/final`);
}
