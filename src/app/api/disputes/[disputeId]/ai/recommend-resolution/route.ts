import { NextResponse } from "next/server";
import { normalizeAIError } from "@/lib/ai/gemini";
import { checkAIRateLimit } from "@/lib/ai/rate-limit";
import { generateDisputeRecommendation } from "@/lib/ai/service";
import { createClient } from "@/lib/supabase/server";

export async function POST(_request: Request, { params }: { params: Promise<{ disputeId: string }> }) {
  const { disputeId } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const guard = checkAIRateLimit(`${data.user.id}:dispute`);
  if (!guard.allowed) {
    return NextResponse.json({ error: "Too many AI requests. Please try again shortly." }, { status: 429, headers: { "Retry-After": String(guard.retryAfterSeconds) } });
  }

  const { data: dispute } = await supabase
    .from("disputes")
    .select("*, tasks(id, project_id, title, description, acceptance_criteria, expected_evidence_types, projects(success_criteria))")
    .eq("id", disputeId)
    .single();
  if (!dispute) return NextResponse.json({ error: "Dispute not found or inaccessible." }, { status: 404 });
  if (dispute.opened_by !== data.user.id) {
    return NextResponse.json({ error: "Only the dispute opener can refresh this AI recommendation." }, { status: 403 });
  }
  const task = dispute.tasks as unknown as {
    id: string;
    project_id: string;
    title: string;
    description: string;
    acceptance_criteria: unknown;
    expected_evidence_types: string[];
    projects: { success_criteria: unknown };
  };
  const [{ data: evidence }, { data: reviews }] = await Promise.all([
    supabase.from("evidence").select("id, type, url, description, metadata, created_at").eq("task_id", task.id),
    supabase.from("reviews").select("id, status, comment, created_at").eq("task_id", task.id),
  ]);
  const inputSnapshot = {
    disputeReason: dispute.reason,
    performerExplanation: dispute.performer_explanation,
    reviewerRejectionReason: dispute.reviewer_rejection_reason,
    task,
    submittedEvidence: evidence ?? [],
    reviewHistory: reviews ?? [],
    projectSuccessCriteria: task.projects.success_criteria,
  };

  try {
    const { output, model } = await generateDisputeRecommendation(inputSnapshot);
    await supabase.rpc("attach_dispute_recommendation", { dispute_id: disputeId, recommendation: output });
    await supabase.from("ai_reports").insert({
      project_id: task.project_id,
      task_id: task.id,
      dispute_id: disputeId,
      type: "dispute",
      input_snapshot: inputSnapshot,
      output,
      model,
      created_by: data.user.id,
    });
    return NextResponse.json(output);
  } catch (aiError) {
    return NextResponse.json({ error: normalizeAIError(aiError) }, { status: 502 });
  }
}
