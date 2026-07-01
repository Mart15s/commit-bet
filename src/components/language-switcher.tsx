"use client";

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
      <label className={cn(compact && "gap-1 text-xs", labelClassName)}>
        <span>{t("language.label")}</span>
        <select
          aria-label={t("language.label")}
          className={cn("min-w-32", compact && "w-auto rounded-lg px-3 py-2 text-sm")}
          value={language}
          onChange={(event) => handleChange(event.target.value)}
        >
          {languages.map((option) => (
            <option value={option} key={option}>
              {languageLabels[option]}
            </option>
          ))}
        </select>
      </label>
      {isPending && <p className="text-xs font-bold text-muted-foreground">{t("language.saving")}</p>}
      {message && <p className="text-xs font-bold text-muted-foreground">{message}</p>}
    </div>
  );
}
