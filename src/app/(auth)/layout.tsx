import Link from "next/link";
import { Brain, ClipboardCheck, FileCheck2, ShieldCheck } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { T, type TranslationKey } from "@/i18n/useTranslation";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const features: Array<[typeof FileCheck2, TranslationKey]> = [
    [FileCheck2, "auth.featureEvidence"],
    [ClipboardCheck, "auth.featurePeer"],
    [Brain, "auth.featureAi"],
    [ShieldCheck, "auth.featureHumans"],
  ];

  return (
    <main className="grid min-h-screen px-5 py-6 sm:px-8 lg:grid-cols-[1fr_.9fr] lg:gap-10">
      <section className="hidden min-h-[calc(100vh-3rem)] rounded-[1.5rem] border border-border bg-[radial-gradient(circle_at_20%_0%,rgba(124,58,237,.34),transparent_28rem),linear-gradient(180deg,#111827,#080A12)] p-8 text-foreground shadow-[0_0_80px_rgba(124,58,237,.12)] lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="text-xl font-black tracking-[-.03em]">CommitBet</Link>
          <LanguageSwitcher compact />
        </div>
        <div className="max-w-xl">
          <p className="text-xs font-black uppercase tracking-[.18em] text-amber-300"><T k="auth.platform" /></p>
          <h1 className="mt-3 text-5xl font-black leading-[.96] tracking-[-.055em]">
            <T k="auth.heroTitle" />
          </h1>
          <p className="mt-5 leading-7 text-muted-foreground">
            <T k="auth.heroCopy" />
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {features.map(([Icon, label]) => (
            <div key={label} className="rounded-2xl border border-border bg-white/5 p-4">
              <Icon className="text-amber-300" size={20} />
              <p className="mt-3 text-sm font-black"><T k={label} /></p>
            </div>
          ))}
        </div>
      </section>
      <div className="grid place-items-center py-8 lg:py-0">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center justify-between gap-3 lg:hidden">
            <Link href="/" className="text-xl font-black">CommitBet</Link>
            <LanguageSwitcher compact />
          </div>
          {children}
        </div>
      </div>
    </main>
  );
}
