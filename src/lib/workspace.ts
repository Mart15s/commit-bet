import type { SupabaseClient } from "@supabase/supabase-js";
import type { DashboardProps } from "@/components/dashboard";

/** All reads use the authenticated SSR client and existing RLS. */
export async function loadWorkspace(
  supabase: SupabaseClient,
  userId: string,
): Promise<DashboardProps> {
  const [projects, tasks, pledges, evidence, teams] = await Promise.all([
    supabase
      .from("projects")
      .select("id, title, goal, status, start_date, end_date")
      .order("created_at", { ascending: false }),
    supabase
      .from("tasks")
      .select(
        "id, project_id, title, due_date, status, priority, task_assignments(user_id)",
      ),
    supabase
      .from("pledges")
      .select("project_id, user_id, amount, currency")
      .eq("user_id", userId)
      .eq("currency", "POINTS"),
    supabase
      .from("evidence")
      .select("id, task_id, description, type, created_at")
      .order("created_at", { ascending: false })
      .limit(4),
    supabase.from("teams").select("id").limit(1),
  ]);
  return {
    projects: projects.data ?? [],
    tasks: tasks.data ?? [],
    pledges: pledges.data ?? [],
    evidence: evidence.data ?? [],
    hasTeam: !!teams.data?.length,
    userId,
    initialDate: new Date().toISOString().slice(0, 10),
    loadError: [projects, tasks, pledges, evidence, teams].some(
      (result) => !!result.error,
    ),
  };
}
