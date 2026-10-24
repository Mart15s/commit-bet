"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight, FileText, GitCompareArrows, Users } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ButtonLink } from "@/components/ui";
import { useI18n } from "@/components/language-provider";

const copy = {
  en: {
    beta: "Public beta / Evidence-based accountability",
    title: "Ship or explain.",
    subtitle: "AI audits, humans decide.",
    promise: "Where promises become shipped reality.",
    intro: "Agree on the work. Build it. Put the evidence in front of a peer. Every outcome starts with a promise and ends with a human decision.",
    start: "Start a commitment",
    how: "See how it works",
    signIn: "Sign in",
    skip: "Skip to content",
    promiseLabel: "The promise",
    promiseTitle: "Define what done means.",
    promiseCopy: "An owner, a deadline and acceptance criteria. Agree on the expected proof before the work begins.",
    proofLabel: "The proof",
    proofTitle: "Make the work reviewable.",
    proofCopy: "Submit artifacts and context. A peer compares the evidence against the commitment. AI recommendations inform the review; people make the call.",
    note: "A workflow, not a claimed result. Uploading evidence does not make it verified.",
    howTitle: "Kill checkbox theater. Provide proof.",
    steps: [
      ["Commit", "Agree on the outcome, ownership, deadline and evidence."],
      ["Build", "Work against the agreed scope. Keep a record of what changed."],
      ["Submit proof", "Attach relevant files, links or commits with a clear description."],
      ["Peer review", "Compare evidence with acceptance criteria. Approve or request changes."],
      ["Outcome", "Review the recommendation and record a human decision."],
    ],
    principles: [
      ["Evidence has context.", "A link is a starting point. Keep the scope, submission and review together so peers can assess what the artifact actually proves."],
      ["AI recommends.", "AI can help organize the plan and explain a recommendation. It does not automatically verify uploaded artifacts or make the final judgment."],
      ["People decide.", "Peer approval and final confirmation are explicit human actions. An AI recommendation is never presented as a final verdict."],
    ],
    finalTitle: "Make the next promise measurable.",
    betaNote: "Public Beta does not accept, hold or distribute real pledge money. Commitment points are virtual and have no monetary value.",
    footer: "Proof first. Human decisions.",
  },
  lt: {
    beta: "Viešoji beta / Atskaitomybė, paremta įrodymais",
    title: "Nuo pažado iki kodo.",
    subtitle: "Be pasiteisinimų.",
    promise: "AI vertina faktus. Žmonės priima sprendimus.",
    intro: "Sutarkite dėl darbo. Atlikite jį. Pateikite įrodymus kolegai. Kiekvienas rezultatas prasideda pažadu ir baigiasi žmogaus sprendimu.",
    start: "Pradėti įsipareigojimą",
    how: "Kaip tai veikia",
    signIn: "Prisijungti",
    skip: "Pereiti prie turinio",
    promiseLabel: "Pažadas",
    promiseTitle: "Sutarkite, ką reiškia atlikta.",
    promiseCopy: "Atsakingas žmogus, terminas ir priėmimo kriterijai. Susitarkite dėl laukiamų įrodymų prieš pradėdami darbą.",
    proofLabel: "Įrodymai",
    proofTitle: "Pateikite darbą peržiūrai.",
    proofCopy: "Pateikite rezultatus ir kontekstą. Kolega palygina įrodymus su įsipareigojimu. AI rekomendacija padeda peržiūrėti; sprendžia žmonės.",
    note: "Tai darbo eiga, o ne patvirtintas rezultatas. Įkeltas įrodymas dar nėra patikrintas.",
    howTitle: "Mažiau varnelių. Daugiau įrodymų.",
    steps: [
      ["Įsipareigokite", "Sutarkite dėl rezultato, atsakomybės, termino ir įrodymų."],
      ["Kurkite", "Dirbkite pagal sutartą apimtį. Fiksuokite, kas pasikeitė."],
      ["Pateikite įrodymus", "Pridėkite failus, nuorodas ar kodo pakeitimus su aiškiu aprašu."],
      ["Kolegos peržiūra", "Palyginkite įrodymus su kriterijais. Patvirtinkite arba prašykite pakeitimų."],
      ["Rezultatas", "Peržiūrėkite rekomendaciją ir užfiksuokite žmogaus sprendimą."],
    ],
    principles: [
      ["Įrodymams reikia konteksto.", "Nuoroda – pradžia. Darbo apimtis, pateikimas ir peržiūra padeda kolegai įvertinti, ką rezultatas iš tikrųjų įrodo."],
      ["AI rekomenduoja.", "AI gali padėti parengti planą ir paaiškinti rekomendaciją. Jis automatiškai nepatikrina įkeltų failų ir nepriima galutinio sprendimo."],
      ["Žmonės sprendžia.", "Kolegos patvirtinimas ir galutinis sprendimas yra aiškūs žmogaus veiksmai. AI rekomendacija nėra galutinis verdiktas."],
    ],
    finalTitle: "Tegul kitą pažadą galima pamatuoti.",
    betaNote: "Viešoji beta nepriima, nelaiko ir neskirsto tikrų įsipareigojimo pinigų. Įsipareigojimo taškai yra virtualūs ir neturi piniginės vertės.",
    footer: "Pirmiausia įrodymai. Sprendžia žmonės.",
  },
};

export default function Home() {
  const { language } = useI18n();
  const text = copy[language];
  const icons = [FileText, GitCompareArrows, Users];

  return (
    <div className="min-h-screen">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:p-3 focus:text-primary-foreground">{text.skip}</a>
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-4 sm:px-8">
          <Link href="/" className="inline-flex min-h-11 items-center"><BrandLogo /></Link>
          <nav aria-label={language === "lt" ? "Pagrindinė navigacija" : "Main navigation"} className="flex items-center gap-1 sm:gap-3">
            <LanguageSwitcher compact />
            <ButtonLink href="/login" variant="ghost" size="sm">{text.signIn}</ButtonLink>
          </nav>
        </div>
      </header>
      <main id="main-content">
        <section className="mx-auto grid max-w-7xl gap-12 px-5 pb-16 pt-12 sm:px-8 md:py-20 lg:grid-cols-[1.5fr_1fr] lg:items-center">
          <div>
            <p className="font-mono text-xs uppercase tracking-[.12em] text-muted-foreground">{text.beta}</p>
            <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-[1.15] sm:text-5xl lg:text-6xl">{text.title}</h1>
            <p className="mt-4 font-mono text-xl font-semibold leading-relaxed sm:text-2xl">{text.subtitle}</p>
            <p className="mt-7 text-lg font-medium">{text.promise}</p>
            <p className="mt-3 max-w-xl leading-7 text-muted-foreground">{text.intro}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/register" size="lg">{text.start}<ArrowRight size={18} aria-hidden="true" /></ButtonLink>
              <ButtonLink href="#how-it-works" variant="secondary" size="lg">{text.how}</ButtonLink>
            </div>
          </div>
          <div className="flex min-h-64 items-center justify-center border-y border-border py-10 lg:min-h-80 lg:border-y-0 lg:border-l">
            <BrandLogo variant="stacked" className="w-[280px]" />
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-8" aria-label={language === "lt" ? "Pažadas ir įrodymai" : "Promise and proof"}>
          <div className="grid overflow-hidden rounded-xl border border-border bg-surface md:grid-cols-2">
            {[[text.promiseLabel, text.promiseTitle, text.promiseCopy], [text.proofLabel, text.proofTitle, text.proofCopy]].map(([label, title, description], index) => (
              <div key={label} className={`p-6 sm:p-8 ${index === 1 ? "border-t border-border md:border-l md:border-t-0" : ""}`}>
                <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
                <h2 className="mt-4 text-[22px] font-semibold">{title}</h2>
                <p className="mt-3 max-w-lg leading-7 text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{text.note}</p>
        </section>
        <section id="how-it-works" className="border-y border-border">
          <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 md:py-20">
            <h2 className="max-w-3xl text-2xl font-semibold sm:text-3xl">{text.howTitle}</h2>
            <ol className="mt-10 grid gap-7 sm:grid-cols-2 lg:grid-cols-5">
              {text.steps.map(([title, description], index) => (
                <li key={title} className="border-t border-border pt-4">
                  <span className="font-mono text-xs text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
                  <h3 className="mt-3 text-base font-semibold">{title}</h3>
                  <p className="mt-2 leading-6 text-muted-foreground">{description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
        <section className="mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:px-8 md:grid-cols-3 md:py-20">
          {text.principles.map(([title, description], index) => {
            const Icon = icons[index];
            return <div key={title}><Icon size={22} className="text-muted-foreground" aria-hidden="true" /><h2 className="mt-5 text-[22px] font-semibold">{title}</h2><p className="mt-3 leading-7 text-muted-foreground">{description}</p></div>;
          })}
        </section>
        <section className="border-y border-border bg-surface">
          <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
            <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
              <h2 className="max-w-xl text-2xl font-semibold">{text.finalTitle}</h2>
              <ButtonLink href="/register" size="lg">{text.start}<ArrowUpRight size={18} aria-hidden="true" /></ButtonLink>
            </div>
            <p className="mt-8 max-w-3xl text-sm leading-7 text-muted-foreground">{text.betaNote}</p>
          </div>
        </section>
      </main>
      <footer className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5 px-5 py-7 sm:px-8">
        <Link href="/" className="inline-flex min-h-11 items-center"><BrandLogo /></Link>
        <p className="font-mono text-xs text-muted-foreground">{text.footer}</p>
        <Link href="/login" className="inline-flex min-h-11 items-center underline underline-offset-4">{text.signIn}</Link>
      </footer>
    </div>
  );
}
