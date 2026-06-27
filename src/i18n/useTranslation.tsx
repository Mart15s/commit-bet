"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { defaultLocale, isLocale, languageStorageKey, type Locale } from "@/i18n/config";
import { en, type Messages } from "@/i18n/locales/en";
import { lt } from "@/i18n/locales/lt";

type Primitive = string | number | boolean;
type DotPrefix<Prefix extends string, Key extends string> = `${Prefix}.${Key}`;
type TranslationKeyFor<T> = {
  [Key in keyof T & string]: T[Key] extends string
    ? Key
    : T[Key] extends readonly unknown[]
      ? Key | DotPrefix<Key, ArrayKeyFor<T[Key]>>
      : T[Key] extends object
        ? DotPrefix<Key, TranslationKeyFor<T[Key]>>
        : never;
}[keyof T & string];

type ArrayKeyFor<T> = T extends readonly (infer Item)[]
  ? Item extends string
    ? `${number}`
    : Item extends readonly (infer TupleItem)[]
      ? TupleItem extends string
        ? `${number}.${number}`
        : never
      : Item extends object
        ? `${number}.${TranslationKeyFor<Item>}`
        : never
  : never;

export type TranslationKey = TranslationKeyFor<Messages>;

const dictionaries: Record<Locale, Messages> = {
  en,
  lt,
};

type TranslationContextValue = {
  locale: Locale;
  setLocale: (locale: Locale, options?: { persist?: boolean }) => void;
  t: (key: TranslationKey, params?: Record<string, Primitive>, fallback?: string) => string;
};

const TranslationContext = createContext<TranslationContextValue | null>(null);

function getValue(source: unknown, key: string): unknown {
  return key.split(".").reduce<unknown>((current, part) => {
    if (current && typeof current === "object" && part in current) {
      return (current as Record<string, unknown>)[part];
    }
    return undefined;
  }, source);
}

function interpolate(value: string, params?: Record<string, Primitive>) {
  if (!params) return value;
  return value.replace(/\{(\w+)\}/g, (_, key: string) => String(params[key] ?? `{${key}}`));
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  useEffect(() => {
    const saved = window.localStorage.getItem(languageStorageKey);
    if (isLocale(saved)) {
      document.documentElement.lang = saved;
      window.setTimeout(() => setLocaleState(saved), 0);
      return;
    }
    document.documentElement.lang = defaultLocale;
  }, []);

  const value = useMemo<TranslationContextValue>(() => ({
    locale,
    setLocale(nextLocale, options = { persist: true }) {
      setLocaleState(nextLocale);
      document.documentElement.lang = nextLocale;
      if (options.persist !== false) {
        window.localStorage.setItem(languageStorageKey, nextLocale);
      }
    },
    t(key, params, fallback) {
      const translated = getValue(dictionaries[locale], key);
      const english = getValue(dictionaries.en, key);
      const value = typeof translated === "string" ? translated : typeof english === "string" ? english : fallback ?? key;
      return interpolate(value, params);
    },
  }), [locale]);

  return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>;
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error("useTranslation must be used within LanguageProvider");
  }
  return context;
}

export function T({
  k,
  params,
  fallback,
}: {
  k: TranslationKey;
  params?: Record<string, Primitive>;
  fallback?: string;
}) {
  const { t } = useTranslation();
  return <>{t(k, params, fallback)}</>;
}

export function useTranslatedArray<TValue = unknown>(key: TranslationKey): TValue[] {
  const { locale } = useTranslation();
  const translated = getValue(dictionaries[locale], key);
  const english = getValue(dictionaries.en, key);
  const value = Array.isArray(translated) ? translated : Array.isArray(english) ? english : [];
  return value as TValue[];
}
