import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  redirect: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  requireUser: mocks.requireUser,
  requireProjectOwner: vi.fn(),
}));
vi.mock("@/lib/ai/service", () => ({
  generateProjectPlan: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));
vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

import { createProject } from "@/app/(protected)/app/projects/actions";

const requestId = "90000000-0000-4000-8000-000000000001";
const teamId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ownerId = "11111111-1111-4111-8111-111111111111";
const memberId = "22222222-2222-4222-8222-222222222222";

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
