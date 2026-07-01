"use client";

import { useI18n } from "@/components/language-provider";
import type { TranslationKey } from "@/lib/i18n";

export function T({ k }: { k: TranslationKey }) {
  const { t } = useI18n();
  return <>{t(k)}</>;
}

export function useTypedI18n() {
  return useI18n() as ReturnType<typeof useI18n> & {
    t: (key: TranslationKey) => string;
  };
}
