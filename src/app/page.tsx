import Link from "next/link";
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  Gauge,
  Layers3,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { ButtonLink, Card, Progress, StatusBadge } from "@/components/ui";
import { sampleProject } from "@/lib/mock-data";

const flow = [
  ["Project", "Name the outcome, team, deadline, and success criteria."],
  ["Commitment", "Declare virtual pledge points so the sprint feels real."],
  ["AI Plan", "Turn the promise into owners, due dates, proof, and risks."],
  ["Daily Evidence", "Log only what changed and attach the proof."],
  ["Peer Approval", "Teammates compare proof against acceptance criteria."],
  ["AI Final Report", "AI recommends with reasons; humans confirm."],
];

const differences = [
  ["Not a backlog", "CommitBet starts with a time-boxed promise, not infinite task capture."],
  ["Evidence over vibes", "Progress only counts when daily logs and task proof support the claim."],
  ["AI is neutral", "AI explains risk and recommendations, but it never becomes the final judge."],
];

export default function Home() {
  const approved = sampleProject.tasks.filter((task) => task.status === "approved").length;
  const submitted = sampleProject.tasks.filter((task) => task.status === "submitted").length;

  return (
    <main className="min-h-screen overflow-hidden">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="text-xl font-black tracking-[-.03em] text-foreground">CommitBet</Link>
        <nav className="flex items-center gap-2">
          <ButtonLink href="/login" variant="ghost" size="sm">Log in</ButtonLink>
          <ButtonLink href="/register" size="sm" className="hidden sm:inline-flex">Start sprint</ButtonLink>
        </nav>
      </header>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 pb-14 pt-8 sm:px-8 md:grid-cols-[1.05fr_.95fr] md:items-center md:pb-20 md:pt-16">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-400/12 px-3 py-2 text-xs font-black uppercase tracking-[.12em] text-amber-200">
            <Sparkles size={15} /> Evidence-based team accountability
          </div>
          <h1 className="max-w-4xl text-5xl font-black leading-[.95] tracking-[-.055em] sm:text-6xl lg:text-7xl">
            Stop abandoning projects after 2 days.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            CommitBet uses AI, evidence and commitment stakes to make your team finish what it starts.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/register" size="lg">Create a commitment sprint <ArrowRight size={18} /></ButtonLink>
            <ButtonLink href="/login" variant="secondary" size="lg">View product</ButtonLink>
          </div>
          <div className="mt-5 grid gap-2 text-sm font-bold text-muted-foreground sm:grid-cols-3">
            <span className="inline-flex items-center gap-2"><ShieldCheck size={16} className="text-amber-300" /> Virtual pledges only</span>
            <span className="inline-flex items-center gap-2"><Brain size={16} className="text-cyan-300" /> AI recommends</span>
            <span className="inline-flex items-center gap-2"><Users size={16} className="text-primary" /> Humans confirm</span>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-primary/25 bg-primary/10 p-4 shadow-[0_24px_90px_rgba(124,58,237,.22)] sm:p-5">
          <div className="rounded-[1.15rem] border border-border bg-elevated/90 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[.14em] text-primary">Active sprint</p>
                <h2 className="mt-1 text-2xl font-black tracking-[-.03em]">{sampleProject.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{sampleProject.goal}</p>
              </div>
              <StatusBadge status="active" />
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2">
              <Card className="bg-surface p-3"><p className="text-xs font-bold text-muted-foreground">Score</p><p className="text-2xl font-black">{sampleProject.successScore}</p></Card>
              <Card className="bg-surface p-3"><p className="text-xs font-bold text-muted-foreground">Proof</p><p className="text-2xl font-black">{submitted}</p></Card>
              <Card className="bg-surface p-3"><p className="text-xs font-bold text-muted-foreground">Approved</p><p className="text-2xl font-black">{approved}</p></Card>
            </div>
            <div className="mt-5">
              <div className="mb-2 flex justify-between text-sm font-black"><span>Commitment progress</span><span>{sampleProject.successScore}%</span></div>
              <Progress value={sampleProject.successScore} />
            </div>
            <div className="mt-5 space-y-2">
              {sampleProject.tasks.slice(0, 3).map((task) => (
                <div key={task.id} className="rounded-xl border border-border bg-surface p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black">{task.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{task.ownerName} · expects {task.expectedEvidenceTypes.join(", ")}</p>
                    </div>
                    <StatusBadge status={task.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-surface/70">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-12 sm:px-8 md:grid-cols-[.8fr_1.2fr] md:py-16">
          <div>
            <p className="text-xs font-black uppercase tracking-[.16em] text-amber-300">The problem</p>
            <h2 className="mt-2 text-3xl font-black tracking-[-.04em] sm:text-4xl">Small teams do not need another place to park tasks.</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {["Kickoff energy fades.", "Success stays vague.", "Nobody knows what proof counts."].map((item) => (
              <Card key={item} className="p-5"><p className="text-lg font-black">{item}</p></Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 md:py-20">
        <div className="max-w-2xl">
          <p className="text-xs font-black uppercase tracking-[.16em] text-primary">How it works</p>
          <h2 className="mt-2 text-3xl font-black tracking-[-.04em] sm:text-4xl">A promise becomes a reviewable chain of evidence.</h2>
        </div>
        <div className="mt-8 grid gap-3 md:grid-cols-3">
          {flow.map(([title, copy], index) => (
            <Card key={title} className="p-5">
              <span className="text-sm font-black text-primary">{String(index + 1).padStart(2, "0")}</span>
              <h3 className="mt-5 text-xl font-black">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-[radial-gradient(circle_at_15%_20%,rgba(124,58,237,.18),transparent_24rem),#080A12] text-foreground">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:px-8 md:grid-cols-[.95fr_1.05fr] md:py-20">
          <div>
            <p className="text-xs font-black uppercase tracking-[.16em] text-amber-300">Different from Trello, Notion, Jira</p>
            <h2 className="mt-2 text-3xl font-black tracking-[-.04em] sm:text-4xl">CommitBet is for finishing, not organizing forever.</h2>
            <p className="mt-4 leading-7 text-muted-foreground">A sprint has success criteria, owners, pledge points, evidence, peer approval, and a final human-confirmed outcome.</p>
          </div>
          <div className="grid gap-3">
            {differences.map(([title, copy]) => (
              <div key={title} className="rounded-2xl border border-border bg-elevated/60 p-5">
                <h3 className="font-black">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-14 sm:px-8 md:grid-cols-3 md:py-20">
        <Card className="p-6 md:col-span-2">
          <FileCheck2 className="text-cyan-300" />
          <h2 className="mt-5 text-3xl font-black tracking-[-.04em]">Evidence is the core product asset.</h2>
          <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
            Every task defines expected proof. Daily logs stay lightweight, peer reviews compare proof to acceptance criteria, and the final report explains exactly which evidence mattered.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {["Screenshots", "GitHub links", "Demo videos"].map((item) => <div key={item} className="rounded-xl border border-cyan-300/20 bg-cyan-400/10 p-4 text-sm font-black text-cyan-100">{item}</div>)}
          </div>
        </Card>
        <Card className="p-6">
          <Gauge className="text-cyan-300" />
          <h3 className="mt-5 text-xl font-black">AI risk insight</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{sampleProject.aiRiskInsight.summary}</p>
          <p className="mt-4 rounded-xl border border-cyan-300/25 bg-cyan-400/10 p-3 text-sm font-bold text-cyan-100">Why: {sampleProject.aiRiskInsight.why}</p>
        </Card>
      </section>

      <section className="border-y border-border bg-surface/70">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-14 sm:px-8 md:grid-cols-3 md:py-16">
          {[
            [Brain, "Neutral reviewer", "AI summarizes risk, checks evidence patterns, and gives a reasoned recommendation."],
            [ClipboardCheck, "Peer approval", "Team members approve, request changes, reject, or dispute submitted work."],
            [ShieldCheck, "Human confirmation", "Final pledge outcomes are manually confirmed. No real payments or escrow in this MVP."],
          ].map(([Icon, title, copy]) => (
            <div key={String(title)} className="flex gap-4">
              <div className="rounded-xl border border-primary/20 bg-primary/10 p-3 text-primary"><Icon size={22} /></div>
              <div>
                <h3 className="font-black">{String(title)}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{String(copy)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 py-16 text-center sm:px-8 md:py-24">
        <Layers3 className="mx-auto text-primary" size={34} />
        <h2 className="mt-5 text-4xl font-black tracking-[-.05em] sm:text-5xl">Turn vague project promises into evidence-based commitments.</h2>
        <p className="mx-auto mt-4 max-w-2xl leading-7 text-muted-foreground">Build the project, prove the work, review the evidence, and let humans make the final call.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/register" size="lg">Start with virtual pledges <ArrowRight size={18} /></ButtonLink>
          <ButtonLink href="/login" variant="secondary" size="lg"><CheckCircle2 size={18} /> Sign in</ButtonLink>
        </div>
      </section>
    </main>
  );
}
