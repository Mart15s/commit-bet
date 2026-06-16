import { Award, CheckCircle2, Clock3, FileCheck2 } from "lucide-react";
import { AppShell } from "@/components/commitbet/app-shell";
import { EvidencePreviewCard } from "@/components/commitbet/evidence-preview-card";
import { MemberAvatarStack } from "@/components/commitbet/member-avatar-stack";
import { MetricCard } from "@/components/commitbet/metric-card";
import { PremiumCard } from "@/components/commitbet/premium-card";
import { ProgressBar } from "@/components/commitbet/progress-bar";
import { PageIntro, SectionTitle } from "@/components/commitbet/screen-elements";
import { demoMembers, recentProof } from "@/lib/demo-data";

export default function ProfilePage() {
  return (
    <AppShell bottomNav>
      <PageIntro title="Maya Chen" description="Product design" trailing={<MemberAvatarStack members={[demoMembers[0]]} />} />
      <PremiumCard variant="hero" glow className="mb-5">
        <div className="flex items-start gap-4">
          <span className="grid size-14 place-items-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-300"><Award size={26} /></span>
          <div className="flex-1">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-emerald-300">Reliability</p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.045em]">Strong contributor</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">Usually submits proof before deadline.</p>
            <ProgressBar className="mt-4" value={91} variant="success" label="Accountability score" />
          </div>
        </div>
      </PremiumCard>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard label="Completion rate" value="91%" icon={CheckCircle2} />
        <MetricCard label="Evidence quality" value="88%" icon={FileCheck2} />
        <MetricCard label="Reviews completed" value="14" icon={FileCheck2} />
        <MetricCard label="Current streak" value="9 days" icon={Clock3} />
      </div>
      <section className="mt-6">
        <SectionTitle title="Recent proof" />
        <div className="grid gap-4 md:grid-cols-3">
          {recentProof.map((proof) => (
            <EvidencePreviewCard key={proof.title} source={proof.source} title={proof.title} metadata={proof.meta} description={proof.description} />
          ))}
        </div>
      </section>
    </AppShell>
  );
}
