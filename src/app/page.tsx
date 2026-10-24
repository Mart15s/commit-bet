"use client";

import Link from "next/link";
import {
  ArrowRight,
  Brain,
  Check,
  ClipboardCheck,
  FileCheck2,
  ShieldCheck,
  Users,
} from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ButtonLink, Card, Progress, StatusBadge } from "@/components/ui";
import { useI18n } from "@/components/language-provider";

// Public, explicitly illustrative content. Never used by the authenticated dashboard.
const previewStatuses = ["approved", "submitted", "in_progress"];
export default function Home() {
  const { t } = useI18n();
  const flow = [
    "Project",
    "Commitment",
    "Plan",
    "Evidence",
    "Approval",
    "Report",
  ];
  return (
    <main className="min-h-screen">
      <header className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-bold tracking-tight"
        >
          <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <ClipboardCheck size={21} />
          </span>
          {t("app.brand")}
        </Link>
        <nav className="flex items-center gap-2">
          <LanguageSwitcher compact />
          <ButtonLink href="/login" variant="ghost" size="sm">
            {t("landing.signIn")}
          </ButtonLink>
        </nav>
      </header>
      <section className="mx-auto grid max-w-7xl gap-10 px-5 pb-16 pt-10 sm:px-8 md:py-20 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-14">
        <div>
          <p className="mb-5 text-xs font-semibold uppercase tracking-[.14em] text-primary">
            {t("landing.audience")}
          </p>
          <h1 className="max-w-xl text-[2.75rem] font-bold leading-[1.06] tracking-[-.05em] sm:text-6xl xl:text-7xl">
            {t("landing.heroTitle")}
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-muted-foreground">
            {t("landing.heroCopy")}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/register" size="lg">
              {t("landing.createSprint")}
              <ArrowRight size={18} />
            </ButtonLink>
            <ButtonLink href="#how-it-works" variant="secondary" size="lg">
              {t("landing.walkthrough")}
            </ButtonLink>
          </div>
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3 text-xs text-muted-foreground">
            {[
              [ShieldCheck, "landing.virtualPledges"],
              [Brain, "landing.aiRecommends"],
              [Users, "landing.humansConfirm"],
            ].map(([Icon, key]) => (
              <span
                className="inline-flex items-center gap-2"
                key={String(key)}
              >
                <Icon size={16} className="text-primary" />
                {t(String(key))}
              </span>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            {t("landing.noMoney")}
          </p>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
          <div className="border-b border-border bg-elevated px-5 py-3">
            <p className="text-xs font-medium text-muted-foreground">
              {t("landing.preview")}
            </p>
          </div>
          <div className="p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                {t("landing.activeSprint")}
              </span>
              <StatusBadge status="active" />
            </div>
            <h2 className="mt-4 text-2xl font-bold tracking-tight">
              {t("landing.previewTitle")}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {t("landing.previewGoal")}
            </p>
            <div className="mt-6 flex justify-between gap-3 text-sm">
              <strong>{t("dash.verified")}</strong>
              <strong className="text-primary">1 / 3</strong>
            </div>
            <Progress value={33} label={t("dash.verified")} className="mt-3" />
            <div className="mt-6 grid gap-2">
              {previewStatuses.map((status, index) => (
                <div
                  key={status}
                  className="flex items-start justify-between gap-3 rounded-xl border border-border bg-background/50 p-3"
                >
                  <div>
                    <p className="text-sm font-semibold">
                      {t(`landing.previewTask${index}`)}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {t("landing.previewEvidence")}
                    </p>
                  </div>
                  <StatusBadge status={status} />
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-3 rounded-xl border border-ai/25 bg-ai/5 p-4">
              <Brain size={19} className="shrink-0 text-ai" />
              <div>
                <p className="text-xs font-semibold text-ai">
                  {t("landing.previewInsight")}
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {t("landing.previewInsightCopy")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section
        id="how-it-works"
        className="border-y border-border bg-surface/50"
      >
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 md:py-20">
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-primary">
            {t("landing.howEyebrow")}
          </p>
          <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
            {t("landing.howTitle")}
          </h2>
          <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {flow.map((key, index) => (
              <Card key={key} className="p-6">
                <span className="grid size-9 place-items-center rounded-lg border border-primary/25 bg-primary/10 text-sm font-semibold text-primary">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-5 text-lg font-bold">
                  {t(`landing.flow${key}`)}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {t(`landing.flow${key}Copy`)}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:px-8 md:py-20 lg:grid-cols-2">
        <div>
          <FileCheck2 size={25} className="text-primary" />
          <h2 className="mt-5 max-w-md text-3xl font-bold tracking-tight">
            {t("landing.assetTitle")}
          </h2>
          <p className="mt-4 max-w-lg leading-7 text-muted-foreground">
            {t("landing.assetCopy")}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {["screenshots", "githubLinks", "demoVideos"].map((key) => (
              <span
                key={key}
                className="rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold"
              >
                {t(`landing.${key}`)}
              </span>
            ))}
          </div>
        </div>
        <div className="grid gap-4">
          {[
            [Brain, "neutralReviewer"],
            [ClipboardCheck, "peerApproval"],
            [ShieldCheck, "humanConfirmation"],
          ].map(([Icon, key]) => (
            <div
              key={String(key)}
              className="flex gap-4 rounded-xl border border-border bg-card p-5"
            >
              <Icon size={21} className="shrink-0 text-ai" />
              <div>
                <h3 className="font-bold">{t(`landing.${key}`)}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {t(`landing.${key}Copy`)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="border-t border-border bg-surface/60">
        <div className="mx-auto max-w-3xl px-5 py-14 text-center sm:px-8 md:py-20">
          <Check className="mx-auto text-primary" size={30} />
          <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
            {t("landing.finalTitle")}
          </h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            {t("landing.finalCopy")}
          </p>
          <div className="mt-7">
            <ButtonLink href="/register" size="lg">
              {t("landing.createSprint")}
              <ArrowRight size={18} />
            </ButtonLink>
          </div>
          <p className="mt-5 text-xs text-muted-foreground">
            {t("landing.noMoney")}
          </p>
        </div>
      </section>
    </main>
  );
}
