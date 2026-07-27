import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  requireProjectOwner: vi.fn(),
  generateProjectPlan: vi.fn(),
  getAIProviderMetadata: vi.fn(),
  redirect: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  requireUser: mocks.requireUser,
  requireProjectOwner: mocks.requireProjectOwner,
}));
vi.mock("@/lib/ai/service", () => ({
  generateProjectPlan: mocks.generateProjectPlan,
  getAIProviderMetadata: mocks.getAIProviderMetadata,
}));
vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));
vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

import {
  createProject,
  generatePlan,
} from "@/app/(protected)/app/projects/actions";

const requestId = "90000000-0000-4000-8000-000000000001";
const teamId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ownerId = "11111111-1111-4111-8111-111111111111";
const memberId = "22222222-2222-4222-8222-222222222222";
const planRequestId = "80000000-0000-4000-8000-000000000001";
const reportId = "70000000-0000-4000-8000-000000000001";
const taskId = "60000000-0000-4000-8000-000000000001";

function validFormData() {
  const data = new FormData();
  data.set("request_id", requestId);
  data.set("team_id", teamId);
  data.set("project_type", "MVP / Startup project");
  data.set("title", "Atomic project");
  data.set("description", "Create every setup row in one transaction.");
  data.set("goal", "Never leave a partial project behind.");
  data.set("start_date", "2026-07-24");
  data.set("end_date", "2026-08-06");
  data.set(
    "selected_success_criteria",
    JSON.stringify([" Accepted deliverable ", "accepted deliverable"]),
  );
  data.set("custom_success_criteria", JSON.stringify([]));
  data.set("pledge_amount", "20");
  data.set("pledge_amount_is_custom", "false");
  for (const id of [ownerId, memberId]) {
    data.append("member_id", id);
    data.set(`roles_${id}`, JSON.stringify([" Builder ", "builder"]));
    data.set(`strengths_${id}`, JSON.stringify([]));
    data.set(`weaknesses_${id}`, JSON.stringify([]));
    data.set(`availability_${id}`, id === ownerId ? "60" : "90");
    data.set(`work_types_${id}`, JSON.stringify(["Focused work"]));
    data.set(`evidence_types_${id}`, JSON.stringify(["Demo"]));
    data.set(`experience_level_${id}`, "Intermediate");
    data.set(`best_work_time_${id}`, "Morning");
    data.set(`notes_${id}`, "");
    data.set(`custom_notes_${id}`, "");
  }
  return data;
}

function authorizedContext(
  rpcResult: {
    data: string | null;
    error: { message: string } | null;
  } = { data: requestId, error: null },
) {
  const rpc = vi.fn(async () => rpcResult);
  const from = vi.fn();
  return {
    context: {
      supabase: { rpc, from },
      user: { id: ownerId },
    },
    rpc,
    from,
  };
}

function validPlan() {
  return {
    phases: [
      {
        name: "Build",
        description: "Create and validate the project result.",
      },
    ],
    deliverables: ["A working result"],
    tasks: [
      {
        title: "Build the working result",
        description: "Create the smallest complete version.",
        assigned_user_id: memberId,
        assigned_reason: "The member has the matching project role.",
        priority: "high" as const,
        due_date: "2026-08-02",
        acceptance_criteria: ["The result works end to end"],
        expected_evidence_types: ["demo"],
      },
    ],
    risks: ["The scope may grow."],
    minimum_success_version: "One complete working result.",
    ambitious_success_version: "A polished and validated result.",
  };
}

function validPlanFormData(includeRequestId = true) {
  const data = new FormData();
  data.set("project_id", requestId);
  if (includeRequestId) {
    data.set("idempotency_key", planRequestId);
  }
  return data;
}

function planActionContext({
  rpcResults = [
    {
      data: {
        project_id: requestId,
        idempotency_key: planRequestId,
        ai_report_id: reportId,
        task_ids: [taskId],
        task_count: 1,
        replayed: false,
      },
      error: null,
    },
  ],
  project = {
    id: requestId,
    team_id: teamId,
    created_by: ownerId,
    status: "draft",
    title: "Atomic plan",
    project_type: "MVP",
    goal: "Replace the plan atomically",
    success_criteria: [{ criterion: "A working result" }],
    start_date: "2026-07-24",
    end_date: "2026-08-06",
  },
  memberProfiles = [
    {
      user_id: ownerId,
      roles: ["owner"],
      strengths: ["planning"],
      weaknesses: [],
      preferred_work_types: ["review"],
      evidence_types: ["document"],
      availability_minutes_per_day: 60,
      experience_level: "Advanced",
      best_work_time: "Morning",
      custom_notes: "",
      profiles: { name: "Owner" },
    },
    {
      user_id: memberId,
      roles: ["builder"],
      strengths: ["delivery"],
      weaknesses: [],
      preferred_work_types: ["build"],
      evidence_types: ["demo"],
      availability_minutes_per_day: 90,
      experience_level: "Intermediate",
      best_work_time: "Afternoon",
      custom_notes: "",
      profiles: { name: "Member" },
    },
  ],
}: {
  rpcResults?: Array<{
    data: unknown;
    error: { message: string } | null;
  }>;
  project?: Record<string, unknown>;
  memberProfiles?: Array<Record<string, unknown>>;
} = {}) {
  const projectSingle = vi.fn(async () => ({ data: project, error: null }));
  const projectEq = vi.fn(() => ({ single: projectSingle }));
  const profileOrder = vi.fn(async () => ({
    data: memberProfiles,
    error: null,
  }));
  const profileEq = vi.fn(() => ({ order: profileOrder }));
  const reportTypeEq = vi.fn(async () => ({ count: 0, error: null }));
  const reportProjectEq = vi.fn(() => ({ eq: reportTypeEq }));
  const from = vi.fn((table: string) => {
    if (table === "projects") {
      return { select: vi.fn(() => ({ eq: projectEq })) };
    }
    if (table === "ai_reports") {
      return { select: vi.fn(() => ({ eq: reportProjectEq })) };
    }
    if (table === "project_member_profiles") {
      return { select: vi.fn(() => ({ eq: profileEq })) };
    }
    throw new Error(`Unexpected table read: ${table}`);
  });
  const rpc = vi.fn();
  for (const result of rpcResults) {
    rpc.mockResolvedValueOnce(result);
  }
  return {
    context: {
      supabase: { from, rpc },
      user: { id: ownerId },
    },
    from,
    rpc,
  };
}

describe("createProject atomic RPC action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.redirect.mockImplementation((url: string) => {
      throw new Error(`REDIRECT:${url}`);
    });
  });

  it("rejects malformed input before invoking the RPC", async () => {
    const { context, rpc } = authorizedContext();
    mocks.requireUser.mockResolvedValueOnce(context);
    const data = validFormData();
    data.set("title", "");

    await expect(createProject({}, data)).resolves.toEqual({
      error: expect.any(String),
    });
    expect(rpc).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("rejects malformed nested JSON before invoking the RPC", async () => {
    const { context, rpc } = authorizedContext();
    mocks.requireUser.mockResolvedValueOnce(context);
    const data = validFormData();
    data.set(`roles_${ownerId}`, "[not-json");

    await expect(createProject({}, data)).resolves.toEqual({
      error: expect.any(String),
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("rejects duplicate selected members before invoking the RPC", async () => {
    const { context, rpc } = authorizedContext();
    mocks.requireUser.mockResolvedValueOnce(context);
    const data = validFormData();
    data.append("member_id", ownerId);

    await expect(createProject({}, data)).resolves.toEqual({
      error: "Project members must be unique.",
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("stops an unauthorized request before any database mutation", async () => {
    const { rpc } = authorizedContext();
    mocks.requireUser.mockRejectedValueOnce(new Error("REDIRECT:/login"));

    await expect(createProject({}, validFormData())).rejects.toThrow(
      "REDIRECT:/login",
    );
    expect(rpc).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("normalizes the complete payload and invokes exactly one RPC", async () => {
    const { context, rpc, from } = authorizedContext();
    mocks.requireUser.mockResolvedValueOnce(context);

    await expect(createProject({}, validFormData())).rejects.toThrow(
      `REDIRECT:/app/projects/${requestId}`,
    );

    expect(rpc).toHaveBeenCalledOnce();
    expect(rpc).toHaveBeenCalledWith("create_project_with_members", {
      p_request_id: requestId,
      p_team_id: teamId,
      p_project_type: "MVP / Startup project",
      p_title: "Atomic project",
      p_description: "Create every setup row in one transaction.",
      p_goal: "Never leave a partial project behind.",
      p_selected_success_criteria: ["accepted deliverable"],
      p_custom_success_criteria: [],
      p_start_date: "2026-07-24",
      p_end_date: "2026-08-06",
      p_pledge_amount: 20,
      p_pledge_amount_is_custom: false,
      p_members: [
        expect.objectContaining({
          member_id: ownerId,
          roles: ["builder"],
          pledge: { amount: 20, currency: "POINTS" },
        }),
        expect.objectContaining({
          member_id: memberId,
          roles: ["builder"],
          pledge: { amount: 20, currency: "POINTS" },
        }),
      ],
    });
    expect(from).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).toHaveBeenNthCalledWith(1, "/app");
    expect(mocks.revalidatePath).toHaveBeenNthCalledWith(
      2,
      `/app/projects/${requestId}`,
    );
    expect(mocks.redirect).toHaveBeenCalledOnce();
  });

  it("returns a safe error and does not redirect when the RPC fails", async () => {
    const { context, rpc, from } = authorizedContext({
      data: null,
      error: { message: "Every selected member must belong to this team" },
    });
    mocks.requireUser.mockResolvedValueOnce(context);

    await expect(createProject({}, validFormData())).resolves.toEqual({
      error: "Every selected member must belong to this team.",
    });
    expect(rpc).toHaveBeenCalledOnce();
    expect(from).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("fails safely when the RPC returns no project ID", async () => {
    const { context, from } = authorizedContext({
      data: null,
      error: null,
    });
    mocks.requireUser.mockResolvedValueOnce(context);

    await expect(createProject({}, validFormData())).resolves.toEqual({
      error: "The project could not be confirmed after creation. Please try again.",
    });
    expect(from).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("fails safely when the RPC returns a different project ID", async () => {
    const { context } = authorizedContext({
      data: "90000000-0000-4000-8000-000000000099",
      error: null,
    });
    mocks.requireUser.mockResolvedValueOnce(context);

    await expect(createProject({}, validFormData())).resolves.toEqual({
      error: "The project could not be confirmed after creation. Please try again.",
    });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("rejects a request that omits the authenticated creator", async () => {
    const { context, rpc } = authorizedContext();
    mocks.requireUser.mockResolvedValueOnce(context);
    const data = validFormData();
    data.delete("member_id");
    data.append("member_id", memberId);

    await expect(createProject({}, data)).resolves.toEqual({
      error: "The project creator must be a selected member.",
    });
    expect(rpc).not.toHaveBeenCalled();
  });
});

describe("generatePlan atomic replacement action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAIProviderMetadata.mockReturnValue({
      provider: "gemini",
      model: "gemini-test",
    });
    mocks.generateProjectPlan.mockResolvedValue(validPlan());
  });

  it("does not invoke the RPC when the AI provider fails", async () => {
    const { context, rpc } = planActionContext();
    mocks.requireUser.mockResolvedValueOnce(context);
    mocks.generateProjectPlan.mockRejectedValueOnce(
      new Error("provider unavailable"),
    );

    await expect(
      generatePlan({ status: "idle" }, validPlanFormData()),
    ).resolves.toEqual({
      status: "error",
      message: expect.stringContaining("previous plan is unchanged"),
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("does not invoke the RPC when the AI output fails schema validation", async () => {
    const { context, rpc } = planActionContext();
    mocks.requireUser.mockResolvedValueOnce(context);
    mocks.generateProjectPlan.mockResolvedValueOnce({
      ...validPlan(),
      tasks: [],
    });

    await expect(
      generatePlan({ status: "idle" }, validPlanFormData()),
    ).resolves.toEqual({
      status: "error",
      message: expect.stringContaining("invalid plan"),
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("does not invoke the RPC for an assignee outside the project", async () => {
    const { context, rpc } = planActionContext();
    mocks.requireUser.mockResolvedValueOnce(context);
    mocks.generateProjectPlan.mockResolvedValueOnce({
      ...validPlan(),
      tasks: [
        {
          ...validPlan().tasks[0],
          assigned_user_id: "33333333-3333-4333-8333-333333333333",
        },
      ],
    });

    await expect(
      generatePlan({ status: "idle" }, validPlanFormData()),
    ).resolves.toEqual({
      status: "error",
      message: expect.stringContaining("outside this project"),
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("returns a recoverable error when the RPC fails", async () => {
    const { context, rpc } = planActionContext({
      rpcResults: [
        {
          data: null,
          error: { message: "Injected task insert failure" },
        },
      ],
    });
    mocks.requireUser.mockResolvedValueOnce(context);

    await expect(
      generatePlan({ status: "idle" }, validPlanFormData()),
    ).resolves.toEqual({
      status: "error",
      message: expect.stringMatching(
        /could not be saved.*previous plan is unchanged.*retry/i,
      ),
    });
    expect(rpc).toHaveBeenCalledOnce();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("uses one provider-agnostic mutation RPC and no direct writes", async () => {
    const { context, rpc, from } = planActionContext();
    mocks.requireUser.mockResolvedValueOnce(context);

    await expect(
      generatePlan({ status: "idle" }, validPlanFormData()),
    ).resolves.toEqual({
      status: "success",
      message: "AI plan saved.",
    });

    expect(from).toHaveBeenCalledTimes(3);
    expect(from).toHaveBeenNthCalledWith(1, "projects");
    expect(from).toHaveBeenNthCalledWith(2, "ai_reports");
    expect(from).toHaveBeenNthCalledWith(3, "project_member_profiles");
    expect(rpc).toHaveBeenCalledOnce();
    expect(rpc).toHaveBeenCalledWith(
      "replace_ai_project_plan",
      expect.objectContaining({
        p_project_id: requestId,
        p_idempotency_key: planRequestId,
        p_ai_provider: "gemini",
        p_ai_model: "gemini-test",
        p_plan: validPlan(),
        p_payload_hash: expect.stringMatching(/^[0-9a-f]{64}$/),
      }),
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith(
      `/app/projects/${requestId}`,
    );
  });

  it("keeps the same request identity and hash for a safe exact retry", async () => {
    const firstResult = {
      project_id: requestId,
      idempotency_key: planRequestId,
      ai_report_id: reportId,
      task_ids: [taskId],
      task_count: 1,
      replayed: false,
    };
    const { context, rpc } = planActionContext({
      rpcResults: [
        { data: firstResult, error: null },
        { data: { ...firstResult, replayed: true }, error: null },
      ],
    });
    mocks.requireUser.mockResolvedValue(context);
    const formData = validPlanFormData();

    await expect(
      generatePlan({ status: "idle" }, formData),
    ).resolves.toMatchObject({ status: "success" });
    await expect(
      generatePlan({ status: "error" }, formData),
    ).resolves.toEqual({
      status: "success",
      message: expect.stringContaining("No duplicate data"),
    });

    expect(rpc).toHaveBeenCalledTimes(2);
    const firstArguments = rpc.mock.calls[0][1];
    const retryArguments = rpc.mock.calls[1][1];
    expect(retryArguments.p_idempotency_key).toBe(
      firstArguments.p_idempotency_key,
    );
    expect(retryArguments.p_payload_hash).toBe(
      firstArguments.p_payload_hash,
    );
  });

  it("generates a request identity in the action when the form omits one", async () => {
    const generatedReportId = "70000000-0000-4000-8000-000000000002";
    const { context, rpc } = planActionContext({
      rpcResults: [
        {
          data: null,
          error: { message: "return the generated key for assertion" },
        },
      ],
    });
    mocks.requireUser.mockResolvedValueOnce(context);

    await generatePlan(
      { status: "idle" },
      validPlanFormData(false),
    );

    expect(rpc).toHaveBeenCalledOnce();
    expect(rpc.mock.calls[0][1].p_idempotency_key).toMatch(
      /^[0-9a-f-]{36}$/,
    );
    expect(generatedReportId).not.toBe(rpc.mock.calls[0][1].p_idempotency_key);
  });

  it("does not require OpenAI environment variables for persistence", async () => {
    const previousKey = process.env.OPENAI_API_KEY;
    const previousModel = process.env.OPENAI_MODEL;
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_MODEL;
    const { context, rpc } = planActionContext();
    mocks.requireUser.mockResolvedValueOnce(context);

    try {
      await generatePlan({ status: "idle" }, validPlanFormData());
    } finally {
      if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
      else process.env.OPENAI_API_KEY = previousKey;
      if (previousModel === undefined) delete process.env.OPENAI_MODEL;
      else process.env.OPENAI_MODEL = previousModel;
    }

    expect(rpc).toHaveBeenCalledWith(
      "replace_ai_project_plan",
      expect.objectContaining({
        p_ai_provider: "gemini",
        p_ai_model: "gemini-test",
      }),
    );
  });
});
