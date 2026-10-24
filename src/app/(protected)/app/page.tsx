import { Dashboard } from "@/components/dashboard";
import { requireUser } from "@/lib/auth";
import { loadWorkspace } from "@/lib/workspace";

export default async function DashboardPage() {
  const { supabase, user } = await requireUser();
  return <Dashboard {...await loadWorkspace(supabase, user.id)} />;
}
