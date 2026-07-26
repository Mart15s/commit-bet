import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireProjectOwner: vi.fn(),
  requireUser: vi.fn(),
  createDataSource: vi.fn(() => ({ source: true })),
  loadFinalAuditInput: vi.fn(),
  reconcileFinalReport: vi.fn((_input, report) => report),
  generateFinalReport: vi.fn(),
  redirect: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  requireProjectOwner: mocks.requireProjectOwner,
  requireUser: mocks.requireUser,
}));
vi.mock("@/lib/final-audit", () => ({
  createSupabaseFinalAuditDataSource: mocks.createDataSource,
  loadFinalAuditInput: mocks.loadFinalAuditInput,
  reconcileFinalReport: mocks.reconcileFinalReport,
}));
vi.mock("@/lib/ai/service", () => ({
  generateFinalReport: mocks.generateFinalReport,
}));
vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));
vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

import {
  confirmFinalDecision,
  generateFinal,
} from "@/app/(protected)/app/projects/[id]/final/actions";

const projectId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const reportId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const ownerId = "11111111-1111-4111-8111-111111111111";
const memberId = "22222222-2222-4222-8222-222222222222";
const idempotencyKey = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const input = {
  project: { id: projectId, title: "Project Alpha" },
  tasks: [{ id: "alpha-task" }],
};
const report = {
  confidence_score: 75,
  human_confirmation_required: true,
};

function formData() {
  const data = new FormData();
  data.set("project_id", projectId);
  return data;
}

function authorizedContext(reportInsertError: { message: string } | null = null) {
  const reportInsert = vi.fn(async () => ({ error: reportInsertError }));
  const auditInsert = vi.fn(async () => ({ error: null }));
  const from = vi.fn((table: string) => ({
    insert: table === "ai_reports" ? reportInsert : auditInsert,
  }));
  const context = {
    supabase: { from },
    user: { id: ownerId },
    project: { id: projectId, title: "Project Alpha", status: "active" },
  };
  return { context, from, reportInsert, auditInsert };
}

function confirmationForm({
  key = idempotencyKey,
  ownerReturn = "100",
  memberReturn = "70",
  duplicateMember = false,
  confirmed = true,
}: {
  key?: string;
  ownerReturn?: string;
  memberReturn?: string;
  duplicateMember?: boolean;
  confirmed?: boolean;
} = {}) {
  const data = new FormData();
  data.set("project_id", projectId);
  data.set("final_report_id", reportId);
  data.set("idempotency_key", key);
  data.append("member_id", ownerId);
  data.append("return_percentage", ownerReturn);
  data.append("member_id", duplicateMember ? ownerId : memberId);
  data.append("return_percentage", memberReturn);
  data.set("confirmation_note", "Human confirmation note");
  if (confirmed) data.set("human_confirmation", "yes");
  return data;
}

function finalizationContext({
  rpcError = null,
  rpcResult,
  createdBy = ownerId,
}: {
  rpcError?: { message: string } | null;
  rpcResult?: Record<string, unknown>;
  createdBy?: string;
} = {}) {
  const single = vi.fn(async () => ({
    data: { id: projectId, created_by: createdBy },
    error: null,
  }));
  const eq = vi.fn(() => ({ single }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn((table: string) => {
    void table;
    return { select };
  });
  const rpc = vi.fn(async (
    functionName: string,
    arguments_: Record<string, unknown>,
  ) => {
    void functionName;
    void arguments_;
    return {
      data: rpcResult ?? {
        project_id: projectId,
        final_report_id: reportId,
        final_decision_id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
        confirmed_by: ownerId,
        confirmed_at: "2026-07-27T12:00:00.000Z",
        pledge_count: 2,
        project_status: "completed",
        replayed: false,
      },
      error: rpcError,
    };
  });
  return {
    context: {
      supabase: { from, rpc },
      user: { id: ownerId },
    },
    from,
    rpc,
  };
}

describe("generateFinal authorization and persistence order", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.redirect.mockImplementation((url: string) => {
      throw new Error(`REDIRECT:${url}`);
    });
  });

  it("stops a non-member before data loading or AI invocation", async () => {
    mocks.requireProjectOwner.mockRejectedValueOnce(new Error("REDIRECT:/app"));

    await expect(generateFinal(formData())).rejects.toThrow("REDIRECT:/app");
    expect(mocks.loadFinalAuditInput).not.toHaveBeenCalled();
    expect(mocks.generateFinalReport).not.toHaveBeenCalled();
  });

  it("stops a regular member before the owner-only final action", async () => {
    mocks.requireProjectOwner.mockRejectedValueOnce(
      new Error(`REDIRECT:/app/projects/${projectId}`),
    );

    await expect(generateFinal(formData())).rejects.toThrow(
      `REDIRECT:/app/projects/${projectId}`,
    );
    expect(mocks.loadFinalAuditInput).not.toHaveBeenCalled();
    expect(mocks.generateFinalReport).not.toHaveBeenCalled();
  });

  it("treats a missing or inaccessible project as unauthorized", async () => {
    mocks.requireProjectOwner.mockRejectedValueOnce(new Error("REDIRECT:/app"));

    await expect(generateFinal(formData())).rejects.toThrow("REDIRECT:/app");
    expect(mocks.createDataSource).not.toHaveBeenCalled();
  });

  it("does not invoke AI or persist when scoped input construction fails", async () => {
    const { context, from } = authorizedContext();
    mocks.requireProjectOwner.mockResolvedValueOnce(context);
    mocks.loadFinalAuditInput.mockRejectedValueOnce(
      new Error("Final-report task isolation failed for evidence."),
    );

    await expect(generateFinal(formData())).rejects.toThrow(
      "REDIRECT:/app/projects/",
    );
    expect(mocks.generateFinalReport).not.toHaveBeenCalled();
    expect(from).not.toHaveBeenCalled();
  });

  it("does not persist a report when AI generation fails", async () => {
    const { context, from } = authorizedContext();
    mocks.requireProjectOwner.mockResolvedValueOnce(context);
    mocks.loadFinalAuditInput.mockResolvedValueOnce(input);
    mocks.generateFinalReport.mockRejectedValueOnce(new Error("AI unavailable"));

    await expect(generateFinal(formData())).rejects.toThrow(
      "REDIRECT:/app/projects/",
    );
    expect(from).not.toHaveBeenCalled();
  });

  it("persists exactly the scoped input snapshot after AI succeeds", async () => {
    const { context, reportInsert, auditInsert } = authorizedContext();
    mocks.requireProjectOwner.mockResolvedValueOnce(context);
    mocks.loadFinalAuditInput.mockResolvedValueOnce(input);
    mocks.generateFinalReport.mockResolvedValueOnce(report);

    await generateFinal(formData());

    expect(reportInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        project_id: projectId,
        type: "final",
        input_snapshot: input,
        output: report,
      }),
    );
    expect(auditInsert).toHaveBeenCalledOnce();
    expect(mocks.revalidatePath).toHaveBeenCalledWith(
      `/app/projects/${projectId}/final`,
    );
  });

  it("does not write a success audit event when report persistence fails", async () => {
    const { context, auditInsert } = authorizedContext({
      message: "insert failed",
    });
    mocks.requireProjectOwner.mockResolvedValueOnce(context);
    mocks.loadFinalAuditInput.mockResolvedValueOnce(input);
    mocks.generateFinalReport.mockResolvedValueOnce(report);

    await expect(generateFinal(formData())).rejects.toThrow(
      "REDIRECT:/app/projects/",
    );
    expect(auditInsert).not.toHaveBeenCalled();
  });
});

describe("confirmFinalDecision atomic RPC boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.redirect.mockImplementation((url: string) => {
      throw new Error(`REDIRECT:${url}`);
    });
  });

  it("does not initiate the RPC when authentication is missing", async () => {
    const { context, rpc } = finalizationContext();
    mocks.requireUser.mockRejectedValueOnce(new Error("REDIRECT:/login"));

    await expect(
      confirmFinalDecision({ status: "idle" }, confirmationForm()),
    ).rejects.toThrow("REDIRECT:/login");

    expect(rpc).not.toHaveBeenCalled();
    expect(context.supabase.from).not.toHaveBeenCalled();
  });

  it("rejects an invalid payload before authentication or RPC", async () => {
    const invalid = confirmationForm({ confirmed: false });

    const result = await confirmFinalDecision({ status: "idle" }, invalid);

    expect(result.status).toBe("error");
    expect(result.message).toContain("not finalized");
    expect(mocks.requireUser).not.toHaveBeenCalled();
  });

  it("rejects duplicate member input before authentication or RPC", async () => {
    const result = await confirmFinalDecision(
      { status: "idle" },
      confirmationForm({ duplicateMember: true }),
    );

    expect(result.status).toBe("error");
    expect(result.message).toContain("only once");
    expect(mocks.requireUser).not.toHaveBeenCalled();
  });

  it("rejects an out-of-range pledge result before the RPC", async () => {
    const result = await confirmFinalDecision(
      { status: "idle" },
      confirmationForm({ memberReturn: "101" }),
    );

    expect(result.status).toBe("error");
    expect(mocks.requireUser).not.toHaveBeenCalled();
  });

  it("rejects a client-supplied pledge status before the RPC", async () => {
    const invalid = confirmationForm();
    invalid.set("pledge_status", "paid");

    const result = await confirmFinalDecision(
      { status: "idle" },
      invalid,
    );

    expect(result.status).toBe("error");
    expect(result.message).toContain("database-owned");
    expect(mocks.requireUser).not.toHaveBeenCalled();
  });

  it("stops a foreign owner before the mutation RPC", async () => {
    const { context, rpc } = finalizationContext({
      createdBy: "33333333-3333-4333-8333-333333333333",
    });
    mocks.requireUser.mockResolvedValueOnce(context);

    const result = await confirmFinalDecision(
      { status: "idle" },
      confirmationForm(),
    );

    expect(result.status).toBe("error");
    expect(result.message).toContain("Only this project owner");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("uses exactly one mutation RPC for a valid confirmation", async () => {
    const { context, from, rpc } = finalizationContext();
    mocks.requireUser.mockResolvedValueOnce(context);

    const result = await confirmFinalDecision(
      { status: "idle" },
      confirmationForm(),
    );

    expect(result).toEqual({
      status: "success",
      message: "Final decision confirmed. Every project pledge is now finalized.",
    });
    expect(rpc).toHaveBeenCalledOnce();
    expect(rpc).toHaveBeenCalledWith("finalize_project", {
      p_project_id: projectId,
      p_final_report_id: reportId,
      p_idempotency_key: idempotencyKey,
      p_final_action: [
        { user_id: ownerId, return_percentage: 100 },
        { user_id: memberId, return_percentage: 70 },
      ],
      p_confirmation_note: "Human confirmation note",
    });
    expect(from).toHaveBeenCalledTimes(1);
    expect(from).toHaveBeenCalledWith("projects");
    expect(mocks.generateFinalReport).not.toHaveBeenCalled();
  });

  it("returns a recoverable all-or-nothing error when the RPC fails", async () => {
    const { context } = finalizationContext({
      rpcError: { message: "Resolve every project dispute before finalization" },
    });
    mocks.requireUser.mockResolvedValueOnce(context);

    const result = await confirmFinalDecision(
      { status: "idle" },
      confirmationForm(),
    );

    expect(result.status).toBe("error");
    expect(result.message).toContain("Resolve every open or escalated dispute");
    expect(result.message).toContain("no pledge statuses were changed");
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("reports success only after a valid committed RPC result", async () => {
    const { context } = finalizationContext({
      rpcResult: { project_status: "completed" },
    });
    mocks.requireUser.mockResolvedValueOnce(context);

    const result = await confirmFinalDecision(
      { status: "idle" },
      confirmationForm(),
    );

    expect(result.status).toBe("error");
    expect(result.message).toContain("could not be confirmed");
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("preserves the same request identity for an exact safe retry", async () => {
    const first = finalizationContext();
    const retry = finalizationContext({
      rpcResult: {
        project_id: projectId,
        final_report_id: reportId,
        final_decision_id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
        confirmed_by: ownerId,
        confirmed_at: "2026-07-27T12:00:00.000Z",
        pledge_count: 2,
        project_status: "completed",
        replayed: true,
      },
    });
    mocks.requireUser
      .mockResolvedValueOnce(first.context)
      .mockResolvedValueOnce(retry.context);

    await confirmFinalDecision({ status: "idle" }, confirmationForm());
    const result = await confirmFinalDecision(
      { status: "error" },
      confirmationForm(),
    );

    expect(first.rpc.mock.calls[0][1].p_idempotency_key).toBe(idempotencyKey);
    expect(retry.rpc.mock.calls[0][1].p_idempotency_key).toBe(idempotencyKey);
    expect(result.message).toContain("already committed");
  });

  it("never performs separate decision, project, pledge, or audit writes", async () => {
    const { context, from } = finalizationContext();
    mocks.requireUser.mockResolvedValueOnce(context);

    await confirmFinalDecision({ status: "idle" }, confirmationForm());

    const tableNames = from.mock.calls.map(([table]) => table);
    expect(tableNames).toEqual(["projects"]);
    expect(tableNames).not.toContain("final_decisions");
    expect(tableNames).not.toContain("pledges");
    expect(tableNames).not.toContain("audit_logs");
  });
});
