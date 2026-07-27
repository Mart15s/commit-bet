import { requireUser } from "@/lib/auth";

export async function GET() {
  const { supabase, user } = await requireUser();
  const [
    profile,
    teamMemberships,
    projectProfiles,
    assignments,
    pledges,
    dailyLogs,
    evidence,
    reviews,
    disputes,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("team_members").select("team_id, role, joined_at, teams(name)").eq("user_id", user.id),
    supabase.from("project_member_profiles").select("*").eq("user_id", user.id),
    supabase.from("task_assignments").select("task_id, assigned_reason, tasks(project_id, title, status)").eq("user_id", user.id),
    supabase.from("pledges").select("*").eq("user_id", user.id),
    supabase.from("daily_logs").select("*").eq("user_id", user.id),
    supabase.from("evidence").select("id, task_id, type, url, description, metadata, created_at").eq("user_id", user.id),
    supabase.from("reviews").select("*").eq("reviewer_id", user.id),
    supabase.from("disputes").select("*").eq("opened_by", user.id),
  ]);

  const failed = [
    profile,
    teamMemberships,
    projectProfiles,
    assignments,
    pledges,
    dailyLogs,
    evidence,
    reviews,
    disputes,
  ].find((result) => result.error);
  if (failed?.error) {
    return Response.json(
      { error: "Your export could not be prepared. Please retry or contact support." },
      { status: 500 },
    );
  }

  const payload = {
    exported_at: new Date().toISOString(),
    account: profile.data,
    team_memberships: teamMemberships.data,
    project_profiles: projectProfiles.data,
    task_assignments: assignments.data,
    virtual_pledges: pledges.data,
    daily_logs: dailyLogs.data,
    evidence_records: evidence.data,
    peer_reviews_authored: reviews.data,
    disputes_opened: disputes.data,
    note: "Stored evidence files are not embedded in this JSON export. Contact support if you need a reviewed file archive.",
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="commitbet-export-${new Date().toISOString().slice(0, 10)}.json"`,
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
