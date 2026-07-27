import Link from "next/link";
import type { ReactNode } from "react";
import { Card } from "@/components/ui";

export function LegalPage({
  title,
  summary,
  children,
}: {
  title: string;
  summary: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto min-h-[70vh] max-w-3xl px-5 py-10 sm:px-8 sm:py-16">
      <Link className="text-sm font-black text-primary" href="/">← CommitBet</Link>
      <p className="mt-8 text-xs font-black uppercase tracking-[.16em] text-amber-300">Public beta</p>
      <h1 className="mt-2 text-4xl font-black tracking-[-.04em]">{title}</h1>
      <p className="mt-4 leading-7 text-muted-foreground">{summary}</p>
      <Card className="prose-beta mt-8 space-y-6">{children}</Card>
    </main>
  );
}
