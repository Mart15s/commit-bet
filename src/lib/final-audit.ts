import type { SupabaseClient } from "@supabase/supabase-js";
import type { FinalReport } from "@/lib/validation";

export type FinalAuditProject = {
  id: string;
  title: string;
  description: string;
  goal: string;
  project_type?: string;
  success_criteria: unknown;
  start_date: string;
  end_date: string;
};

export type FinalAuditTask = {
  id: string;
  project_id: string;
  title: string;
  description: string;
  acceptance_criteria: unknown;
  expected_evidence_types: string[];
  priority: string;
  due_date: string;
  status: string;
  submitted_at: string | null;
  approved_at: string | null;
};

export type FinalAuditAssignment = {
  id: string;
  task_id: string;
  user_id: string;
  assigned_reason: string;
};

export type FinalAuditEvidence = {
  id: string;
  task_id: string;
  user_id: string;
  type: string;
  url: string | null;
  description: string;
  metadata: unknown;
  created_at: string;
};

export type FinalAuditReview = {
  id: string;
  task_id: string;
  reviewer_id: string;
  status: string;
  comment: string;
  created_at: string;
};

export type FinalAuditDispute = {
  id: string;
  task_id: string;
  opened_by: string;
  reason: string;
  performer_explanation: string;
  reviewer_rejection_reason: string;
  ai_recommendation: unknown;
  final_resolution: string | null;
  status: string;
  created_at: string;
};

export type FinalAuditDailyLog = {
  id: string;
  project_id: string;
  user_id: string;
  log_date: string;
  summary: string;
  time_spent_minutes: number;
  blockers: string;
  next_steps: string;
  created_at: string;
};

export type FinalAuditDailyLogTask = {
  id: string;
  daily_log_id: string;
  task_id: string;
};

export type FinalAuditPledge = {
  id: string;
  project_id: string;
  user_id: string;
  amount: number | string;
  currency: string;
  status: string;
};

type ProfileNameRelation = { name: string } | Array<{ name: string }> | null;

export type FinalAuditMemberProfile = {
  project_id: string;
  user_id: string;
  roles: string[];
  strengths: string[];
  weaknesses: string[];
  preferred_work_types: string[];
  evidence_types: string[];
  availability_minutes_per_day: number;
  experience_level: string;
  best_work_time: string;
  notes: string;
  custom_notes: string;
  profiles: ProfileNameRelation;
};

export type FinalAuditCollections = {
  tasks: FinalAuditTask[];
  assignments: FinalAuditAssignment[];
  evidence: FinalAuditEvidence[];
  reviews: FinalAuditReview[];
  disputes: FinalAuditDispute[];
  dailyLogs: FinalAuditDailyLog[];
  dailyLogTasks: FinalAuditDailyLogTask[];
  pledges: FinalAuditPledge[];
  memberProfiles: FinalAuditMemberProfile[];
};

export type FinalAuditInput = {
  project: {
    id: string;
    title: string;
    description: string;
    goal: string;
    project_type: string;
    success_criteria: string[];
    start_date: string;
    end_date: string;
  };
  generated_at: string;
  task_statistics: {
    planned: number;
    completed: number;
    approved: number;
    rejected: number;
    disputed: number;
    late: number;
  };
  evidence_statistics: {
    total: number;
    tasks_with_evidence: number;
  };
  review_statistics: {
    total: number;
    approved: number;
    needs_changes: number;
    rejected: number;
  };
  dispute_statistics: {
    total: number;
    open: number;
    resolved: number;
    escalated: number;
  };
  daily_log_statistics: {
    total: number;
    total_time_spent_minutes: number;
  };
  members: Array<{
    user_id: string;
    name: string;
    roles: string[];
    strengths: string[];
    weaknesses: string[];
    preferred_work_types: string[];
    evidence_types: string[];
    availability_minutes_per_day: number;
    experience_level: string;
    best_work_time: string;
    notes: string;
    custom_notes: string;
    assigned: number;
    approved: number;
    evidence: number;
    late: number;
    daily_logs: number;
    reviews_authored: number;
    contribution_score: number;
  }>;
  tasks: FinalAuditTask[];
  assignments: FinalAuditAssignment[];
  evidence: FinalAuditEvidence[];
  reviews: FinalAuditReview[];
  disputes: FinalAuditDispute[];
  daily_logs: FinalAuditDailyLog[];
  daily_log_tasks: FinalAuditDailyLogTask[];
  pledges: FinalAuditPledge[];
};

export interface FinalAuditDataSource {
  getTasks(projectId: string): Promise<FinalAuditTask[]>;
  getMemberProfiles(projectId: string): Promise<FinalAuditMemberProfile[]>;
  getPledges(projectId: string): Promise<FinalAuditPledge[]>;
  getDailyLogs(projectId: string): Promise<FinalAuditDailyLog[]>;
  getAssignments(taskIds: string[]): Promise<FinalAuditAssignment[]>;
  getEvidence(taskIds: string[]): Promise<FinalAuditEvidence[]>;
  getReviews(taskIds: string[]): Promise<FinalAuditReview[]>;
  getDisputes(taskIds: string[]): Promise<FinalAuditDispute[]>;
  getDailyLogTasks(
    taskIds: string[],
    dailyLogIds: string[],
  ): Promise<FinalAuditDailyLogTask[]>;
}

function rowsOrThrow<T>(
  collection: string,
  result: { data: T[] | null; error: { message: string } | null },
) {
  if (result.error) {
    throw new Error(`Could not load final-report ${collection}: ${result.error.message}`);
  }
  return result.data ?? [];
}

export function createSupabaseFinalAuditDataSource(
  supabase: SupabaseClient,
): FinalAuditDataSource {
  return {
    async getTasks(projectId) {
      return rowsOrThrow(
        "tasks",
        await supabase
          .from("tasks")
          .select("id, project_id, title, description, acceptance_criteria, expected_evidence_types, priority, due_date, status, submitted_at, approved_at")
          .eq("project_id", projectId)
          .order("id"),
      ) as FinalAuditTask[];
    },
    async getMemberProfiles(projectId) {
      return rowsOrThrow(
        "member profiles",
        await supabase
          .from("project_member_profiles")
          .select("project_id, user_id, roles, strengths, weaknesses, preferred_work_types, evidence_types, availability_minutes_per_day, experience_level, best_work_time, notes, custom_notes, profiles(name)")
          .eq("project_id", projectId)
          .order("user_id"),
      ) as FinalAuditMemberProfile[];
    },
    async getPledges(projectId) {
      return rowsOrThrow(
        "pledges",
        await supabase
          .from("pledges")
          .select("id, project_id, user_id, amount, currency, status")
          .eq("project_id", projectId)
          .order("id"),
      ) as FinalAuditPledge[];
    },
    async getDailyLogs(projectId) {
      return rowsOrThrow(
        "daily logs",
        await supabase
          .from("daily_logs")
          .select("id, project_id, user_id, log_date, summary, time_spent_minutes, blockers, next_steps, created_at")
          .eq("project_id", projectId)
          .order("id"),
      ) as FinalAuditDailyLog[];
    },
    async getAssignments(taskIds) {
      return rowsOrThrow(
        "assignments",
        await supabase
          .from("task_assignments")
          .select("id, task_id, user_id, assigned_reason")
          .in("task_id", taskIds)
          .order("id"),
      ) as FinalAuditAssignment[];
    },
    async getEvidence(taskIds) {
      return rowsOrThrow(
        "evidence",
        await supabase
          .from("evidence")
          .select("id, task_id, user_id, type, url, description, metadata, created_at")
          .in("task_id", taskIds)
          .order("id"),
      ) as FinalAuditEvidence[];
    },
    async getReviews(taskIds) {
      return rowsOrThrow(
        "reviews",
        await supabase
          .from("reviews")
          .select("id, task_id, reviewer_id, status, comment, created_at")
          .in("task_id", taskIds)
          .order("id"),
      ) as FinalAuditReview[];
    },
    async getDisputes(taskIds) {
      return rowsOrThrow(
        "disputes",
        await supabase
          .from("disputes")
          .select("id, task_id, opened_by, reason, performer_explanation, reviewer_rejection_reason, ai_recommendation, final_resolution, status, created_at")
          .in("task_id", taskIds)
          .order("id"),
      ) as FinalAuditDispute[];
    },
    async getDailyLogTasks(taskIds, dailyLogIds) {
      return rowsOrThrow(
        "daily log task links",
        await supabase
          .from("daily_log_tasks")
          .select("id, daily_log_id, task_id")
          .in("task_id", taskIds)
          .in("daily_log_id", dailyLogIds)
          .order("id"),
      ) as FinalAuditDailyLogTask[];
    },
  };
}

function successCriteria(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (typeof item === "string") return item.trim() ? [item.trim()] : [];
    if (
      item &&
      typeof item === "object" &&
      "criterion" in item &&
      typeof item.criterion === "string" &&
      item.criterion.trim()
    ) {
      return [item.criterion.trim()];
    }
    return [];
  });
}

function profileName(relation: ProfileNameRelation, userId: string) {
  const profile = Array.isArray(relation) ? relation[0] : relation;
  return profile?.name || userId;
}

function assertProjectRows(
  collection: string,
  projectId: string,
  rows: Array<{ project_id: string }>,
) {
  if (rows.some((row) => row.project_id !== projectId)) {
    throw new Error(`Final-report project isolation failed for ${collection}.`);
  }
}

function assertTaskRows(
  collection: string,
  allowedTaskIds: Set<string>,
  rows: Array<{ task_id: string }>,
) {
  if (rows.some((row) => !allowedTaskIds.has(row.task_id))) {
    throw new Error(`Final-report task isolation failed for ${collection}.`);
  }
}

export function buildFinalAuditInput(
  project: FinalAuditProject,
  collections: FinalAuditCollections,
  generatedAt = new Date().toISOString(),
): FinalAuditInput {
  assertProjectRows("tasks", project.id, collections.tasks);
  assertProjectRows("member profiles", project.id, collections.memberProfiles);
  assertProjectRows("pledges", project.id, collections.pledges);
  assertProjectRows("daily logs", project.id, collections.dailyLogs);

  const taskIds = new Set(collections.tasks.map((task) => task.id));
  const dailyLogIds = new Set(collections.dailyLogs.map((log) => log.id));
  assertTaskRows("assignments", taskIds, collections.assignments);
  assertTaskRows("evidence", taskIds, collections.evidence);
  assertTaskRows("reviews", taskIds, collections.reviews);
  assertTaskRows("disputes", taskIds, collections.disputes);
  assertTaskRows("daily log task links", taskIds, collections.dailyLogTasks);
  if (collections.dailyLogTasks.some((link) => !dailyLogIds.has(link.daily_log_id))) {
    throw new Error("Final-report project isolation failed for daily log task links.");
  }

  const memberIds = new Set(collections.memberProfiles.map((member) => member.user_id));
  if (collections.assignments.some((assignment) => !memberIds.has(assignment.user_id))) {
    throw new Error("Final-report member isolation failed for assignments.");
  }
  if (collections.pledges.some((pledge) => !memberIds.has(pledge.user_id))) {
    throw new Error("Final-report member isolation failed for pledges.");
  }

  const reportDate = generatedAt.slice(0, 10);
  const taskById = new Map(collections.tasks.map((task) => [task.id, task]));
  const isLate = (task: FinalAuditTask) =>
    task.status !== "approved" && task.due_date < reportDate;

  const members = collections.memberProfiles.map((member) => {
    const assignedTaskIds = new Set(
      collections.assignments
        .filter((assignment) => assignment.user_id === member.user_id)
        .map((assignment) => assignment.task_id),
    );
    const assignedTasks = [...assignedTaskIds]
      .map((taskId) => taskById.get(taskId))
      .filter((task): task is FinalAuditTask => Boolean(task));
    const approved = assignedTasks.filter((task) => task.status === "approved").length;
    const evidence = collections.evidence.filter(
      (item) =>
        item.user_id === member.user_id && assignedTaskIds.has(item.task_id),
    ).length;
    const contributionScore = Math.min(100, approved * 25 + evidence * 10);

    return {
      user_id: member.user_id,
      name: profileName(member.profiles, member.user_id),
      roles: member.roles,
      strengths: member.strengths,
      weaknesses: member.weaknesses,
      preferred_work_types: member.preferred_work_types,
      evidence_types: member.evidence_types,
      availability_minutes_per_day: member.availability_minutes_per_day,
      experience_level: member.experience_level,
      best_work_time: member.best_work_time,
      notes: member.notes,
      custom_notes: member.custom_notes,
      assigned: assignedTasks.length,
      approved,
      evidence,
      late: assignedTasks.filter(isLate).length,
      daily_logs: collections.dailyLogs.filter(
        (log) => log.user_id === member.user_id,
      ).length,
      reviews_authored: collections.reviews.filter(
        (review) => review.reviewer_id === member.user_id,
      ).length,
      contribution_score: Number.isFinite(contributionScore)
        ? contributionScore
        : 0,
    };
  });

  const approved = collections.tasks.filter(
    (task) => task.status === "approved",
  ).length;

  return {
    project: {
      id: project.id,
      title: project.title,
      description: project.description,
      goal: project.goal,
      project_type: project.project_type || "Other",
      success_criteria: successCriteria(project.success_criteria),
      start_date: project.start_date,
      end_date: project.end_date,
    },
    generated_at: generatedAt,
    task_statistics: {
      planned: collections.tasks.length,
      completed: approved,
      approved,
      rejected: collections.tasks.filter((task) => task.status === "rejected")
        .length,
      disputed: collections.tasks.filter((task) => task.status === "disputed")
        .length,
      late: collections.tasks.filter(isLate).length,
    },
    evidence_statistics: {
      total: collections.evidence.length,
      tasks_with_evidence: new Set(
        collections.evidence.map((item) => item.task_id),
      ).size,
    },
    review_statistics: {
      total: collections.reviews.length,
      approved: collections.reviews.filter(
        (review) => review.status === "approved",
      ).length,
      needs_changes: collections.reviews.filter(
        (review) => review.status === "needs_changes",
      ).length,
      rejected: collections.reviews.filter(
        (review) => review.status === "rejected",
      ).length,
    },
    dispute_statistics: {
      total: collections.disputes.length,
      open: collections.disputes.filter((dispute) => dispute.status === "open")
        .length,
      resolved: collections.disputes.filter(
        (dispute) => dispute.status === "resolved",
      ).length,
      escalated: collections.disputes.filter(
        (dispute) => dispute.status === "escalated",
      ).length,
    },
    daily_log_statistics: {
      total: collections.dailyLogs.length,
      total_time_spent_minutes: collections.dailyLogs.reduce(
        (total, log) => total + log.time_spent_minutes,
        0,
      ),
    },
    members,
    tasks: collections.tasks,
    assignments: collections.assignments,
    evidence: collections.evidence,
    reviews: collections.reviews,
    disputes: collections.disputes,
    daily_logs: collections.dailyLogs,
    daily_log_tasks: collections.dailyLogTasks,
    pledges: collections.pledges,
  };
}

export async function loadFinalAuditInput(
  source: FinalAuditDataSource,
  project: FinalAuditProject,
  generatedAt = new Date().toISOString(),
) {
  const [tasks, memberProfiles, pledges, dailyLogs] = await Promise.all([
    source.getTasks(project.id),
    source.getMemberProfiles(project.id),
    source.getPledges(project.id),
    source.getDailyLogs(project.id),
  ]);

  const taskIds = tasks.map((task) => task.id);
  const dailyLogIds = dailyLogs.map((log) => log.id);
  const [assignments, evidence, reviews, disputes] = taskIds.length
    ? await Promise.all([
        source.getAssignments(taskIds),
        source.getEvidence(taskIds),
        source.getReviews(taskIds),
        source.getDisputes(taskIds),
      ])
    : [[], [], [], []];
  const dailyLogTasks =
    taskIds.length && dailyLogIds.length
      ? await source.getDailyLogTasks(taskIds, dailyLogIds)
      : [];

  return buildFinalAuditInput(
    project,
    {
      tasks,
      memberProfiles,
      pledges,
      dailyLogs,
      assignments,
      evidence,
      reviews,
      disputes,
      dailyLogTasks,
    },
    generatedAt,
  );
}

export function reconcileFinalReport(
  input: FinalAuditInput,
  report: FinalReport,
): FinalReport {
  const memberIds = new Set(input.members.map((member) => member.user_id));
  const pledgedMemberIds = new Set(input.pledges.map((pledge) => pledge.user_id));
  const criteria = new Set(input.project.success_criteria);
  const reportedCriteria = report.success_criteria_evaluation.map(
    (item) => item.criterion,
  );
  const reportedMembers = report.member_contributions.map(
    (member) => member.user_id,
  );
  const reportedPledges = report.pledge_recommendation.map(
    (recommendation) => recommendation.user_id,
  );

  const hasExactCoverage = <T,>(actual: T[], expected: Set<T>) =>
    actual.length === expected.size
    && new Set(actual).size === actual.length
    && actual.every((item) => expected.has(item));

  if (!hasExactCoverage(reportedCriteria, criteria)) {
    throw new Error("Final AI report did not cover every project success criterion exactly once.");
  }
  if (!hasExactCoverage(reportedMembers, memberIds)) {
    throw new Error("Final AI report did not cover every project member exactly once.");
  }
  if (!hasExactCoverage(reportedPledges, pledgedMemberIds)) {
    throw new Error("Final AI report did not cover every project pledge exactly once.");
  }

  return {
    ...report,
    task_statistics: {
      planned: input.task_statistics.planned,
      approved: input.task_statistics.approved,
      rejected: input.task_statistics.rejected,
      disputed: input.task_statistics.disputed,
      late: input.task_statistics.late,
    },
  };
}
