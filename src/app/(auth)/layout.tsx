"use client";

import Link from "next/link";
import { Brain, FileText, Users } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useI18n } from "@/components/language-provider";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { t, language } = useI18n();
  return (
    <main className="grid min-h-screen lg:grid-cols-[1fr_1fr]">
      <section className="auth-story hidden border-r border-border bg-surface p-10 lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="flex items-start justify-between gap-4">
          <Link href="/" className="inline-flex min-h-11 items-center"><BrandLogo /></Link>
          <LanguageSwitcher compact />
        </div>
        <div className="max-w-xl py-12">
          <p className="font-mono text-xs uppercase tracking-[.15em] text-muted-foreground">{t("auth.accountability")}</p>
          <h2 className="mt-4 text-5xl font-semibold leading-tight tracking-tight xl:text-6xl">
            {language === "lt" ? "Nuo pažado iki kodo. Be pasiteisinimų." : "Ship or explain."}
          </h2>
          <p className="mt-5 text-xl font-medium">{language === "lt" ? "AI vertina faktus. Žmonės priima sprendimus." : "AI audits, humans decide."}</p>
          <p className="mt-5 max-w-md leading-7 text-muted-foreground">{t("auth.sideCopy")}</p>
          <div className="mt-9 space-y-4 border-t border-border pt-7">
            {[[FileText, t("auth.evidenceFirst")], [Brain, language === "lt" ? "AI rekomenduoja" : "AI recommends"], [Users, t("auth.humansDecide")]].map(([Icon, label]) => (
              <div key={String(label)} className="flex items-center gap-3 text-muted-foreground"><Icon size={18} aria-hidden="true" /><span>{String(label)}</span></div>
            ))}
          </div>
        </div>
        <p className="max-w-md text-xs leading-6 text-muted-foreground">{language === "lt" ? "Viešoji beta. Tik virtualūs įsipareigojimo taškai, neturintys piniginės vertės." : "Public beta. Virtual commitment points only, with no monetary value."}</p>
      </section>
      <div className="flex min-h-screen flex-col px-5 py-6 sm:px-8 lg:px-12">
        <div className="mb-8 flex items-center justify-between gap-2 lg:hidden">
          <Link href="/" className="inline-flex min-h-11 items-center"><BrandLogo /></Link>
          <LanguageSwitcher compact />
        </div>
        <div className="grid flex-1 place-items-center py-8"><div className="w-full max-w-md">{children}</div></div>
        <Link href="/" className="mx-auto inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground underline underline-offset-4">{language === "lt" ? "Grįžti į pradžią" : "Back to home"}</Link>
      </div>
    </main>
  );
}
