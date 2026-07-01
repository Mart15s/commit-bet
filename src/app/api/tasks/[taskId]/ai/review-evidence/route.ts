import { NextResponse } from "next/server";
import { normalizeAIError } from "@/lib/ai/gemini";
import { checkAIRateLimit } from "@/lib/ai/rate-limit";
import { reviewEvidence } from "@/lib/ai/service";
import { createClient } from "@/lib/supabase/server";

export async function POST(_request: Request, { params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const guard = checkAIRateLimit(`${data.user.id}:evidence-review`);
  if (!guard.allowed) {
    return NextResponse.json({ error: "Too many AI requests. Please try again shortly." }, { status: 429, headers: { "Retry-After": String(guard.retryAfterSeconds) } });
  }

  const { data: task } = await supabase
    .from("tasks")
    .select("id, project_id, title, description, acceptance_criteria, expected_evidence_types, status, task_assignments(user_id, profiles(name))")
    .eq("id", taskId)
    .single();
  if (!task) return NextResponse.json({ error: "Task not found or inaccessible." }, { status: 404 });

  const [{ data: evidence }, { data: logs }] = await Promise.all([
    supabase.from("evidence").select("id, type, url, description, metadata, created_at, user_id").eq("task_id", taskId).order("created_at", { ascending: false }),
    supabase.from("daily_log_tasks").select("daily_logs(id, user_id, log_date, summary, blockers, next_steps)").eq("task_id", taskId),
  ]);

  const inputSnapshot = {
    task: {
      title: task.title,
      description: task.description,
      acceptanceCriteria: task.acceptance_criteria,
      expectedEvidenceTypes: task.expected_evidence_types,
      status: task.status,
      assignedUser: task.task_assignments,
    },
    evidence: evidence ?? [],
    dailyLogs: (logs ?? []).map((row) => row.daily_logs),
  };

  try {
    const { output, model } = await reviewEvidence(inputSnapshot);
    await supabase.from("ai_reports").insert({
      project_id: task.project_id,
      task_id: taskId,
      type: "evidence_review",
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
