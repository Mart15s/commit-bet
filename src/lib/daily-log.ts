import { z } from "zod";

export type DailyLogState = {
  error?: string;
  saved?: boolean;
  projectId?: string;
};
export const dailyLogSchema = z
  .object({
    projectId: z.string().uuid(),
    logDate: z.iso.date(),
    summary: z.string().trim().min(2).max(4000),
    minutes: z.number().int().min(0).max(1440),
    blockers: z.string().max(4000),
    nextSteps: z.string().max(4000),
    taskIds: z.array(z.string().uuid()).max(50),
    evidenceLink: z
      .string()
      .trim()
      .max(2000)
      .refine((value) => {
        if (!value) return true;
        try {
          return ["https:", "http:"].includes(new URL(value).protocol);
        } catch {
          return false;
        }
      }, "log.linkError"),
  })
  .refine(
    (value) => !value.evidenceLink || value.taskIds.length > 0,
    "log.linkError",
  );

export function parseDailyLog(formData: FormData) {
  return dailyLogSchema.safeParse({
    projectId: String(formData.get("project_id") || ""),
    logDate: String(formData.get("log_date") || ""),
    summary: String(formData.get("summary") || ""),
    minutes: Number(formData.get("time_spent_minutes") || 0),
    blockers: String(formData.get("blockers") || ""),
    nextSteps: String(formData.get("next_steps") || ""),
    taskIds: [...new Set(formData.getAll("task_id").map(String))],
    evidenceLink: String(formData.get("evidence_link") || ""),
  });
}
