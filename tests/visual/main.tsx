import { createRoot } from "react-dom/client";
import { LanguageProvider, T } from "../../src/components/language-provider";
import { AppNav } from "../../src/components/app-nav";
import { Dashboard, type DashboardProps } from "../../src/components/dashboard";
import { DailyLogForm } from "../../src/components/daily-log-form";
import { ProjectWizard } from "../../src/components/project-wizard";
import { ReviewForm } from "../../src/components/review-form";
import { AIRecommendation } from "../../src/components/ai-recommendation";
import { Card, PageHeader, StatusBadge } from "../../src/components/ui";
import { ProjectWorkspace } from "../../src/components/project-workspace";
import { TaskBoard } from "../../src/components/tasks/task-board";
import "../../src/app/globals.css";

const params = new URLSearchParams(location.search);
const view = params.get("view") || "dashboard";
const userId = "11111111-1111-4111-8111-111111111111";
const projectId = "22222222-2222-4222-8222-222222222222";
const taskId = "33333333-3333-4333-8333-333333333333";
const project = {
  id: projectId,
  title:
    "Ship the working signup flow with mobile proof and a clear handoff to our first five teams",
  goal: "Publish a working signup page, store test signups, and share a demo the team can verify.",
  status: "active",
  start_date: "2026-10-20",
  end_date: "2026-10-26",
};
const tasks = [
  {
    id: taskId,
    project_id: projectId,
    title: "Test signup and capture mobile evidence",
    status: "in_progress",
    priority: "high",
    due_date: "2026-10-24",
    task_assignments: [{ user_id: userId }],
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    project_id: projectId,
    title: "Publish the landing page",
    status: "approved",
    priority: "medium",
    due_date: "2026-10-22",
    task_assignments: [{ user_id: userId }],
  },
  {
    id: "55555555-5555-4555-8555-555555555555",
    project_id: projectId,
    title: "Record the final walkthrough",
    status: "submitted",
    priority: "high",
    due_date: "2026-10-25",
    task_assignments: [{ user_id: "peer" }],
  },
];
const data: DashboardProps = {
  projects: [project],
  tasks,
  pledges: [
    { project_id: projectId, user_id: userId, amount: 20, currency: "POINTS" },
  ],
  evidence: [
    {
      id: "proof",
      task_id: tasks[2].id,
      description: "A walkthrough showing the completed flow and saved signup.",
      type: "video",
      created_at: "2026-10-24T08:00:00Z",
    },
  ],
  userId,
  hasTeam: true,
  initialDate: "2026-10-24",
};
createRoot(document.getElementById("root")!).render(
  <LanguageProvider>
    <AppNav profile={{ name: "Alex" }} />
    <main
      id="main-content"
      className="app-main mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8"
    >
      <p className="mb-4 text-xs text-muted-foreground">
        UI TEST FIXTURE · sample data · no database writes
      </p>
      {view === "project" ? (
        <>
          <PageHeader title="Launch the working signup flow" />
          <ProjectWorkspace
            taskCount={tasks.length}
            reviewCount={1}
            overview={<Card><h2>Project overview</h2><p>One of three tasks is peer approved.</p><a href="#plan">Review the draft plan</a></Card>}
            plan={<Card><h2>Editable draft plan</h2><label>Task name<input defaultValue="Build the signup flow" /></label><p>AI recommendation. Human confirmation required.</p><a href="#edit-plan">Edit plan</a></Card>}
            tasks={<TaskBoard tasks={tasks.map(task => ({ ...task, dueDate: task.due_date, ownerName: "Alex", expectedEvidenceTypes: ["Demo link"], acceptanceCriteria: ["Show saved signup"] }))} />}
            evidence={<Card><h2>Submitted artifacts</h2><p>Walkthrough video · Awaiting peer review</p></Card>}
            reviews={<Card><h2>Human review</h2><ReviewForm taskId={taskId} /></Card>}
          />
        </>
      ) : view === "log" ? (
        <>
          <PageHeader title="log.title" description="log.copy" />
          <DailyLogForm
            projects={[{ ...project, tasks }]}
            initialDate="2026-10-24"
          />
        </>
      ) : view === "wizard" ? (
        <ProjectWizard
          teams={[
            {
              id: "66666666-6666-4666-8666-666666666666",
              name: "Small team",
              members: [
                { id: userId, name: "Alex", email: "alex@example.test" },
              ],
            },
          ]}
          creationRequestId="77777777-7777-4777-8777-777777777777"
        />
      ) : view === "review" ? (
        <div className="mx-auto max-w-2xl space-y-4">
          <PageHeader titleKey="Review submitted evidence" />
          <Card>
            <StatusBadge status="submitted" />
            <h2 className="mt-3 text-xl font-bold">
              Record the final walkthrough
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Acceptance criterion: show the completed signup flow and saved
              data.
            </p>
            <a className="mt-3 block text-primary" href="https://example.com">
              <T id="Open evidence" />
            </a>
            <ReviewForm taskId={taskId} />
          </Card>
          <AIRecommendation confidence={74} mock />
        </div>
      ) : (
        <Dashboard
          {...data}
          {...(view === "empty"
            ? {
                projects: [],
                tasks: [],
                pledges: [],
                evidence: [],
                hasTeam: false,
              }
            : {})}
          {...(view === "draft" ? { projects: [{ ...project, status: "draft" }], tasks: tasks.map(task => ({ ...task, status: "todo" })), evidence: [] } : {})}
          {...(view === "failed" ? { loadError: true } : {})}
        />
      )}
    </main>
  </LanguageProvider>,
);
