import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { ButtonLink } from "@/components/ui";

export default function Home() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-5 py-6 sm:px-8">
      <nav className="flex items-center justify-between">
        <Link href="/" className="text-xl font-black tracking-tight">CommitBet</Link>
        <ButtonLink href="/login" variant="ghost">Log in</ButtonLink>
      </nav>

      <section className="grid items-center gap-12 py-16 md:grid-cols-[1.15fr_.85fr] md:py-28">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#cfda79] bg-[#f8ffb8] px-3 py-2 text-xs font-bold text-[#3f4d10]">
            <Sparkles size={15} /> Built for 2-5 person sprint teams
          </div>
          <h1 className="max-w-3xl text-5xl font-black leading-[.96] tracking-[-0.055em] sm:text-7xl">
            Stop abandoning projects after 2 days.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--muted)]">
            CommitBet uses AI, evidence, peer approval and commitment stakes to help your team finish what it starts.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/register" size="lg">Start a commitment sprint <ArrowRight size={18} /></ButtonLink>
            <ButtonLink href="#flow" variant="secondary" size="lg">View demo flow</ButtonLink>
          </div>
          <p className="mt-4 text-sm text-[var(--muted)]">No real payments. Virtual pledges only. AI recommends, humans decide.</p>
        </div>

        <div className="rounded-[2rem] border border-[var(--line)] bg-[var(--card)] p-5 shadow-[0_24px_80px_rgba(23,62,47,.12)] sm:p-7">
          <p className="text-xs font-black uppercase tracking-[.18em] text-[var(--brand)]">7-day sprint</p>
          <h2 className="mt-2 text-2xl font-black">Build a landing page and waitlist</h2>
          <div className="mt-6 h-3 overflow-hidden rounded-full bg-[#edf0eb]">
            <div className="h-full w-[68%] rounded-full bg-[var(--brand)]" />
          </div>
          <div className="mt-6 grid gap-3">
            {["Working waitlist form", "3 value proposition sections", "Final demo video"].map((item, index) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl bg-[#f7f8f4] p-4">
                <CheckCircle2 className={index < 2 ? "text-[var(--brand)]" : "text-[#a8afa8]"} size={20} />
                <span className="font-bold">{item}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center gap-2 rounded-2xl border border-[#d8e2d9] bg-[#eff8f1] p-4 text-sm text-[#31553d]">
            <ShieldCheck size={20} /> AI recommendation requires owner confirmation.
          </div>
        </div>
      </section>

      <section id="flow" className="grid gap-4 pb-20 sm:grid-cols-3">
        {[
          ["01", "Commit", "Define success, your team, and a virtual pledge."],
          ["02", "Prove", "Log progress and attach evidence to meaningful tasks."],
          ["03", "Decide", "Review work, resolve disputes, and confirm the outcome."],
        ].map(([number, title, copy]) => (
          <article key={number} className="rounded-3xl border border-[var(--line)] bg-white p-6">
            <span className="text-sm font-black text-[var(--brand)]">{number}</span>
            <h2 className="mt-8 text-2xl font-black">{title}</h2>
            <p className="mt-2 leading-7 text-[var(--muted)]">{copy}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
