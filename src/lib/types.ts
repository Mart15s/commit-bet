export type ProjectStatus = "draft" | "active" | "completed" | "archived";

export type TaskStatus =
  | "todo"
  | "in_progress"
  | "submitted"
  | "approved"
  | "needs_changes"
  | "rejected"
  | "disputed";

export type Priority = "low" | "medium" | "high" | "critical";

export type EvidenceType = "screenshot" | "document" | "github" | "video" | "link" | "demo" | "other";

export type Member = {
  id: string;
  name: string;
  email: string;
  role: string;
  strengths: string[];
  contributionScore: number;
  pledgePoints: number;
};

export type Evidence = {
  id: string;
  taskId: string;
  type: EvidenceType;
  title: string;
  description: string;
  url?: string;
  submittedAt: string;
  qualityScore: number;
};

export type Review = {
  id: string;
  taskId: string;
  reviewer: string;
  status: "approved" | "needs_changes" | "rejected" | "disputed";
  comment: string;
  createdAt: string;
};

export type Task = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  ownerId: string;
  ownerName: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: string;
  acceptanceCriteria: string[];
  expectedEvidenceTypes: EvidenceType[];
  evidence: Evidence[];
  reviewHistory: Review[];
};

export type DailyLog = {
  id: string;
  projectId: string;
  author: string;
  date: string;
  completed: string;
  relatedTaskIds: string[];
  timeSpentMinutes: number;
  evidenceLink?: string;
  blockers?: string;
  nextSteps: string;
};

export type Project = {
  id: string;
  title: string;
  description: string;
  goal: string;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  successCriteria: string[];
  members: Member[];
  tasks: Task[];
  dailyLogs: DailyLog[];
  pledgePool: number;
  successScore: number;
  aiRiskInsight: {
    level: "low" | "medium" | "high";
    summary: string;
    why: string;
  };
};

export type AIReport = {
  projectSummary: string;
  successCriteriaEvaluation: Array<{ criterion: string; status: "met" | "partial" | "missed"; comment: string }>;
  taskStatistics: {
    planned: number;
    approved: number;
    needsChanges: number;
    rejected: number;
    disputed: number;
    late: number;
  };
  memberContributionScores: Array<{ memberId: string; name: string; score: number; summary: string }>;
  evidenceQuality: number;
  delayAnalysis: string;
  disputeSummary: string;
  recommendation: string;
  recommendationWhy: string;
  confidenceScore: number;
};
