"use client";

import { Globe2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { updatePreferredLanguage } from "@/app/(protected)/app/profile/actions";
import { useI18n } from "@/components/language-provider";
import { cn } from "@/lib/utils";
import { isLanguage, languages, type Language } from "@/lib/i18n";

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
    <div className={cn("relative grid gap-2", compact ? "w-[8.75rem]" : "w-[12rem]", className)}>
      <div className="grid gap-2">
        <span className={cn("text-sm font-bold text-muted-foreground", compact && "sr-only", labelClassName)}>
          {t("language.label")}
        </span>
        <div
          aria-label={t("language.label")}
          className={cn(
            "grid w-full grid-cols-[1.75rem_1fr_1fr] items-center rounded-xl border border-primary/35 bg-background/65 p-1 text-sm font-black text-foreground shadow-[0_0_20px_rgba(124,58,237,.14)] backdrop-blur",
            compact && "rounded-lg",
          )}
          role="group"
        >
          <Globe2 className="mx-auto text-primary" size={compact ? 15 : 17} aria-hidden />
          {languages.map((option) => (
            <button
              aria-label={option === "en" ? t("language.english") : t("language.lithuanian")}
              aria-pressed={language === option}
              className={cn(
                "min-h-8 w-full rounded-lg px-2 uppercase transition hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
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
      <p className="sr-only" aria-live="polite">{isPending ? t("language.saving") : message}</p>
    </div>
  );
}
