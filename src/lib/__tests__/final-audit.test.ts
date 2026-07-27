import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { mockFinalReport } from "@/lib/ai/mock";
import {
  buildFinalAuditInput,
  createSupabaseFinalAuditDataSource,
  loadFinalAuditInput,
  reconcileFinalReport,
  type FinalAuditCollections,
  type FinalAuditDataSource,
  type FinalAuditMemberProfile,
  type FinalAuditProject,
  type FinalAuditTask,
} from "@/lib/final-audit";

const ownerId = "11111111-1111-4111-8111-111111111111";
const userAId = "22222222-2222-4222-8222-222222222222";
const alphaId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const betaId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const alphaTaskId = "aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa";
const alphaUnassignedTaskId = "aaaaaaaa-2222-4222-8222-aaaaaaaaaaaa";
const betaApprovedTaskId = "bbbbbbbb-1111-4111-8111-bbbbbbbbbbbb";
const betaDisputedTaskId = "bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb";
const alphaLogId = "aaaaaaaa-3333-4333-8333-aaaaaaaaaaaa";
const betaLogId = "bbbbbbbb-3333-4333-8333-bbbbbbbbbbbb";

const alphaProject: FinalAuditProject = {
  id: alphaId,
  title: "Project Alpha",
  description: "Alpha-only description",
  goal: "Ship Alpha",
  project_type: "Software",
  success_criteria: [{ criterion: "Alpha launch succeeds" }],
  start_date: "2026-07-01",
  end_date: "2026-07-31",
};

function task(
  id: string,
  projectId: string,
  title: string,
  status: string,
  dueDate: string,
): FinalAuditTask {
  return {
    id,
    project_id: projectId,
    title,
    description: `${title} description`,
    acceptance_criteria: [`Accept ${title}`],
    expected_evidence_types: ["link"],
    priority: "high",
    due_date: dueDate,
    status,
    submitted_at: null,
    approved_at: status === "approved" ? "2026-07-20T10:00:00.000Z" : null,
  };
}

function member(projectId: string, userId: string, name: string): FinalAuditMemberProfile {
  return {
    project_id: projectId,
    user_id: userId,
    roles: ["Builder"],
    strengths: ["Implementation"],
    weaknesses: [],
    preferred_work_types: ["Focused work"],
    evidence_types: ["link"],
    availability_minutes_per_day: 60,
    experience_level: "Intermediate",
    best_work_time: "Morning",
    notes: "",
    custom_notes: "",
    profiles: { name },
  };
}

const allRows: FinalAuditCollections = {
  tasks: [
    task(alphaTaskId, alphaId, "Alpha unfinished task", "todo", "2026-07-30"),
    task(alphaUnassignedTaskId, alphaId, "Alpha unassigned task", "rejected", "2026-07-10"),
    task(betaApprovedTaskId, betaId, "BETA APPROVED LEAK", "approved", "2026-07-10"),
    task(betaDisputedTaskId, betaId, "BETA DISPUTED LEAK", "disputed", "2026-07-01"),
  ],
  memberProfiles: [
    member(alphaId, ownerId, "Owner"),
    member(alphaId, userAId, "User A"),
    member(betaId, userAId, "User A"),
  ],
  assignments: [
    {
      id: "aaaaaaaa-4444-4444-8444-aaaaaaaaaaaa",
      task_id: alphaTaskId,
      user_id: userAId,
      assigned_reason: "Alpha assignment",
    },
    {
      id: "bbbbbbbb-4444-4444-8444-bbbbbbbbbbbb",
      task_id: betaApprovedTaskId,
      user_id: userAId,
      assigned_reason: "BETA ASSIGNMENT LEAK",
    },
  ],
  evidence: [
    {
      id: "aaaaaaaa-5555-4555-8555-aaaaaaaaaaaa",
      task_id: alphaTaskId,
      user_id: userAId,
      type: "link",
      url: "https://alpha.example.test",
      description: "Alpha evidence",
      metadata: { source: "alpha" },
      created_at: "2026-07-20T10:00:00.000Z",
    },
    {
      id: "bbbbbbbb-5555-4555-8555-bbbbbbbbbbbb",
      task_id: betaApprovedTaskId,
      user_id: userAId,
      type: "document",
      url: "https://beta.example.test",
      description: "BETA EVIDENCE LEAK",
      metadata: { source: "beta" },
      created_at: "2026-07-20T10:00:00.000Z",
    },
  ],
  reviews: [
    {
      id: "aaaaaaaa-6666-4666-8666-aaaaaaaaaaaa",
      task_id: alphaTaskId,
      reviewer_id: ownerId,
      status: "needs_changes",
      comment: "Alpha review",
      created_at: "2026-07-21T10:00:00.000Z",
    },
    {
      id: "bbbbbbbb-6666-4666-8666-bbbbbbbbbbbb",
      task_id: betaApprovedTaskId,
      reviewer_id: ownerId,
      status: "approved",
      comment: "BETA REVIEW LEAK",
      created_at: "2026-07-21T10:00:00.000Z",
    },
  ],
  disputes: [
    {
      id: "bbbbbbbb-7777-4777-8777-bbbbbbbbbbbb",
      task_id: betaDisputedTaskId,
      opened_by: userAId,
      reason: "BETA DISPUTE LEAK",
      performer_explanation: "Beta performer text",
      reviewer_rejection_reason: "Beta reviewer text",
      ai_recommendation: { recommendation: "beta" },
      final_resolution: null,
      status: "open",
      created_at: "2026-07-22T10:00:00.000Z",
    },
  ],
  dailyLogs: [
    {
      id: alphaLogId,
      project_id: alphaId,
      user_id: userAId,
      log_date: "2026-07-20",
      summary: "Alpha daily log",
      time_spent_minutes: 30,
      blockers: "",
      next_steps: "Continue Alpha",
      created_at: "2026-07-20T10:00:00.000Z",
    },
    {
      id: betaLogId,
      project_id: betaId,
      user_id: userAId,
      log_date: "2026-07-20",
      summary: "BETA DAILY LOG LEAK",
      time_spent_minutes: 600,
      blockers: "Beta blocker",
      next_steps: "Continue Beta",
      created_at: "2026-07-20T10:00:00.000Z",
    },
  ],
  dailyLogTasks: [
    {
      id: "aaaaaaaa-8888-4888-8888-aaaaaaaaaaaa",
      daily_log_id: alphaLogId,
      task_id: alphaTaskId,
    },
    {
      id: "bbbbbbbb-8888-4888-8888-bbbbbbbbbbbb",
      daily_log_id: betaLogId,
      task_id: betaApprovedTaskId,
    },
  ],
  pledges: [
    {
      id: "aaaaaaaa-9999-4999-8999-aaaaaaaaaaaa",
      project_id: alphaId,
      user_id: userAId,
      amount: 20,
      currency: "POINTS",
      status: "declared",
    },
    {
      id: "bbbbbbbb-9999-4999-8999-bbbbbbbbbbbb",
      project_id: betaId,
      user_id: userAId,
      amount: 987654.32,
      currency: "EUR_DECLARED",
      status: "declared",
    },
  ],
};

function inMemorySource(rows: FinalAuditCollections): FinalAuditDataSource {
  return {
    getTasks: vi.fn(async (projectId) =>
      rows.tasks.filter((row) => row.project_id === projectId),
    ),
    getMemberProfiles: vi.fn(async (projectId) =>
      rows.memberProfiles.filter((row) => row.project_id === projectId),
    ),
    getPledges: vi.fn(async (projectId) =>
      rows.pledges.filter((row) => row.project_id === projectId),
    ),
    getDailyLogs: vi.fn(async (projectId) =>
      rows.dailyLogs.filter((row) => row.project_id === projectId),
    ),
    getAssignments: vi.fn(async (taskIds) =>
      rows.assignments.filter((row) => taskIds.includes(row.task_id)),
    ),
    getEvidence: vi.fn(async (taskIds) =>
      rows.evidence.filter((row) => taskIds.includes(row.task_id)),
    ),
    getReviews: vi.fn(async (taskIds) =>
      rows.reviews.filter((row) => taskIds.includes(row.task_id)),
    ),
    getDisputes: vi.fn(async (taskIds) =>
      rows.disputes.filter((row) => taskIds.includes(row.task_id)),
    ),
    getDailyLogTasks: vi.fn(async (taskIds, dailyLogIds) =>
      rows.dailyLogTasks.filter(
        (row) =>
          taskIds.includes(row.task_id) && dailyLogIds.includes(row.daily_log_id),
      ),
    ),
  };
}

describe("final audit project isolation", () => {
  it("constrains database queries by project and the derived task set", async () => {
    const calls: Array<[string, string, unknown]> = [];
    let currentTable = "";
    const client = {
      from: vi.fn((table: string) => {
        currentTable = table;
        const chain = {
          select: vi.fn(() => chain),
          eq: vi.fn((column: string, value: unknown) => {
            calls.push([currentTable, `eq:${column}`, value]);
            return chain;
          }),
          in: vi.fn((column: string, value: unknown) => {
            calls.push([currentTable, `in:${column}`, value]);
            return chain;
          }),
          order: vi.fn(async () => ({ data: [], error: null })),
        };
        return chain;
      }),
    } as unknown as SupabaseClient;
    const source = createSupabaseFinalAuditDataSource(client);

    await Promise.all([
      source.getTasks(alphaId),
      source.getMemberProfiles(alphaId),
      source.getPledges(alphaId),
      source.getDailyLogs(alphaId),
      source.getAssignments([alphaTaskId]),
      source.getEvidence([alphaTaskId]),
      source.getReviews([alphaTaskId]),
      source.getDisputes([alphaTaskId]),
      source.getDailyLogTasks([alphaTaskId], [alphaLogId]),
    ]);

    expect(calls).toContainEqual(["tasks", "eq:project_id", alphaId]);
    expect(calls).toContainEqual([
      "project_member_profiles",
      "eq:project_id",
      alphaId,
    ]);
    expect(calls).toContainEqual(["pledges", "eq:project_id", alphaId]);
    expect(calls).toContainEqual(["daily_logs", "eq:project_id", alphaId]);
    for (const table of [
      "task_assignments",
      "evidence",
      "reviews",
      "disputes",
      "daily_log_tasks",
    ]) {
      expect(calls).toContainEqual([table, "in:task_id", [alphaTaskId]]);
    }
    expect(calls).toContainEqual([
      "daily_log_tasks",
      "in:daily_log_id",
      [alphaLogId],
    ]);
  });

  it("builds Alpha input and contribution without any Beta records or signals", async () => {
    const source = inMemorySource(allRows);
    const input = await loadFinalAuditInput(
      source,
      alphaProject,
      "2026-07-24T12:00:00.000Z",
    );
    const snapshot = JSON.stringify(input);
    const userA = input.members.find((item) => item.user_id === userAId);

    expect(source.getAssignments).toHaveBeenCalledWith([
      alphaTaskId,
      alphaUnassignedTaskId,
    ]);
    expect(input.tasks.map((item) => item.id)).toEqual([
      alphaTaskId,
      alphaUnassignedTaskId,
    ]);
    expect(input.assignments.map((item) => item.task_id)).toEqual([alphaTaskId]);
    expect(input.evidence.map((item) => item.description)).toEqual([
      "Alpha evidence",
    ]);
    expect(input.reviews.map((item) => item.comment)).toEqual(["Alpha review"]);
    expect(input.disputes).toEqual([]);
    expect(input.daily_logs.map((item) => item.summary)).toEqual([
      "Alpha daily log",
    ]);
    expect(input.pledges.map((item) => Number(item.amount))).toEqual([20]);
    expect(input.task_statistics).toEqual({
      planned: 2,
      completed: 0,
      approved: 0,
      rejected: 1,
      disputed: 0,
      late: 1,
    });
    expect(input.evidence_statistics).toEqual({
      total: 1,
      tasks_with_evidence: 1,
    });
    expect(input.review_statistics).toEqual({
      total: 1,
      approved: 0,
      needs_changes: 1,
      rejected: 0,
    });
    expect(input.dispute_statistics.total).toBe(0);
    expect(input.daily_log_statistics).toEqual({
      total: 1,
      total_time_spent_minutes: 30,
    });
    expect(userA).toMatchObject({
      assigned: 1,
      approved: 0,
      evidence: 1,
      late: 0,
      contribution_score: 10,
    });

    expect(snapshot).not.toContain(betaId);
    expect(snapshot).not.toContain(betaApprovedTaskId);
    expect(snapshot).not.toContain("BETA APPROVED LEAK");
    expect(snapshot).not.toContain("BETA ASSIGNMENT LEAK");
    expect(snapshot).not.toContain("BETA EVIDENCE LEAK");
    expect(snapshot).not.toContain("BETA REVIEW LEAK");
    expect(snapshot).not.toContain("BETA DISPUTE LEAK");
    expect(snapshot).not.toContain("BETA DAILY LOG LEAK");
    expect(snapshot).not.toContain("987654.32");

    const report = mockFinalReport(input);
    expect(report.member_contributions.find((item) => item.user_id === userAId))
      .toMatchObject({ contribution_score: 10 });
    expect(report.pledge_recommendation.find((item) => item.user_id === userAId))
      .toMatchObject({ pledge_return_percentage: 70 });
  });

  it("fails safely when a task-dependent query returns a cross-project row", async () => {
    const source = inMemorySource(allRows);
    source.getEvidence = vi.fn(async () => [
      allRows.evidence.find((item) => item.task_id === betaApprovedTaskId)!,
    ]);

    await expect(
      loadFinalAuditInput(source, alphaProject, "2026-07-24T12:00:00.000Z"),
    ).rejects.toThrow("Final-report task isolation failed for evidence");
  });

  it("rejects foreign or incomplete member output instead of silently accepting it", async () => {
    const input = await loadFinalAuditInput(
      inMemorySource(allRows),
      alphaProject,
      "2026-07-24T12:00:00.000Z",
    );
    const generated = mockFinalReport(input);
    generated.task_statistics = {
      planned: 999,
      approved: 999,
      rejected: 999,
      disputed: 999,
      late: 999,
    };
    generated.member_contributions.push({
      user_id: "99999999-9999-4999-8999-999999999999",
      contribution_score: 100,
      summary: "Foreign member",
      strongest_evidence: ["Foreign evidence"],
      issues: [],
    });
    generated.pledge_recommendation.push({
      user_id: "99999999-9999-4999-8999-999999999999",
      pledge_return_percentage: 100,
      reason: "Foreign pledge",
    });

    expect(() => reconcileFinalReport(input, generated)).toThrow(
      "every project member exactly once",
    );
  });

  it("handles an empty task set without task-dependent queries or invalid scores", async () => {
    const source = inMemorySource({
      tasks: [],
      assignments: [],
      evidence: [],
      reviews: [],
      disputes: [],
      dailyLogs: [],
      dailyLogTasks: [],
      pledges: [],
      memberProfiles: [member(alphaId, userAId, "User A")],
    });

    const input = await loadFinalAuditInput(
      source,
      alphaProject,
      "2026-07-24T12:00:00.000Z",
    );

    expect(source.getAssignments).not.toHaveBeenCalled();
    expect(source.getEvidence).not.toHaveBeenCalled();
    expect(source.getReviews).not.toHaveBeenCalled();
    expect(source.getDisputes).not.toHaveBeenCalled();
    expect(source.getDailyLogTasks).not.toHaveBeenCalled();
    expect(input.task_statistics.planned).toBe(0);
    expect(input.members[0].contribution_score).toBe(0);
    expect(JSON.stringify(input)).not.toMatch(/NaN|Infinity/);
  });

  it("attributes a multi-assigned task deterministically and leaves unassigned work unattributed", () => {
    const approvedTask = task(
      alphaTaskId,
      alphaId,
      "Shared Alpha task",
      "approved",
      "2026-07-20",
    );
    const input = buildFinalAuditInput(
      alphaProject,
      {
        tasks: [
          approvedTask,
          task(
            alphaUnassignedTaskId,
            alphaId,
            "Unassigned Alpha task",
            "approved",
            "2026-07-20",
          ),
        ],
        assignments: [
          {
            id: "aaaaaaaa-4444-4444-8444-aaaaaaaaaaaa",
            task_id: alphaTaskId,
            user_id: ownerId,
            assigned_reason: "Shared",
          },
          {
            id: "aaaaaaaa-5555-4555-8555-aaaaaaaaaaaa",
            task_id: alphaTaskId,
            user_id: userAId,
            assigned_reason: "Shared",
          },
        ],
        evidence: [],
        reviews: [],
        disputes: [],
        dailyLogs: [],
        dailyLogTasks: [],
        pledges: [],
        memberProfiles: [
          member(alphaId, ownerId, "Owner"),
          member(alphaId, userAId, "User A"),
        ],
      },
      "2026-07-24T12:00:00.000Z",
    );

    expect(input.members.map((item) => item.approved)).toEqual([1, 1]);
    expect(input.members.map((item) => item.contribution_score)).toEqual([25, 25]);
    expect(input.task_statistics.approved).toBe(2);
  });

  it("does not create contribution rows for missing members", () => {
    const input = buildFinalAuditInput(
      alphaProject,
      {
        tasks: [
          task(
            alphaUnassignedTaskId,
            alphaId,
            "Unassigned Alpha task",
            "todo",
            "2026-07-30",
          ),
        ],
        assignments: [],
        evidence: [],
        reviews: [],
        disputes: [],
        dailyLogs: [],
        dailyLogTasks: [],
        pledges: [],
        memberProfiles: [],
      },
      "2026-07-24T12:00:00.000Z",
    );

    expect(input.members).toEqual([]);
  });
});
