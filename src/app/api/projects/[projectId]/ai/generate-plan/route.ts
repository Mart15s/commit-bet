import { NextResponse } from "next/server";
import { normalizeAIError } from "@/lib/ai/gemini";
import { checkAIRateLimit } from "@/lib/ai/rate-limit";
import { generateProjectPlan } from "@/lib/ai/service";
import { createClient } from "@/lib/supabase/server";

export async function POST(_request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const guard = checkAIRateLimit(`${data.user.id}:project-plan`);
  if (!guard.allowed) {
    return NextResponse.json({ error: "Too many AI requests. Please try again shortly." }, { status: 429, headers: { "Retry-After": String(guard.retryAfterSeconds) } });
  }

  const { data: project } = await supabase.from("projects").select("*").eq("id", projectId).single();
  if (!project) return NextResponse.json({ error: "Project not found or inaccessible." }, { status: 404 });
  if (project.created_by !== data.user.id) return NextResponse.json({ error: "Only the project owner can generate a plan." }, { status: 403 });
  if (project.status !== "draft") return NextResponse.json({ error: "Only draft projects can generate a plan." }, { status: 409 });

  const { data: memberProfiles } = await supabase
    .from("project_member_profiles")
    .select("user_id, strengths, weaknesses, preferred_work_types, availability_minutes_per_day, notes, profiles(name)")
    .eq("project_id", projectId);
  const missingProfiles = (memberProfiles ?? []).filter((member) =>
    !member.strengths?.length
    || !member.preferred_work_types?.length
    || !member.availability_minutes_per_day
  );
  if (!memberProfiles?.length || missingProfiles.length) {
    return NextResponse.json({ error: "Complete every member skill profile before generating the AI plan." }, { status: 400 });
  }

  const inputSnapshot = {
    title: project.title,
    description: project.description,
    goal: project.goal,
    successCriteria: (project.success_criteria as Array<{ criterion: string }>).map((item) => item.criterion),
    startDate: project.start_date,
    endDate: project.end_date,
    durationDays: Math.max(1, Math.ceil((new Date(`${project.end_date}T00:00:00Z`).getTime() - new Date(`${project.start_date}T00:00:00Z`).getTime()) / 86_400_000) + 1),
    members: (memberProfiles ?? []).map((member) => ({
      user_id: member.user_id,
      name: (member.profiles as unknown as { name: string }).name,
      strengths: member.strengths,
      weaknesses: member.weaknesses,
      preferred_work_types: member.preferred_work_types,
      availability_minutes_per_day: member.availability_minutes_per_day,
      notes: member.notes,
    })),
  };

  try {
    const { output, model } = await generateProjectPlan(inputSnapshot);
    const { data: oldTasks } = await supabase.from("tasks").select("id").eq("project_id", projectId).eq("ai_generated", true);
    if (oldTasks?.length) await supabase.from("tasks").delete().in("id", oldTasks.map((task) => task.id));
    await supabase.from("ai_reports").insert({
      project_id: projectId,
      type: "plan",
      input_snapshot: inputSnapshot,
      output,
      model,
      created_by: data.user.id,
    });
    for (const task of output.tasks) {
      const { data: inserted, error: taskError } = await supabase.from("tasks").insert({
        project_id: projectId,
        title: task.title,
        description: task.description,
        acceptance_criteria: task.acceptanceCriteria,
        expected_evidence_types: task.expectedEvidenceTypes,
        priority: task.priority,
        due_date: task.dueDate,
        ai_generated: true,
      }).select("id").single();
      if (taskError || !inserted) throw taskError || new Error("Task insert failed");
      const { error: assignmentError } = await supabase.from("task_assignments").insert({
        task_id: inserted.id,
        user_id: task.assignedUserId,
        assigned_reason: task.assignmentReason,
      });
      if (assignmentError) throw assignmentError;
    }
    return NextResponse.json(output);
  } catch (aiError) {
    return NextResponse.json({ error: normalizeAIError(aiError) }, { status: 502 });
  }
}
