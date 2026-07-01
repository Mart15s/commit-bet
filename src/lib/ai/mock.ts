import type {
  DisputeRecommendation,
  FinalReport,
  ProjectPlan,
} from "@/lib/validation";

type Member = {
  user_id: string;
  name: string;
  strengths: string[];
  availability_minutes_per_day: number;
};

type PlanInput = {
  title: string;
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
    phases: [
      { name: "Align", description: "Confirm the outcome, proof, and smallest shippable version." },
      { name: "Build", description: "Produce the core deliverables with evidence after each meaningful step." },
      { name: "Validate", description: "Test the result against every agreed success criterion." },
    ],
    deliverables: input.successCriteria,
    tasks: [
      {
        title: "Define the delivery checklist",
        description: `Turn the goal "${input.goal}" into a shared delivery checklist and working outline.`,
        assigned_user_id: second.user_id,
        assigned_reason: `${second.name} is assigned based on ${second.strengths.join(", ") || "team availability"}.`,
        priority: "high",
        due_date: dateAt(input.startDate, input.endDate, 0.2),
        acceptance_criteria: ["Checklist covers every success criterion", "The team can review one shared artifact"],
        expected_evidence_types: ["document", "link"],
      },
      {
        title: "Build the core working result",
        description: `Create the minimum functional version of ${input.title}.`,
        assigned_user_id: first.user_id,
        assigned_reason: `${first.name} has ${first.availability_minutes_per_day} minutes per day and relevant strengths: ${first.strengths.join(", ") || "delivery"}.`,
        priority: "critical",
        due_date: dateAt(input.startDate, input.endDate, 0.65),
        acceptance_criteria: ["Core result is usable end to end", "All critical paths are demonstrated"],
        expected_evidence_types: ["demo", "github", "screenshot"],
      },
      {
        title: "Validate criteria and prepare final demo",
        description: "Test the result against the agreed criteria, fix critical gaps, and record the final proof.",
        assigned_user_id: second.user_id,
        assigned_reason: `${second.name} can provide an independent validation pass.`,
        priority: "high",
        due_date: input.endDate,
        acceptance_criteria: input.successCriteria.map((criterion) => `Show evidence for: ${criterion}`),
        expected_evidence_types: ["video", "demo", "document"],
      },
    ],
    risks: [
      "The team may spend too long polishing before the core flow works.",
      "Evidence may be added too late to support a fair final review.",
    ],
    minimum_success_version: `A working result that demonstrably satisfies the highest-priority criteria for ${input.title}.`,
    ambitious_success_version: `A polished result satisfying every criterion with a clear demo and strong evidence trail.`,
  };
}

export function mockDisputeRecommendation(input: {
  taskTitle: string;
  performerExplanation: string;
  rejectionReason: string;
  evidenceCount: number;
}): DisputeRecommendation {
  return {
    neutral_summary: `The performer disputes the rejection of "${input.taskTitle}". The task has ${input.evidenceCount} evidence item(s).`,
    arguments_for_approval: [input.performerExplanation, "Submitted evidence indicates meaningful work was attempted."],
    arguments_for_rejection: [input.rejectionReason, "Acceptance criteria must be visibly demonstrated."],
    missing_information: input.evidenceCount ? [] : ["No evidence item is attached to the task."],
    recommended_resolution: input.evidenceCount ? "needs_changes" : "manual_review",
    confidence_score: input.evidenceCount ? 72 : 48,
    suggested_next_action: "Owner should compare the evidence directly with each acceptance criterion and record a human resolution.",
  };
}

export function mockFinalReport(input: {
  title: string;
  successCriteria: string[];
  tasks: Array<{ status: string; due_date: string }>;
  members: Array<{ user_id: string; name: string; approved: number; evidence: number }>;
  disputeCount: number;
  evidenceCount?: number;
  pledgePool?: number;
}): FinalReport {
  const approved = input.tasks.filter((task) => task.status === "approved").length;
  const rejected = input.tasks.filter((task) => task.status === "rejected").length;
  const disputed = input.tasks.filter((task) => task.status === "disputed").length;
  const ratio = input.tasks.length ? approved / input.tasks.length : 0;

  return {
    project_summary: `${input.title} finished with ${approved} of ${input.tasks.length} planned tasks approved.`,
    success_criteria_evaluation: input.successCriteria.map((criterion) => ({
      criterion,
      status: ratio >= 0.8 ? "met" : ratio >= 0.4 ? "partially_met" : "unclear",
      comment: "Evaluation is inferred from task approvals and submitted evidence; the team must confirm the outcome.",
    })),
    task_statistics: {
      planned: input.tasks.length,
      approved,
      rejected,
      disputed,
      late: input.tasks.filter((task) => task.status !== "approved" && new Date(task.due_date) < new Date()).length,
    },
    member_contributions: input.members.map((member) => ({
      user_id: member.user_id,
      contribution_score: Math.min(100, member.approved * 25 + member.evidence * 10),
      summary: `${member.name} supplied ${member.evidence} evidence item(s) and completed ${member.approved} approved task(s).`,
      strongest_evidence: member.evidence ? [`${member.evidence} recorded evidence item(s)`] : [],
      issues: member.approved ? [] : ["No approved assigned task was recorded."],
    })),
    evidence_quality_score: Math.round(Math.min(100, ratio * 70 + 20)),
    delay_analysis: "Late counts compare task due dates with the report generation date.",
    dispute_summary: `${input.disputeCount} dispute(s) were recorded. Human resolutions take precedence over AI recommendations.`,
    pledge_recommendation: input.members.map((member) => ({
      user_id: member.user_id,
      pledge_return_percentage: member.approved > 0 ? 100 : member.evidence > 0 ? 70 : 0,
      reason: "Recommendation is based on approved work and recorded evidence only.",
    })),
    reasoning: `This report uses transparent task and evidence counts: ${input.evidenceCount ?? input.members.reduce((total, member) => total + member.evidence, 0)} evidence item(s), ${input.disputeCount} dispute(s), and ${input.pledgePool ?? 0} virtual pledge point(s). It is a recommendation, not a financial or legal decision.`,
    confidence_score: input.tasks.length ? 75 : 35,
    human_confirmation_required: true,
  };
}
