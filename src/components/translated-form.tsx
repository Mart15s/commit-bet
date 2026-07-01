"use client";

import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { useI18n } from "@/components/language-provider";
import type { TranslationKey } from "@/lib/i18n";

export function TranslatedInput({
  placeholderKey,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { placeholderKey?: TranslationKey }) {
  const { t } = useI18n();
  return <input {...props} placeholder={placeholderKey ? t(placeholderKey) : props.placeholder} />;
}

export function TranslatedTextarea({
  placeholderKey,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { placeholderKey?: TranslationKey }) {
  const { t } = useI18n();
  return <textarea {...props} placeholder={placeholderKey ? t(placeholderKey) : props.placeholder} />;
}

export function TranslatedSelect({
  options,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  options: Array<{ value: string; labelKey: TranslationKey }>;
}) {
  const { t } = useI18n();
  return (
    <select {...props}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {t(option.labelKey)}
        </option>
      ))}
    </select>
  );
}
