"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { useI18n } from "@/components/language-provider";
import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  const { language } = useI18n();
  const lt = language === "lt";
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-16">
      <Link href="/" className="mb-12 w-fit"><BrandLogo /></Link>
      <p className="font-mono text-xs tracking-widest text-muted-foreground">404</p>
      <h1 className="mt-4 text-4xl font-semibold">{lt ? "Puslapis nerastas" : "This page is out of scope."}</h1>
      <p className="mt-4 text-muted-foreground">{lt ? "Patikrinkite nuorodą arba grįžkite į pradžią." : "Check the link or head back to the homepage."}</p>
      <div className="mt-7"><ButtonLink href="/"><ArrowLeft size={16} aria-hidden="true" />{lt ? "Į pradžią" : "Back to home"}</ButtonLink></div>
    </main>
  );
}
