export const locales = ["en", "lt"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";
export const languageStorageKey = "commitbet.language";

export const localeLabels: Record<Locale, string> = {
  en: "English",
  lt: "Lietuvių",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && locales.includes(value as Locale);
}
