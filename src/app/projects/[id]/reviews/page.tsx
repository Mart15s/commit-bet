import { redirect } from "next/navigation";

export default async function ProjectReviewsAliasPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/app/approvals?project=${id}`);
}
