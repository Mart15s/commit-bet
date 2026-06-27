"use client";

import { useEffect } from "react";
import { isLocale, languageStorageKey, type Locale } from "@/i18n/config";
import { useTranslation } from "@/i18n/useTranslation";

export function ProfileLanguageSync({ locale }: { locale?: string | null }) {
  const { setLocale } = useTranslation();

  useEffect(() => {
    if (!isLocale(locale)) return;
    const saved = window.localStorage.getItem(languageStorageKey);
    if (!saved) {
      setLocale(locale as Locale, { persist: false });
    }
  }, [locale, setLocale]);

  return null;
}
