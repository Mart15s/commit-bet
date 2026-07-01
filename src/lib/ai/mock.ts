import type {
  DisputeRecommendation,
  FinalReport,
  ProjectPlan,
} from "@/lib/validation";

type Member = {
  user_id: string;
  name: string;
  strengths: string[];
  weaknesses?: string[];
  preferred_work_types?: string[];
  availability_minutes_per_day: number;
  notes?: string;
};

type PlanInput = {
  title: string;
  description?: string;
  goal: string;
  successCriteria: string[];
  startDate: string;
  endDate: string;
  members: Member[];
};

function dateAt(startDate: string, endDate: string, fraction: number) {
  const start = new Date(`${startDate}T00:00:00Z`).getTime();
  const end = new Date(`${endDate}T00:00:00Z`).getTime();
  return new Date(start + (end - start) * fraction).toISOString().slice(0, 10);
}

export function mockProjectPlan(input: PlanInput): ProjectPlan {
  const members = input.members;
  const first = members[0];
  const second = members[1] ?? first;

  return {
    planSummary: `A focused plan for ${input.title} that prioritizes proof, reviewable milestones, and a minimum successful delivery.`,
    phases: [
      { title: "Align", description: "Confirm the outcome, proof, and smallest shippable version.", startDate: input.startDate, endDate: dateAt(input.startDate, input.endDate, 0.2) },
      { title: "Build", description: "Produce the core deliverables with evidence after each meaningful step.", startDate: dateAt(input.startDate, input.endDate, 0.2), endDate: dateAt(input.startDate, input.endDate, 0.75) },
      { title: "Validate", description: "Test the result against every agreed success criterion.", startDate: dateAt(input.startDate, input.endDate, 0.75), endDate: input.endDate },
    ],
    dailyGoals: [
      { date: input.startDate, goal: "Align on proof and acceptance criteria.", focus: "scope" },
      { date: dateAt(input.startDate, input.endDate, 0.5), goal: "Have the core result ready for review.", focus: "delivery" },
      { date: input.endDate, goal: "Validate evidence against all criteria.", focus: "review" },
    ],
    tasks: [
      {
        title: "Define the delivery checklist",
        description: `Turn the goal "${input.goal}" into a shared delivery checklist and working outline.`,
        assignedUserId: second.user_id,
        assignmentReason: `${second.name} is assigned based on ${second.strengths.join(", ") || "team availability"}.`,
        priority: "high",
        complexity: "low",
        dueDate: dateAt(input.startDate, input.endDate, 0.2),
        acceptanceCriteria: ["Checklist covers every success criterion", "The team can review one shared artifact"],
        expectedEvidenceTypes: ["document", "link"],
        estimatedMinutes: 120,
        successImpact: "Clarifies what proof must exist for the project to count as successful.",
      },
      {
        title: "Build the core working result",
        description: `Create the minimum functional version of ${input.title}.`,
        assignedUserId: first.user_id,
        assignmentReason: `${first.name} has ${first.availability_minutes_per_day} minutes per day and relevant strengths: ${first.strengths.join(", ") || "delivery"}.`,
        priority: "critical",
        complexity: "high",
        dueDate: dateAt(input.startDate, input.endDate, 0.65),
        acceptanceCriteria: ["Core result is usable end to end", "All critical paths are demonstrated"],
        expectedEvidenceTypes: ["demo", "github", "screenshot"],
        estimatedMinutes: 360,
        dependencies: ["Define the delivery checklist"],
        successImpact: "Creates the minimum success version the team can inspect.",
      },
      {
        title: "Validate criteria and prepare final demo",
        description: "Test the result against the agreed criteria, fix critical gaps, and record the final proof.",
        assignedUserId: second.user_id,
        assignmentReason: `${second.name} can provide an independent validation pass.`,
        priority: "high",
        complexity: "medium",
        dueDate: input.endDate,
        acceptanceCriteria: input.successCriteria.map((criterion) => `Show evidence for: ${criterion}`),
        expectedEvidenceTypes: ["video", "demo", "document"],
        estimatedMinutes: 180,
        dependencies: ["Build the core working result"],
        successImpact: "Provides the final review package for the team.",
      },
    ],
    risks: [
      { risk: "The team may spend too long polishing before the core flow works.", mitigation: "Agree on the minimum success version first.", severity: "medium" },
      { risk: "Evidence may be added too late to support a fair final review.", mitigation: "Require proof at every submitted task checkpoint.", severity: "high" },
    ],
    minimumSuccessVersion: `A working result that demonstrably satisfies the highest-priority criteria for ${input.title}.`,
    ambitiousSuccessVersion: `A polished result satisfying every criterion with a clear demo and strong evidence trail.`,
  };
}

export function mockDisputeRecommendation(input: {
  taskTitle: string;
  performerExplanation: string;
  rejectionReason: string;
  evidenceCount: number;
}): DisputeRecommendation {
  return {
    neutralSummary: `The performer disputes the rejection of "${input.taskTitle}". The task has ${input.evidenceCount} evidence item(s).`,
    argumentsForApproval: [input.performerExplanation, "Submitted evidence indicates meaningful work was attempted."],
    argumentsForRejection: [input.rejectionReason, "Acceptance criteria must be visibly demonstrated."],
    missingInformation: input.evidenceCount ? [] : ["No evidence item is attached to the task."],
    recommendedResolution: input.evidenceCount ? "needs_changes" : "manual_review",
    confidence: input.evidenceCount ? 72 : 48,
    suggestedNextAction: "Owner should compare the evidence directly with each acceptance criterion and record a human resolution.",
    reasoning: "This recommendation is advisory and based on the performer explanation, rejection reason, and evidence count.",
  };
}

export function mockFinalReport(input: {
  title: string;
  successCriteria: string[];
  tasks: Array<{ status: string; due_date: string }>;
  members: Array<{ user_id: string; name: string; approved: number; evidence: number }>;
  disputeCount: number;
}): FinalReport {
  const approved = input.tasks.filter((task) => task.status === "approved").length;
  const rejected = input.tasks.filter((task) => task.status === "rejected").length;
  const disputed = input.tasks.filter((task) => task.status === "disputed").length;
  const ratio = input.tasks.length ? approved / input.tasks.length : 0;

  return {
    projectSummary: `${input.title} finished with ${approved} of ${input.tasks.length} planned tasks approved.`,
    successCriteriaEvaluation: input.successCriteria.map((criterion) => ({
      criterion,
      status: ratio >= 0.8 ? "achieved" : ratio >= 0.4 ? "partially_achieved" : "unclear",
      reasoning: "Evaluation is inferred from task approvals and submitted evidence; the team must confirm the outcome.",
    })),
    taskStatistics: {
      total: input.tasks.length,
      approved,
      rejected,
      needsChanges: input.tasks.filter((task) => task.status === "needs_changes").length,
      disputed,
      overdue: input.tasks.filter((task) => task.status !== "approved" && new Date(task.due_date) < new Date()).length,
    },
    memberContributions: input.members.map((member) => ({
      userId: member.user_id,
      contributionScore: Math.min(100, member.approved * 25 + member.evidence * 10),
      strengthsObserved: member.evidence ? [`${member.evidence} recorded evidence item(s)`] : [],
      issues: member.approved ? [] : ["No approved assigned task was recorded."],
      evidenceQuality: member.evidence ? 75 : 30,
      consistency: member.approved ? 80 : 40,
      reasoning: `${member.name} supplied ${member.evidence} evidence item(s) and completed ${member.approved} approved task(s).`,
      pledgeRecommendation: {
        recommendedReturnPercentage: member.approved > 0 ? 100 : member.evidence > 0 ? 70 : 0,
        reasoning: "Recommendation is based on approved work and recorded evidence only.",
      },
    })),
    evidenceQualityAnalysis: `Overall evidence quality is estimated at ${Math.round(Math.min(100, ratio * 70 + 20))}/100 from approvals and proof counts.`,
    delayAnalysis: "Late counts compare task due dates with the report generation date.",
    disputeSummary: `${input.disputeCount} dispute(s) were recorded. Human resolutions take precedence over AI recommendations.`,
    finalRecommendation: "This mocked report uses transparent task and evidence counts. It is a recommendation, not a financial or legal decision.",
    projectSuccessScore: Math.round(ratio * 100),
    confidence: input.tasks.length ? 75 : 35,
    humanConfirmationNotice: "AI recommendation only. Final pledge decisions must be confirmed manually by the team.",
  };
}
