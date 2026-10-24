"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Check, Loader2 } from "lucide-react";
import { reviewTask } from "@/app/(protected)/app/tasks/actions";
import { useI18n } from "@/components/language-provider";
import { Button } from "@/components/ui";

function ReviewControls() {
  const { t } = useI18n();
  const { pending } = useFormStatus();
  const [checked, setChecked] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const comment = useRef<HTMLTextAreaElement>(null);
  return (
    <fieldset disabled={pending} className="grid gap-3">
      <legend className="mb-3 font-semibold">{t("review.decision")}</legend>
      <label>
        {t("review.note")}
        <small className="font-normal text-muted-foreground">
          {t("review.noteHint")}
        </small>
        <textarea
          ref={comment}
          name="comment"
          maxLength={4000}
          className="min-h-24"
          required={rejecting}
        />
      </label>
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3">
        <input
          className="mt-1 size-5 w-auto"
          type="checkbox"
          checked={checked}
          onChange={(event) => setChecked(event.target.checked)}
        />
        <span className="text-sm font-normal">{t("review.confirm")}</span>
      </label>
      {pending && (
        <p
          role="status"
          className="flex items-center gap-2 text-sm text-primary"
        >
          <Loader2 className="animate-spin" size={16} />
          {t("review.pending")}
        </p>
      )}
      <Button
        name="status"
        value="approved"
        type="submit"
        disabled={!checked || pending}
        onClick={() => {
          if (comment.current) {
            comment.current.setCustomValidity("");
            comment.current.required = false;
          }
          setRejecting(false);
        }}
      >
        <Check size={17} />
        {t("review.approve")}
      </Button>
      <Button
        name="status"
        value="needs_changes"
        type="submit"
        variant="amber"
        onClick={(event) => {
          if (!comment.current?.value.trim()) {
            event.preventDefault();
            comment.current?.focus();
            comment.current?.setCustomValidity(t("review.reasonRequired"));
            comment.current?.reportValidity();
            comment.current?.addEventListener(
              "input",
              () => comment.current?.setCustomValidity(""),
              { once: true },
            );
          }
        }}
      >
        {t("review.changes")}
      </Button>
      {!rejecting ? (
        <Button
          type="button"
          variant="danger"
          onClick={() => setRejecting(true)}
        >
          {t("review.reject")}
        </Button>
      ) : (
        <div className="grid gap-3 rounded-xl border border-danger/40 bg-danger/5 p-3">
          <p className="text-sm text-muted-foreground">
            {t("review.rejectCopy")}
          </p>
          <Button type="submit" name="status" value="rejected" variant="danger">
            {t("review.rejectConfirm")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setRejecting(false)}
          >
            {t("review.cancel")}
          </Button>
        </div>
      )}
    </fieldset>
  );
}

export function ReviewForm({ taskId }: { taskId: string }) {
  return (
    <form action={reviewTask} className="mt-5">
      <input type="hidden" name="task_id" value={taskId} />
      <ReviewControls />
    </form>
  );
}
