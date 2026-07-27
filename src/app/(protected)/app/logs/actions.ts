"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import {
  dailyLogInputSchema,
  dailyLogSaveResultSchema,
  MAX_DAILY_LOG_PAYLOAD_BYTES,
} from "@/lib/validation";

export type DailyLogActionState = {
  status: "idle" | "error";
  message?: string;
};

type DailyLogPayload = {
  project_id: string;
  log_date: string;
  summary: string;
  time_spent_minutes: number;
  blockers: string;
  next_steps: string;
  task_ids: string[];
  proof_links: string[];
};

function failedDailyLog(message: string): DailyLogActionState {
  return {
    status: "error",
    message: `${message} Nothing was saved; your form values are still here and you can retry.`,
  };
}

function formDataSize(formData: FormData) {
  let bytes = 0;
  for (const [key, value] of formData.entries()) {
    bytes += Buffer.byteLength(key);
    bytes += typeof value === "string"
      ? Buffer.byteLength(value)
      : value.size;
  }
  return bytes;
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value) ?? "null";
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  return `{${Object.entries(value)
    .filter(([, item]) => item !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`)
    .join(",")}}`;
}

function hashPayload(payload: DailyLogPayload) {
  return createHash("sha256")
    .update(canonicalJson(payload))
    .digest("hex");
}

function dailyLogIdempotencyKey(userId: string, payloadHash: string) {
  const hex = createHash("sha256")
    .update(`daily-log:${userId}:${payloadHash}`)
    .digest("hex")
    .slice(0, 32)
    .split("");
  hex[12] = "5";
  hex[16] = ((Number.parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  const value = hex.join("");
  return [
    value.slice(0, 8),
    value.slice(8, 12),
    value.slice(12, 16),
    value.slice(16, 20),
    value.slice(20),
  ].join("-");
}

function safePersistenceError(message: string) {
  if (message.includes("active projects")) {
    return "Daily logs can only be saved for an active project.";
  }
  if (
    message.includes("Not a member")
    || message.includes("Project not found")
  ) {
    return "You are not allowed to save a daily log for this project.";
  }
  if (message.includes("Every task must belong")) {
    return "Every selected task must be an open task in this project.";
  }
  if (message.includes("Log date")) {
    return "Choose a date within this project, no later than today.";
  }
  if (message.includes("Idempotency key")) {
    return "This retry no longer matches the original daily log request.";
  }
  return "The daily log could not be saved.";
}

export async function saveDailyLog(
  _previousState: DailyLogActionState,
  formData: FormData,
): Promise<DailyLogActionState> {
  if (formDataSize(formData) > MAX_DAILY_LOG_PAYLOAD_BYTES) {
    return failedDailyLog("The daily log payload is too large.");
  }

  const proofLinks = [
    ...formData.getAll("proof_link"),
    ...formData.getAll("evidence_link"),
  ].map(String).filter((value) => value.trim().length > 0);
  const timeSpentValue = formData.get("time_spent_minutes");
  const parsed = dailyLogInputSchema.safeParse({
    projectId: String(formData.get("project_id") ?? ""),
    logDate: String(formData.get("log_date") ?? ""),
    summary: String(formData.get("summary") ?? ""),
    timeSpentMinutes:
      typeof timeSpentValue === "string" && timeSpentValue.trim().length > 0
        ? Number(timeSpentValue)
        : Number.NaN,
    blockers: String(formData.get("blockers") ?? ""),
    nextSteps: String(formData.get("next_steps") ?? ""),
    taskIds: formData.getAll("task_id").map(String),
    proofLinks,
  });
  if (!parsed.success) {
    return failedDailyLog(parsed.error.issues[0].message);
  }

  const payload: DailyLogPayload = {
    project_id: parsed.data.projectId,
    log_date: parsed.data.logDate,
    summary: parsed.data.summary,
    time_spent_minutes: parsed.data.timeSpentMinutes,
    blockers: parsed.data.blockers,
    next_steps: parsed.data.nextSteps,
    task_ids: [...parsed.data.taskIds].sort(),
    proof_links: [...parsed.data.proofLinks].sort(),
  };
  const serializedPayload = canonicalJson(payload);
  if (Buffer.byteLength(serializedPayload) > MAX_DAILY_LOG_PAYLOAD_BYTES) {
    return failedDailyLog("The daily log payload is too large.");
  }

  const { supabase, user } = await requireUser();
  const [{ data: project }, { data: membership }, taskResult] = await Promise.all([
    supabase
      .from("projects")
      .select("id, status, start_date, end_date")
      .eq("id", payload.project_id)
      .single(),
    supabase
      .from("project_member_profiles")
      .select("user_id")
      .eq("project_id", payload.project_id)
      .eq("user_id", user.id)
      .maybeSingle(),
    payload.task_ids.length
      ? supabase
        .from("tasks")
        .select("id, project_id, status")
        .in("id", payload.task_ids)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (!project || !membership) {
    return failedDailyLog(
      "You are not allowed to save a daily log for this project.",
    );
  }
  if (project.status !== "active") {
    return failedDailyLog(
      "Daily logs can only be saved for an active project.",
    );
  }
  if (
    payload.log_date < project.start_date
    || payload.log_date > project.end_date
  ) {
    return failedDailyLog(
      "Choose a date within this project's allowed interval.",
    );
  }
  const tasks = taskResult.data ?? [];
  if (
    tasks.length !== payload.task_ids.length
    || tasks.some((task) => (
      task.project_id !== payload.project_id
      || task.status === "approved"
    ))
  ) {
    return failedDailyLog(
      "Every selected task must be an open task in this project.",
    );
  }

  const payloadHash = hashPayload(payload);
  const idempotencyKey = dailyLogIdempotencyKey(user.id, payloadHash);
  const { data, error } = await supabase.rpc(
    "save_daily_log_with_tasks",
    {
      p_idempotency_key: idempotencyKey,
      p_payload: payload,
      p_payload_hash: payloadHash,
    },
  );
  if (error) {
    return failedDailyLog(safePersistenceError(error.message));
  }

  const result = dailyLogSaveResultSchema.safeParse(data);
  if (
    !result.success
    || result.data.project_id !== payload.project_id
    || result.data.log_date !== payload.log_date
    || result.data.task_count !== payload.task_ids.length
    || result.data.proof_link_count !== payload.proof_links.length
    || result.data.evidence_count
      !== payload.task_ids.length * payload.proof_links.length
  ) {
    return {
      status: "error",
      message: "The database response could not be confirmed. Refresh the project before retrying.",
    };
  }

  revalidatePath(`/app/projects/${payload.project_id}`);
  redirect(
    `/app/logs/new?project=${payload.project_id}&saved=1&tasks=${payload.task_ids.length}`,
  );
}
