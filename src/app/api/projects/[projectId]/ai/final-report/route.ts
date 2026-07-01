import { NextResponse } from "next/server";
import { normalizeAIError } from "@/lib/ai/gemini";
import { checkAIRateLimit } from "@/lib/ai/rate-limit";
import { generateFinalReport } from "@/lib/ai/service";
import { createClient } from "@/lib/supabase/server";

export async function POST(_request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const guard = checkAIRateLimit(`${data.user.id}:final-report`, 6);
  if (!guard.allowed) {
    return NextResponse.json({ error: "Too many AI requests. Please try again shortly." }, { status: 429, headers: { "Retry-After": String(guard.retryAfterSeconds) } });
  }

  const { data: project } = await supabase.from("projects").select("*").eq("id", projectId).single();
  if (!project) return NextResponse.json({ error: "Project not found or inaccessible." }, { status: 404 });
  if (project.created_by !== data.user.id) return NextResponse.json({ error: "Only the project owner can generate the final report." }, { status: 403 });
  const { data: decision } = await supabase.from("final_decisions").select("id").eq("project_id", projectId).maybeSingle();
  if (decision) return NextResponse.json({ error: "A manually confirmed final decision already exists." }, { status: 409 });

  const [{ data: tasks }, { data: memberProfiles }, { data: logs }, { data: evidence }, { data: reviews }, { data: disputes }, { data: pledges }] = await Promise.all([
    supabase.from("tasks").select("*, task_assignments(user_id, assigned_reason)").eq("project_id", projectId),
    supabase.from("project_member_profiles").select("user_id, strengths, weaknesses, preferred_work_types, availability_minutes_per_day, notes, profiles(name)").eq("project_id", projectId),
    supabase.from("daily_logs").select("id, user_id, log_date, summary, blockers, next_steps, time_spent_minutes").eq("project_id", projectId),
    supabase.from("evidence").select("id, task_id, user_id, type, url, description, metadata, created_at, tasks!inner(project_id)").eq("tasks.project_id", projectId),
    supabase.from("reviews").select("id, task_id, reviewer_id, status, comment, created_at, tasks!inner(project_id)").eq("tasks.project_id", projectId),
    supabase.from("disputes").select("id, task_id, opened_by, reason, performer_explanation, reviewer_rejection_reason, ai_recommendation, final_resolution, status, created_at, tasks!inner(project_id)").eq("tasks.project_id", projectId),
    supabase.from("pledges").select("user_id, amount, currency, status").eq("project_id", projectId),
  ]);
  const inputSnapshot = {
    project: {
      title: project.title,
      goal: project.goal,
      successCriteria: project.success_criteria,
      startDate: project.start_date,
      endDate: project.end_date,
      status: project.status,
    },
    tasks: tasks ?? [],
    dailyLogs: logs ?? [],
    evidence: evidence ?? [],
    reviews: reviews ?? [],
    disputes: disputes ?? [],
    pledges: pledges ?? [],
    memberProfiles: memberProfiles ?? [],
  };

  try {
    const { output, model } = await generateFinalReport(inputSnapshot);
    await supabase.from("ai_reports").insert({
      project_id: projectId,
      type: "final",
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
