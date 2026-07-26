import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireProjectOwner: vi.fn(),
  createDataSource: vi.fn(() => ({ source: true })),
  loadFinalAuditInput: vi.fn(),
  reconcileFinalReport: vi.fn((_input, report) => report),
  generateFinalReport: vi.fn(),
  redirect: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  requireProjectOwner: mocks.requireProjectOwner,
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

import { generateFinal } from "@/app/(protected)/app/projects/[id]/final/actions";

const projectId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
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
    user: { id: "11111111-1111-4111-8111-111111111111" },
    project: { id: projectId, title: "Project Alpha", status: "active" },
  };
  return { context, from, reportInsert, auditInsert };
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
