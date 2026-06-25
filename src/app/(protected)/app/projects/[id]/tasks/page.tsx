import { ButtonLink, PageHeader } from "@/components/ui";
import { TaskBoard, type BoardTask } from "@/components/tasks/task-board";
import { requireProjectMember } from "@/lib/auth";
import { singleRelation } from "@/lib/utils";

type Assignment = { user_id: string; assigned_reason: string; profiles: { name: string } };

export default async function ProjectTasksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, project } = await requireProjectMember(id);
  const { data: tasks } = await supabase
    .from("tasks")
    .select("*, task_assignments(user_id, assigned_reason, profiles(name))")
    .eq("project_id", id)
    .order("due_date");

  const boardTasks: BoardTask[] = (tasks ?? []).map((task) => {
    const assignment = singleRelation(task.task_assignments as unknown as Assignment | Assignment[]);
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.due_date,
      ownerName: assignment?.profiles?.name,
      expectedEvidenceTypes: task.expected_evidence_types ?? [],
      acceptanceCriteria: task.acceptance_criteria ?? [],
    };
  });

  return (
    <>
      <ButtonLink href={`/app/projects/${id}`} variant="ghost" size="sm" className="mb-3">Back to project</ButtonLink>
      <PageHeader
        eyebrow="Task board"
        title={project.title}
        description="Move work from todo to approved through evidence submission and peer review."
        action={project.status === "active" ? <ButtonLink href={`/app/logs/new?project=${id}`} variant="secondary">Daily log</ButtonLink> : undefined}
      />
      <TaskBoard tasks={boardTasks} />
    </>
  );
}
