"use client";

import { Brain } from "lucide-react";
import { useI18n } from "@/components/language-provider";
import { Card } from "@/components/ui";
import type { ReactNode } from "react";

export function AIRecommendation({
  children,
  confidence,
  mock = false,
  limitations = true,
  scope = "final",
  title,
}: {
  children?: ReactNode;
  confidence?: number | null;
  mock?: boolean;
  limitations?: boolean;
  scope?: "final" | "plan" | "dispute";
  title?: string;
}) {
  const { t } = useI18n();
  return (
    <Card className="border-ai/30 bg-ai/5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-ai">
          <Brain size={18} />
          {t(title || (mock ? "ai.mock" : "ai.title"))}
        </h2>
        {typeof confidence === "number" && Number.isFinite(confidence) && (
          <p className="text-xs text-muted-foreground">
            {t("ai.confidence")}: {confidence}%
          </p>
        )}
      </div>
      {mock && <p className="mt-3 text-sm text-muted-foreground">{t("ai.mockCopy")}</p>}
      {children && (
        <div className="mt-4 space-y-3 text-sm leading-6">{children}</div>
      )}
      {limitations && (
        <p className="mt-4 border-t border-ai/20 pt-4 text-xs leading-6 text-muted-foreground">
          {t(scope === "final" ? "ai.limitations" : `ai.${scope}Limitations`)}
        </p>
      )}
    </Card>
  );
}
