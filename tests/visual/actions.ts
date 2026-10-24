// Isolated UI fixtures: never imported by application routes or production code.
import { parseDailyLog, type DailyLogState } from "../../src/lib/daily-log";
export async function updatePreferredLanguage() {
  return { ok: true };
}
export async function logout() {
  return { ok: true };
}
export async function createProject() {
  return {
    error: "Fixture: draft creation is covered by server and database tests.",
  };
}
export async function saveDailyLog(
  _state: DailyLogState,
  data: FormData,
): Promise<DailyLogState> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  const parsed = parseDailyLog(data);
  if (!parsed.success)
    return {
      error: parsed.error.issues.some(
        (issue) => issue.message === "log.linkError",
      )
        ? "log.linkError"
        : "log.validation",
    };
  if (parsed.data.summary.toLowerCase().includes("fail"))
    return { error: "log.saveError" };
  return { saved: true, projectId: parsed.data.projectId };
}
export async function reviewTask() {
  await new Promise((resolve) => setTimeout(resolve, 600));
}
