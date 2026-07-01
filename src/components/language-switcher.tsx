"use client";

import { Globe2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { updatePreferredLanguage } from "@/app/(protected)/app/profile/actions";
import { useI18n } from "@/components/language-provider";
import { cn } from "@/lib/utils";
import { isLanguage, languageLabels, languages, type Language } from "@/lib/i18n";

export function LanguageSwitcher({
  persistToProfile = false,
  className,
  labelClassName,
  compact = false,
}: {
  persistToProfile?: boolean;
  className?: string;
  labelClassName?: string;
  compact?: boolean;
}) {
  const { language, setLanguage, t } = useI18n();
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(() => setMessage(""), 2600);
    return () => window.clearTimeout(timeout);
  }, [message]);

  function handleChange(value: string) {
    if (!isLanguage(value)) return;
    if (value === language) return;
    const nextLanguage: Language = value;
    setLanguage(nextLanguage);
    setMessage("");

    if (!persistToProfile) return;

    startTransition(async () => {
      const result = await updatePreferredLanguage(nextLanguage);
      setMessage(result.ok ? t("language.saved") : t("language.saveError"));
    });
  }

  return (
    <div className={cn("grid gap-2", compact && "w-auto", className)}>
      <div className="grid gap-2">
        <span className={cn("text-sm font-bold text-muted-foreground", compact && "sr-only", labelClassName)}>
          {t("language.label")}
        </span>
        <div
          aria-label={t("language.label")}
          className={cn(
            "inline-flex w-fit items-center gap-1 rounded-xl border border-primary/35 bg-primary/10 p-1 text-sm font-black text-foreground shadow-[0_0_20px_rgba(124,58,237,.14)]",
            compact && "rounded-lg",
          )}
          role="group"
        >
          <Globe2 className="ml-2 text-primary" size={compact ? 15 : 17} />
          {languages.map((option) => (
            <button
              aria-label={languageLabels[option]}
              aria-pressed={language === option}
              className={cn(
                "min-h-8 min-w-10 rounded-lg px-2.5 uppercase transition hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                language === option ? "bg-primary text-primary-foreground shadow-[0_0_14px_rgba(124,58,237,.28)]" : "text-muted-foreground",
              )}
              disabled={isPending}
              key={option}
              onClick={() => handleChange(option)}
              type="button"
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      {isPending && <p className="text-xs font-bold text-muted-foreground">{t("language.saving")}</p>}
      {message && <p className="text-xs font-bold text-muted-foreground">{message}</p>}
    </div>
  );
}
