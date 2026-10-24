import { beforeEach, describe, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ from: vi.fn(), revalidate: vi.fn() }));
vi.mock("@/lib/auth", () => ({
  requireUser: async () => ({
    user: { id: "me" },
    supabase: { from: mock.from },
  }),
}));
vi.mock("next/cache", () => ({ revalidatePath: mock.revalidate }));
import { saveDailyLog } from "../actions";
const projectId = "11111111-1111-4111-8111-111111111111";
const taskId = "22222222-2222-4222-8222-222222222222";
function form() {
  const data = new FormData();
  data.set("project_id", projectId);
  data.set("log_date", "2026-10-24");
  data.set("summary", "Shipped a working signup flow.");
  return data;
}
function client(
  replies: Record<string, Array<{ data?: unknown; error?: unknown }>>,
) {
  mock.from.mockImplementation((table: string) => {
    const result = replies[table]?.shift() || { data: null, error: null };
    const chain: Record<string, unknown> = {
      then: (resolve: (value: unknown) => unknown) =>
        Promise.resolve(result).then(resolve),
    };
    for (const key of [
      "select",
      "eq",
      "in",
      "not",
      "single",
      "upsert",
      "delete",
      "insert",
      "contains",
    ])
      chain[key] = vi.fn(() => chain);
    return chain;
  });
}
beforeEach(() => {
  vi.clearAllMocks();
});
describe("daily log recovery and validation", () => {
  it("validates malformed proof links before any database write", async () => {
    const data = form();
    data.set("evidence_link", "javascript:alert(1)");
    data.append("task_id", taskId);
    expect(await saveDailyLog({}, data)).toEqual({ error: "log.linkError" });
    expect(mock.from).not.toHaveBeenCalled();
  });
  it("requires a related task for proof links before writes", async () => {
    const data = form();
    data.set("evidence_link", "https://example.com/proof");
    expect(await saveDailyLog({}, data)).toEqual({ error: "log.linkError" });
    expect(mock.from).not.toHaveBeenCalled();
  });
  it("rejects tasks assigned to someone else before saving the log", async () => {
    client({
      projects: [{ data: { id: projectId, status: "active" } }],
      tasks: [
        { data: [{ id: taskId, task_assignments: [{ user_id: "other" }] }] },
      ],
    });
    const data = form();
    data.append("task_id", taskId);
    expect(await saveDailyLog({}, data)).toEqual({ error: "log.taskError" });
    expect(mock.from.mock.calls.map(([table]) => table)).not.toContain(
      "daily_logs",
    );
  });
  it("returns a recoverable error instead of redirecting and discarding input", async () => {
    client({
      projects: [{ data: { status: "active" } }],
      daily_logs: [{ error: { message: "offline" } }],
    });
    expect(await saveDailyLog({}, form())).toEqual({ error: "log.saveError" });
  });
  it("allows a minimal daily update with no fabricated time or next step", async () => {
    client({
      projects: [{ data: { status: "active" } }],
      daily_logs: [{ data: { id: "log" } }],
    });
    expect(await saveDailyLog({}, form())).toEqual({ saved: true, projectId });
    expect(mock.revalidate).toHaveBeenCalledWith("/app");
  });
  it("deduplicates an already recorded proof link on retry", async () => {
    client({
      projects: [{ data: { status: "active" } }],
      tasks: [
        { data: [{ id: taskId, task_assignments: [{ user_id: "me" }] }] },
      ],
      daily_logs: [{ data: { id: "log" } }],
      evidence: [{ data: [{ task_id: taskId }] }],
    });
    const data = form();
    data.append("task_id", taskId);
    data.set("evidence_link", "https://example.com/proof");
    expect(await saveDailyLog({}, data)).toEqual({ saved: true, projectId });
    expect(
      mock.from.mock.calls.filter(([table]) => table === "evidence"),
    ).toHaveLength(1);
  });
});
