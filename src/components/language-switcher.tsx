"use client";

import { useTransition } from "react";
import { Globe2 } from "lucide-react";
import { updateLanguagePreference } from "@/i18n/actions";
import { locales, type Locale } from "@/i18n/config";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";

type LanguageSwitcherProps = {
  className?: string;
  compact?: boolean;
  mode?: "segmented" | "select";
};

const languageKeys = {
  en: { label: "language.english", short: "language.englishShort" },
  lt: { label: "language.lithuanian", short: "language.lithuanianShort" },
} as const;

export function LanguageSwitcher({ className, compact = false, mode = "segmented" }: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useTranslation();
  const [, startTransition] = useTransition();
  const chooseLocale = (nextLocale: Locale) => {
    if (!locales.includes(nextLocale) || nextLocale === locale) return;
    setLocale(nextLocale);
    startTransition(() => {
      void updateLanguagePreference(nextLocale);
    });
  };

  if (mode === "select") {
    return (
      <label className={cn("grid gap-1.5 text-sm font-black text-muted-foreground", className)}>
        <span className="inline-flex items-center gap-1.5">
          <Globe2 size={15} />
          {t("language.switcherLabel")}
        </span>
        <select
          aria-label={t("language.switcherLabel")}
          className="min-h-11 rounded-xl px-3 py-2 text-sm font-bold"
          value={locale}
          onChange={(event) => {
            const nextLocale = event.target.value as Locale;
            if (locales.includes(nextLocale)) chooseLocale(nextLocale);
          }}
        >
          <option value="en">{t("language.english")}</option>
          <option value="lt">{t("language.lithuanian")}</option>
        </select>
      </label>
    );
  }

  return (
    <div
      aria-label={t("language.switcherLabel")}
      className={cn(
        "inline-flex items-center gap-1 rounded-xl border border-border bg-secondary/85 p-1 text-xs font-black text-muted-foreground shadow-[0_1px_0_rgba(248,250,252,.04)]",
        compact ? "h-9" : "h-11",
        className,
      )}
      role="group"
    >
      <span className={cn("inline-flex items-center gap-1.5 px-2 text-muted-foreground", compact && "hidden sm:inline-flex")}>
        <Globe2 size={compact ? 14 : 15} />
        {t("language.switcherLabel")}
      </span>
      {locales.map((item) => (
        <button
          aria-label={t(languageKeys[item].label)}
          aria-pressed={locale === item}
          className={cn(
            "grid min-w-9 place-items-center rounded-lg px-2.5 py-1.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            locale === item
              ? "bg-primary text-primary-foreground shadow-[0_0_18px_rgba(124,58,237,.26)]"
              : "text-muted-foreground hover:bg-primary/10 hover:text-foreground",
          )}
          key={item}
          onClick={() => chooseLocale(item)}
          type="button"
        >
          {t(languageKeys[item].short)}
        </button>
      ))}
    </div>
  );
}
