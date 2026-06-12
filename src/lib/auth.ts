import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/login");
  return { supabase, user: data.user };
}

export async function requireProjectMember(projectId: string) {
  const { supabase, user } = await requireUser();
  const { data: project } = await supabase
    .from("projects")
    .select("*, teams!inner(name, owner_id)")
    .eq("id", projectId)
    .single();
  if (!project) redirect("/app");
  return { supabase, user, project };
}

export async function requireProjectOwner(projectId: string) {
  const result = await requireProjectMember(projectId);
  if (result.project.created_by !== result.user.id) redirect(`/app/projects/${projectId}`);
  return result;
}

