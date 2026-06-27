"use client";

import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { type TranslationKey, useTranslation } from "@/i18n/useTranslation";

export function I18nInput({
  placeholderKey,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { placeholderKey: TranslationKey }) {
  const { t } = useTranslation();
  return <input {...props} placeholder={t(placeholderKey)} />;
}

export function I18nTextarea({
  placeholderKey,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { placeholderKey: TranslationKey }) {
  const { t } = useTranslation();
  return <textarea {...props} placeholder={t(placeholderKey)} />;
}

export function ReviewDecisionSelect({
  approvedValue = "approved",
  rejectedValue = "rejected",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  approvedValue?: string;
  rejectedValue?: string;
}) {
  const { t } = useTranslation();
  return (
    <select {...props}>
      <option value={approvedValue}>{t("common.approve")}</option>
      <option value="needs_changes">{t("common.needsChanges")}</option>
      <option value={rejectedValue}>{t("common.reject")}</option>
    </select>
  );
}

export function PrioritySelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { t } = useTranslation();
  return (
    <select {...props}>
      <option value="low">{t("status.low")}</option>
      <option value="medium">{t("status.medium")}</option>
      <option value="high">{t("status.high")}</option>
      <option value="critical">{t("status.critical")}</option>
    </select>
  );
}

export function EvidenceTypeSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { t } = useTranslation();
  return (
    <select {...props}>
      <option value="screenshot">{t("evidenceType.screenshot")}</option>
      <option value="document">{t("evidenceType.document")}</option>
      <option value="github">{t("evidenceType.github")}</option>
      <option value="video">{t("evidenceType.video")}</option>
      <option value="link">{t("evidenceType.link")}</option>
      <option value="demo">{t("evidenceType.demo")}</option>
      <option value="other">{t("evidenceType.other")}</option>
    </select>
  );
}
