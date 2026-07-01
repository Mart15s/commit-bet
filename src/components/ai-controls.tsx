"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Brain, Loader2, Sparkles } from "lucide-react";
import { Button, Card, StatusBadge } from "@/components/ui";
import { useI18n } from "@/components/language-provider";
import type { EnhanceTextInput } from "@/lib/ai/schemas";

type EnhanceContext = EnhanceTextInput["context"];

export function AIEnhanceButton({
  targetName,
  targetSelector,
  context,
  value,
  onEnhanced,
  className,
}: {
  targetName?: string;
  targetSelector?: string;
  context: EnhanceContext;
  value?: string;
  onEnhanced?: (value: string) => void;
  className?: string;
}) {
  const { language, t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enhance() {
    const field = targetSelector
      ? document.querySelector<HTMLTextAreaElement | HTMLInputElement>(targetSelector)
      : targetName
        ? document.querySelector<HTMLTextAreaElement | HTMLInputElement>(`[name="${targetName}"]`)
        : null;
    const currentText = value ?? field?.value ?? "";
    if (!currentText.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/ai/enhance-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: currentText, context, language }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || t("ai.error"));
      if (onEnhanced) {
        onEnhanced(payload.enhancedText);
      } else if (field) {
        field.value = payload.enhancedText;
        field.dispatchEvent(new Event("input", { bubbles: true }));
        field.dispatchEvent(new Event("change", { bubbles: true }));
      }
    } catch (enhanceError) {
      setError(enhanceError instanceof Error ? enhanceError.message : t("ai.error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      <Button type="button" variant="secondary" size="sm" onClick={enhance} disabled={loading}>
        {loading ? <Loader2 className="animate-spin" size={15} /> : <Sparkles size={15} />}
        {loading ? t("ai.enhancing") : t("ai.enhance")}
      </Button>
      {error ? <p className="mt-1 text-xs font-bold text-red-200">{error}</p> : null}
    </div>
  );
}

export function AISubmitButton({
  labelKey,
  pendingKey,
  className,
}: {
  labelKey: string;
  pendingKey: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  const { t } = useI18n();
  return (
    <Button className={className} type="submit" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" size={16} /> : <Brain size={16} />}
      {pending ? t(pendingKey) : t(labelKey)}
    </Button>
  );
}

export function EvidenceAIReviewButton({ taskId }: { taskId: string }) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function review() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/tasks/${taskId}/ai/review-evidence`, { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || t("ai.error"));
      window.location.reload();
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : t("ai.error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Button className="w-full" type="button" variant="secondary" onClick={review} disabled={loading}>
        {loading ? <Loader2 className="animate-spin" size={16} /> : <Brain size={16} />}
        {loading ? t("ai.reviewingEvidence") : t("ai.reviewEvidence")}
      </Button>
      {error ? <p className="mt-2 text-xs font-bold text-red-200">{error}</p> : null}
    </div>
  );
}

export function EvidenceAIReviewPanel({
  review,
}: {
  review?: {
    evidenceSummary: string;
    matchedTask: boolean;
    criteria: Array<{ criterion: string; status: string; reasoning: string }>;
    evidenceQualityScore: number;
    recommendedStatus: string;
    missingProof: string[];
    reasoning: string;
    confidence: number;
    suggestedNextAction: string;
  } | null;
}) {
  const { t } = useI18n();
  if (!review) return null;
  return (
    <Card className="border-cyan-300/25 bg-cyan-400/10">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
        <div>
          <h2 className="font-black">{t("ai.evidenceReviewTitle")}</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{review.evidenceSummary}</p>
        </div>
        <StatusBadge status={review.recommendedStatus} />
      </div>
      <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-background/45 p-3">
          <p className="font-black">{t("ai.confidence")}</p>
          <p className="mt-1 text-2xl font-black">{review.confidence}%</p>
        </div>
        <div className="rounded-xl border border-border bg-background/45 p-3">
          <p className="font-black">{t("ai.evidenceQuality")}</p>
          <p className="mt-1 text-2xl font-black">{review.evidenceQualityScore}/100</p>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {review.criteria.map((item) => (
          <div key={item.criterion} className="rounded-xl border border-border bg-card p-3 text-sm">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
              <strong>{item.criterion}</strong>
              <StatusBadge status={item.status} />
            </div>
            <p className="mt-2 text-muted-foreground">{item.reasoning}</p>
          </div>
        ))}
      </div>
      {review.missingProof.length ? (
        <div className="mt-4 rounded-xl border border-amber-300/30 bg-amber-400/10 p-3 text-sm">
          <p className="font-black">{t("ai.missingProof")}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {review.missingProof.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      ) : null}
      <p className="mt-4 text-sm leading-6 text-muted-foreground">{review.reasoning}</p>
      <p className="mt-3 rounded-xl border border-cyan-300/20 bg-background/45 p-3 text-sm font-bold text-cyan-100">{review.suggestedNextAction}</p>
      <p className="mt-3 text-xs font-bold text-muted-foreground">{t("ai.recommendationOnly")}</p>
    </Card>
  );
}

export function AIRecommendationNotice() {
  const { t } = useI18n();
  return <p className="mt-4 text-xs font-bold text-muted-foreground">{t("ai.recommendationOnly")}</p>;
}

export function DisputeAIRecommendationButton({ disputeId }: { disputeId: string }) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function recommend() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/disputes/${disputeId}/ai/recommend-resolution`, { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || t("ai.error"));
      window.location.reload();
    } catch (recommendError) {
      setError(recommendError instanceof Error ? recommendError.message : t("ai.error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4">
      <Button className="w-full" type="button" variant="secondary" onClick={recommend} disabled={loading}>
        {loading ? <Loader2 className="animate-spin" size={16} /> : <Brain size={16} />}
        {loading ? t("ai.gettingRecommendation") : t("ai.getRecommendation")}
      </Button>
      {error ? <p className="mt-2 text-xs font-bold text-red-200">{error}</p> : null}
    </div>
  );
}
