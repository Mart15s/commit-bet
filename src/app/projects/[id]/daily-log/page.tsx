import { redirect } from "next/navigation";

export default async function ProjectDailyLogAliasPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/app/logs/new?project=${id}`);
}
