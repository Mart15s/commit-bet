"use client";
import type {
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  SelectHTMLAttributes,
} from "react";
import { useI18n } from "@/components/language-provider";
export function LocalizedInput({
  placeholder,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  const { t } = useI18n();
  return (
    <input
      {...props}
      aria-label={props["aria-label"] ? t(props["aria-label"]) : undefined}
      placeholder={placeholder ? t(placeholder) : undefined}
    />
  );
}
export function LocalizedTextarea({
  placeholder,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { t } = useI18n();
  return (
    <textarea
      {...props}
      aria-label={props["aria-label"] ? t(props["aria-label"]) : undefined}
      placeholder={placeholder ? t(placeholder) : undefined}
    />
  );
}
export function LocalizedSelect(
  props: SelectHTMLAttributes<HTMLSelectElement>,
) {
  const { t } = useI18n();
  return (
    <select
      {...props}
      aria-label={props["aria-label"] ? t(props["aria-label"]) : undefined}
    />
  );
}
