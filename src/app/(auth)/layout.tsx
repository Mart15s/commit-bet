"use client";

import Link from "next/link";
import { Brain, ClipboardCheck, FileCheck2, ShieldCheck } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useI18n } from "@/components/language-provider";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useI18n();

  return (
    <main className="grid min-h-screen px-5 py-6 sm:px-8 lg:grid-cols-[1fr_.9fr] lg:gap-10">
      <section className="hidden min-h-[calc(100vh-3rem)] rounded-[1.5rem] border border-border bg-surface p-8 text-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-start justify-between gap-4">
          <Link href="/" className="text-xl font-bold tracking-[-.03em]">
            {t("app.brand")}
          </Link>
          <LanguageSwitcher compact />
        </div>
        <div className="max-w-xl">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-primary">
            {t("auth.accountability")}
          </p>
          <h1 className="mt-3 text-5xl font-bold leading-[.96] tracking-[-.055em]">
            {t("auth.sideTitle")}
          </h1>
          <p className="mt-5 leading-7 text-muted-foreground">
            {t("auth.sideCopy")}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            [FileCheck2, t("auth.evidenceFirst")],
            [ClipboardCheck, t("auth.peerApproved")],
            [Brain, t("auth.aiExplains")],
            [ShieldCheck, t("auth.humansDecide")],
          ].map(([Icon, label]) => (
            <div
              key={String(label)}
              className="rounded-2xl border border-border bg-white/5 p-4"
            >
              <Icon className="text-primary" size={20} />
              <p className="mt-3 text-sm font-bold">{String(label)}</p>
            </div>
          ))}
        </div>
      </section>
      <div className="grid place-items-center py-8 lg:py-0">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center justify-between gap-4 lg:hidden">
            <Link href="/" className="text-xl font-bold">
              {t("app.brand")}
            </Link>
            <LanguageSwitcher compact />
          </div>
          {children}
        </div>
      </div>
    </main>
  );
}
