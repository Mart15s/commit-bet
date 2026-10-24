"use client";
import { useI18n } from "@/components/language-provider";
import { ButtonLink, EmptyState, ErrorMessage } from "@/components/ui";
export function LogEmptyState({ error = false }: { error?: boolean }) {
  const { t } = useI18n();
  return error ? (
    <ErrorMessage message="dash.loadError" />
  ) : (
    <EmptyState
      title={t("log.empty")}
      copy={t("log.emptyCopy")}
      action={<ButtonLink href="/app/projects">{t("nav.sprints")}</ButtonLink>}
    />
  );
}
