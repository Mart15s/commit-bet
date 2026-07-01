import { redirect } from "next/navigation";

export default async function ProjectsAliasPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  redirect(params.status ? `/app/projects?status=${encodeURIComponent(params.status)}` : "/app/projects");
}
