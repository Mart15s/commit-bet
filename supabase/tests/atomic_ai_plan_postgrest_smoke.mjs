import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const url = process.env.LOCAL_SUPABASE_URL;
const anonKey = process.env.LOCAL_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.LOCAL_SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceRoleKey) {
  throw new Error("Local Supabase smoke-test environment is incomplete.");
}

const clientOptions = {
  auth: {
    autoRefreshToken: false,
    detectSessionInUrl: false,
    persistSession: false,
  },
};
const admin = createClient(url, serviceRoleKey, clientOptions);
const userClient = createClient(url, anonKey, clientOptions);
const email = `atomic-plan-${randomUUID()}@postgrest.test`;
const password = `Local-${randomUUID()}-pass`;
const projectId = randomUUID();
const idempotencyKey = randomUUID();
let userId;
let teamId;

function assertResult(condition, message) {
  if (!condition) throw new Error(message);
}

try {
  const { data: createdUser, error: createUserError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
  if (createUserError) throw createUserError;
  userId = createdUser.user.id;

  const { error: signInError } = await userClient.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError) throw signInError;

  const { data: createdTeamId, error: teamError } = await userClient.rpc(
    "create_team",
    { team_name: "Atomic plan PostgREST smoke" },
  );
  if (teamError) throw teamError;
  teamId = createdTeamId;

  const { data: createdProjectId, error: projectError } =
    await userClient.rpc("create_project_with_members", {
      p_request_id: projectId,
      p_team_id: teamId,
      p_project_type: "MVP",
      p_title: "PostgREST atomic plan",
      p_description: "Exercise the production RPC transport locally.",
      p_goal: "Confirm atomic plan replacement through PostgREST.",
      p_selected_success_criteria: ["One generated task exists"],
      p_custom_success_criteria: [],
      p_start_date: "2026-07-24",
      p_end_date: "2026-08-06",
      p_pledge_amount: 20,
      p_pledge_amount_is_custom: false,
      p_members: [
        {
          member_id: userId,
          roles: ["owner"],
          strengths: ["planning"],
          weaknesses: [],
          availability_minutes_per_day: 60,
          preferred_work_types: ["review"],
          evidence_types: ["demo"],
          experience_level: "Advanced",
          best_work_time: "Morning",
          notes: "",
          custom_notes: "",
          pledge: { amount: 20, currency: "POINTS" },
        },
      ],
    });
  if (projectError) throw projectError;
  assertResult(createdProjectId === projectId, "Project RPC result mismatched.");

  const plan = {
    phases: [{ name: "Build", description: "Build the complete result." }],
    deliverables: ["Working result"],
    tasks: [
      {
        title: "PostgREST generated task",
        description: "Create the complete result.",
        assigned_user_id: userId,
        assigned_reason: "The owner is the only project member.",
        priority: "high",
        due_date: "2026-08-02",
        acceptance_criteria: ["The result works"],
        expected_evidence_types: ["demo"],
      },
    ],
    risks: ["Scope growth"],
    minimum_success_version: "One complete result.",
    ambitious_success_version: "One polished complete result.",
  };
  const replacementArguments = {
    p_project_id: projectId,
    p_idempotency_key: idempotencyKey,
    p_plan: plan,
    p_ai_provider: "mock",
    p_ai_model: "postgrest-smoke-v1",
    p_input_snapshot: { source: "postgrest-smoke" },
    p_payload_hash: "a".repeat(64),
  };

  const { data: firstResult, error: firstError } = await userClient.rpc(
    "replace_ai_project_plan",
    replacementArguments,
  );
  if (firstError) throw firstError;
  const { data: retryResult, error: retryError } = await userClient.rpc(
    "replace_ai_project_plan",
    replacementArguments,
  );
  if (retryError) throw retryError;

  const { data: tasks, error: tasksError } = await userClient
    .from("tasks")
    .select("id, title, ai_generated")
    .eq("project_id", projectId)
    .eq("ai_generated", true);
  if (tasksError) throw tasksError;

  assertResult(firstResult?.replayed === false, "First RPC was not new.");
  assertResult(retryResult?.replayed === true, "Retry was not idempotent.");
  assertResult(tasks?.length === 1, "PostgREST smoke found duplicate tasks.");

  process.stdout.write(
    `POSTGREST_SMOKE_OK first=${firstResult.replayed} retry=${retryResult.replayed} tasks=${tasks.length}\n`,
  );
} finally {
  if (teamId) {
    await admin.from("teams").delete().eq("id", teamId);
  }
  if (userId) {
    await admin.auth.admin.deleteUser(userId);
  }
}
