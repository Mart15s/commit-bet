"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { normalizeAIError } from "@/lib/ai/gemini";
import { generateFinalReport } from "@/lib/ai/service";
import { requireProjectOwner } from "@/lib/auth";
import { validateReturnPercentage } from "@/lib/progress";

export async function generateFinal(formData: FormData) {
  const projectId = String(formData.get("project_id"));
  const { supabase, user, project } = await requireProjectOwner(projectId);
  if (project.status !== "active") {
    redirect(`/app/projects/${projectId}/final?error=Only active projects can generate a final report.`);
  }
  const [{ data: tasks }, { data: members }, { data: logs }, { data: evidence }, { data: reviews }, { data: disputes }] = await Promise.all([
    supabase.from("tasks").select("id, title, description, acceptance_criteria, expected_evidence_types, priority, status, due_date, ai_generated, task_assignments(user_id, assigned_reason)").eq("project_id", projectId),
    supabase.from("project_member_profiles").select("user_id, strengths, weaknesses, preferred_work_types, availability_minutes_per_day, notes, profiles(name)").eq("project_id", projectId),
    supabase.from("daily_logs").select("id, user_id, log_date, summary, blockers, next_steps, time_spent_minutes").eq("project_id", projectId),
    supabase.from("evidence").select("id, task_id, user_id, type, url, description, metadata, created_at, tasks!inner(project_id)").eq("tasks.project_id", projectId),
    supabase.from("reviews").select("id, task_id, reviewer_id, status, comment, created_at, tasks!inner(project_id)").eq("tasks.project_id", projectId),
    supabase.from("disputes").select("id, task_id, opened_by, reason, performer_explanation, reviewer_rejection_reason, ai_recommendation, final_resolution, status, created_at, tasks!inner(project_id)").eq("tasks.project_id", projectId),
  ]);
  const contributions = [];
  for (const member of members ?? []) {
    const { data: assigned } = await supabase.from("task_assignments").select("task_id, tasks(status)").eq("user_id", member.user_id);
    const taskIds = (assigned ?? []).map((row) => row.task_id);
    const { count: evidenceCount } = taskIds.length
      ? await supabase.from("evidence").select("*", { count: "exact", head: true }).eq("user_id", member.user_id).in("task_id", taskIds)
      : { count: 0 };
    contributions.push({
      user_id: member.user_id,
      name: (member.profiles as unknown as { name: string }).name,
      approved: (assigned ?? []).filter((row) => (row.tasks as unknown as { status: string }).status === "approved").length,
      evidence: evidenceCount || 0,
    });
  }

  const input = {
    title: project.title,
    goal: project.goal,
    successCriteria: (project.success_criteria as Array<{ criterion: string }>).map((item) => item.criterion),
    projectPeriod: { startDate: project.start_date, endDate: project.end_date },
    tasks: tasks ?? [],
    dailyLogs: logs ?? [],
    evidence: evidence ?? [],
    reviews: reviews ?? [],
    disputes: disputes ?? [],
    memberProfiles: members ?? [],
    members: contributions,
  };
  try {
    const { output: report, model } = await generateFinalReport(input);
    await supabase.from("ai_reports").insert({
      project_id: projectId,
      type: "final",
      input_snapshot: input,
      output: report,
      model,
      created_by: user.id,
    });
    await supabase.from("audit_logs").insert({
      project_id: projectId,
      user_id: user.id,
      action: "final_report_generated",
      details: { confidence: report.confidence },
    });
  } catch (error) {
    redirect(`/app/projects/${projectId}/final?error=${encodeURIComponent(normalizeAIError(error))}`);
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
