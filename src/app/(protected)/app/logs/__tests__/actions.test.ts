import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  redirect: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  requireUser: mocks.requireUser,
}));
vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));
vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

import {
  saveDailyLog,
  type DailyLogActionState,
} from "@/app/(protected)/app/logs/actions";

const userId = "11111111-1111-4111-8111-111111111111";
const projectId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const otherProjectId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const taskId = "22222222-2222-4222-8222-222222222222";
const dailyLogId = "33333333-3333-4333-8333-333333333333";
const initialState: DailyLogActionState = { status: "idle" };

function isoDate(offsetDays = 0) {
  const value = new Date();
  value.setUTCDate(value.getUTCDate() + offsetDays);
  return value.toISOString().slice(0, 10);
}

function validFormData() {
  const data = new FormData();
  data.set("project_id", projectId);
  data.set("log_date", isoDate());
  data.set("summary", "Completed the atomic daily log flow.");
  data.set("time_spent_minutes", "75");
  data.set("blockers", "");
  data.set("next_steps", "Run the complete verification matrix.");
  data.append("task_id", taskId);
  data.append("proof_link", "https://example.test/daily-proof");
  return data;
}

function actionContext({
  project = {
    id: projectId,
    status: "active",
    start_date: isoDate(-10),
    end_date: isoDate(10),
  },
  membership = { user_id: userId },
  tasks = [{ id: taskId, project_id: projectId, status: "in_progress" }],
  rpcResult = {
    data: {
      daily_log_id: dailyLogId,
      project_id: projectId,
      log_date: isoDate(),
      task_count: 1,
      proof_link_count: 1,
      evidence_count: 1,
      replayed: false,
    },
    error: null,
  },
}: {
  project?: Record<string, unknown> | null;
  membership?: Record<string, unknown> | null;
  tasks?: Array<Record<string, unknown>> | null;
  rpcResult?: {
    data: unknown;
    error: { message: string } | null;
  };
} = {}) {
  const projectSingle = vi.fn(async () => ({ data: project, error: null }));
  const projectEq = vi.fn(() => ({ single: projectSingle }));

  const membershipSingle = vi.fn(async () => ({
    data: membership,
    error: null,
  }));
  const membershipQuery = {
    eq: vi.fn(),
    maybeSingle: membershipSingle,
  };
  membershipQuery.eq.mockReturnValue(membershipQuery);

  const tasksIn = vi.fn(async () => ({ data: tasks, error: null }));
  const from = vi.fn((table: string) => {
    if (table === "projects") {
      return { select: vi.fn(() => ({ eq: projectEq })) };
    }
    if (table === "project_member_profiles") {
      return { select: vi.fn(() => membershipQuery) };
    }
    if (table === "tasks") {
      return { select: vi.fn(() => ({ in: tasksIn })) };
    }
    throw new Error(`Unexpected mutation table: ${table}`);
  });
  const rpc = vi.fn(async (
    functionName: string,
    rpcArguments: Record<string, unknown>,
  ) => {
    void functionName;
    void rpcArguments;
    return rpcResult;
  });
  return {
    context: {
      supabase: { from, rpc },
      user: { id: userId },
    },
    from,
    rpc,
  };
}

describe("saveDailyLog atomic RPC action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.redirect.mockImplementation((url: string) => {
      throw new Error(`REDIRECT:${url}`);
    });
  });

  it("validates every field before authentication or RPC access", async () => {
    const formData = validFormData();
    formData.set("summary", "");

    await expect(saveDailyLog(initialState, formData)).resolves.toEqual({
      status: "error",
      message: expect.stringContaining("Nothing was saved"),
    });
    expect(mocks.requireUser).not.toHaveBeenCalled();
  });

  it.each([
    "javascript:alert(1)",
    "data:text/plain,proof",
    "file:///tmp/proof",
    "not-a-url",
  ])("rejects the unsafe or invalid proof URL %s before RPC", async (url) => {
    const formData = validFormData();
    formData.set("proof_link", url);

    const result = await saveDailyLog(initialState, formData);

    expect(result.status).toBe("error");
    expect(result.message).toContain("Nothing was saved");
    expect(mocks.requireUser).not.toHaveBeenCalled();
  });

  it("rejects duplicate task IDs before RPC", async () => {
    const formData = validFormData();
    formData.append("task_id", taskId);

    const result = await saveDailyLog(initialState, formData);

    expect(result.message).toContain("Selected tasks must be unique");
    expect(mocks.requireUser).not.toHaveBeenCalled();
  });

  it("rejects canonical duplicate proof links before RPC", async () => {
    const formData = validFormData();
    formData.set("proof_link", "https://example.test");
    formData.append("proof_link", "https://example.test/");

    const result = await saveDailyLog(initialState, formData);

    expect(result.message).toContain("Proof links must be unique");
    expect(mocks.requireUser).not.toHaveBeenCalled();
  });

  it("rejects a future date and out-of-range time before RPC", async () => {
    const formData = validFormData();
    formData.set("log_date", isoDate(1));
    formData.set("time_spent_minutes", "1441");

    const result = await saveDailyLog(initialState, formData);

    expect(result.status).toBe("error");
    expect(mocks.requireUser).not.toHaveBeenCalled();
  });

  it("rejects an oversized FormData request before parsing or writes", async () => {
    const formData = validFormData();
    formData.set("ignored_attacker_field", "x".repeat(66_000));

    const result = await saveDailyLog(initialState, formData);

    expect(result.message).toContain("payload is too large");
    expect(mocks.requireUser).not.toHaveBeenCalled();
  });

  it("rejects a user outside the concrete project membership before RPC", async () => {
    const { context, rpc } = actionContext({ membership: null });
    mocks.requireUser.mockResolvedValueOnce(context);

    const result = await saveDailyLog(initialState, validFormData());

    expect(result.message).toContain("not allowed");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("rejects an inactive project before RPC", async () => {
    const { context, rpc } = actionContext({
      project: {
        id: projectId,
        status: "draft",
        start_date: isoDate(-10),
        end_date: isoDate(10),
      },
    });
    mocks.requireUser.mockResolvedValueOnce(context);

    const result = await saveDailyLog(initialState, validFormData());

    expect(result.message).toContain("active project");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("rejects a foreign or approved task before RPC", async () => {
    const { context, rpc } = actionContext({
      tasks: [{
        id: taskId,
        project_id: otherProjectId,
        status: "approved",
      }],
    });
    mocks.requireUser.mockResolvedValueOnce(context);

    const result = await saveDailyLog(initialState, validFormData());

    expect(result.message).toContain("open task in this project");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("uses exactly one mutation RPC and no direct table mutation", async () => {
    const { context, from, rpc } = actionContext();
    mocks.requireUser.mockResolvedValueOnce(context);

    await expect(
      saveDailyLog(initialState, validFormData()),
    ).rejects.toThrow("REDIRECT:");

    expect(rpc).toHaveBeenCalledOnce();
    expect(rpc).toHaveBeenCalledWith(
      "save_daily_log_with_tasks",
      expect.objectContaining({
        p_idempotency_key: expect.stringMatching(
          /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
        ),
        p_payload_hash: expect.stringMatching(/^[0-9a-f]{64}$/),
        p_payload: expect.objectContaining({
          project_id: projectId,
          task_ids: [taskId],
          proof_links: ["https://example.test/daily-proof"],
        }),
      }),
    );
    expect(new Set(from.mock.calls.map(([table]) => table))).toEqual(
      new Set(["projects", "project_member_profiles", "tasks"]),
    );
  });

  it("generates the same idempotency identity for an exact action retry", async () => {
    const { context, rpc } = actionContext();
    mocks.requireUser.mockResolvedValue(context);

    await expect(
      saveDailyLog(initialState, validFormData()),
    ).rejects.toThrow("REDIRECT:");
    await expect(
      saveDailyLog(initialState, validFormData()),
    ).rejects.toThrow("REDIRECT:");

    expect(rpc).toHaveBeenCalledTimes(2);
    const firstArguments = rpc.mock.calls[0]?.[1];
    const secondArguments = rpc.mock.calls[1]?.[1];
    expect(firstArguments?.p_idempotency_key).toBe(
      secondArguments?.p_idempotency_key,
    );
    expect(firstArguments?.p_payload_hash).toBe(
      secondArguments?.p_payload_hash,
    );
  });

  it("returns a recoverable rollback message for an RPC error", async () => {
    const { context } = actionContext({
      rpcResult: {
        data: null,
        error: { message: "injected proof failure" },
      },
    });
    mocks.requireUser.mockResolvedValueOnce(context);

    const result = await saveDailyLog(initialState, validFormData());

    expect(result).toEqual({
      status: "error",
      message: expect.stringContaining(
        "Nothing was saved; your form values are still here and you can retry",
      ),
    });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("shows success only after a confirmed committed RPC result", async () => {
    const { context, rpc } = actionContext();
    mocks.requireUser.mockResolvedValueOnce(context);

    await expect(
      saveDailyLog(initialState, validFormData()),
    ).rejects.toThrow("REDIRECT:");

    expect(rpc).toHaveBeenCalledOnce();
    expect(mocks.revalidatePath).toHaveBeenCalledWith(
      `/app/projects/${projectId}`,
    );
    expect(mocks.redirect).toHaveBeenCalledWith(
      `/app/logs/new?project=${projectId}&saved=1&tasks=1`,
    );
    expect(rpc.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.revalidatePath.mock.invocationCallOrder[0],
    );
  });
});
