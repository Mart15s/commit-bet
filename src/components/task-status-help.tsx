"use client";
import { useI18n } from "@/components/language-provider";
import { ButtonLink, Card } from "@/components/ui";
export function TaskStatusHelp({
  status,
  assignee,
  canReview,
}: {
  status: string;
  assignee: boolean;
  canReview: boolean;
}) {
  const { t } = useI18n();
  return (
    <Card className="mt-4 border-primary/25 bg-primary/5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            {t("common.next")}
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {t(`task.help.${status}`)}
          </p>
        </div>
        {canReview ? (
          <ButtonLink href="#task-evidence" variant="secondary">
            {t("dash.openReview")}
          </ButtonLink>
        ) : assignee &&
          ["todo", "in_progress", "needs_changes", "rejected"].includes(
            status,
          ) ? (
          <ButtonLink href="#evidence-upload" variant="secondary">
            {t("log.upload")}
          </ButtonLink>
        ) : null}
      </div>
    </Card>
  );
}
