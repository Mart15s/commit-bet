"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button, ButtonLink, HelpCard, StatusBadge } from "@/components/ui";
import { useI18n } from "@/components/language-provider";

export function AiSubmitButton({
  labelKey,
  pendingKey,
  fallback,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  labelKey: string;
  pendingKey: string;
  fallback?: boolean;
  variant?: "primary" | "secondary" | "ghost" | "dark" | "danger" | "amber";
  size?: "md" | "lg" | "sm";
}) {
  const { pending } = useFormStatus();
  const { t } = useI18n();

  return (
    <Button {...props} disabled={pending || disabled}>
      {pending ? (
        <>
          <RefreshCw size={17} className="animate-spin" />
          {t(pendingKey)}
        </>
      ) : (
        <>
          {fallback ? <RefreshCw size={17} /> : null}
          {t(labelKey)}
        </>
      )}
    </Button>
  );
}

export function AiFallbackBadge({ type }: { type: "plan" | "final" | "dispute" }) {
  const { t } = useI18n();
  const key = type === "final" ? "ai.basicReport" : type === "dispute" ? "ai.manualDisputeReview" : "ai.fallbackDraft";
  return <StatusBadge status={t(key)} />;
}

export function AiFallbackNotice({
  type,
  errorCode,
  retryAction,
  manualHref,
}: {
  type: "plan" | "final" | "review" | "dispute";
  errorCode?: string;
  retryAction?: ReactNode;
  manualHref?: string;
}) {
  const { t } = useI18n();
  const titleKey = type === "final" ? "ai.basicReport" : type === "dispute" ? "ai.manualDisputeReview" : "ai.unavailableTitle";
  const copyKey = type === "review" ? "ai.reviewUnavailableCopy" : type === "final" ? "ai.finalFallbackCopy" : type === "dispute" ? "ai.disputeFallbackCopy" : "ai.planFallbackCopy";

  return (
    <HelpCard title={t(titleKey)} tone="amber" className="mb-4">
      <div className="flex flex-col gap-3">
        <p>{t(copyKey)}</p>
        {errorCode ? <p className="text-xs font-bold text-amber-100">{t("ai.errorCode")}: {errorCode}</p> : null}
        {(retryAction || manualHref) && (
          <div className="flex flex-col gap-2 sm:flex-row">
            {retryAction}
            {manualHref ? <ButtonLink href={manualHref} variant="secondary" size="sm">{t("ai.continueManually")}</ButtonLink> : null}
          </div>
        )}
      </div>
    </HelpCard>
  );
}

export function AiManualReviewNote() {
  const { t } = useI18n();
  return (
    <HelpCard title={t("ai.unavailableTitle")} tone="cyan" className="mb-4">
      <div className="flex gap-2">
        <AlertTriangle size={17} className="mt-1 shrink-0 text-cyan-200" />
        <p>{t("ai.reviewUnavailableCopy")}</p>
      </div>
    </HelpCard>
  );
}
