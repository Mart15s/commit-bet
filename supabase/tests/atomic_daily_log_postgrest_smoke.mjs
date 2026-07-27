import { createHash, randomUUID } from "node:crypto";
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
const anonymousClient = createClient(url, anonKey, clientOptions);
const email = `atomic-daily-log-${randomUUID()}@postgrest.test`;
const password = `Local-${randomUUID()}-pass`;
const projectId = randomUUID();
const planKey = randomUUID();
const dailyLogKey = randomUUID();
let userId;
let teamId;

function assertResult(condition, message) {
  if (!condition) throw new Error(message);
}

function isoDate(offsetDays) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().slice(0, 10);
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
    { team_name: "Atomic daily log PostgREST smoke" },
  );
  if (teamError) throw teamError;
  teamId = createdTeamId;

  const startDate = isoDate(-1);
  const endDate = isoDate(14);
  const { error: projectError } = await userClient.rpc(
    "create_project_with_members",
    {
      p_request_id: projectId,
      p_team_id: teamId,
      p_project_type: "MVP",
      p_title: "PostgREST atomic daily log",
      p_description: "Exercise the daily log RPC over the production transport.",
      p_goal: "Confirm one atomic and idempotent daily log save.",
      p_selected_success_criteria: ["One complete daily log exists"],
      p_custom_success_criteria: [],
      p_start_date: startDate,
      p_end_date: endDate,
      p_pledge_amount: 20,
      p_pledge_amount_is_custom: false,
      p_members: [
        {
          member_id: userId,
          roles: ["owner"],
          strengths: ["delivery"],
          weaknesses: [],
          availability_minutes_per_day: 60,
          preferred_work_types: ["build"],
          evidence_types: ["link"],
          experience_level: "Advanced",
          best_work_time: "Morning",
          notes: "",
          custom_notes: "",
          pledge: { amount: 20, currency: "POINTS" },
        },
      ],
    },
  );
  if (projectError) throw projectError;

  const plan = {
    phases: [{ name: "Build", description: "Build the complete result." }],
    deliverables: ["Working result"],
    tasks: [
      {
        title: "PostgREST daily log task",
        description: "Create the complete result.",
        assigned_user_id: userId,
        assigned_reason: "The owner is the project member.",
        priority: "high",
        due_date: isoDate(7),
        acceptance_criteria: ["The result works"],
        expected_evidence_types: ["link"],
      },
    ],
    risks: ["Scope growth"],
    minimum_success_version: "One complete result.",
    ambitious_success_version: "One polished complete result.",
  };
  const { data: planResult, error: planError } = await userClient.rpc(
    "replace_ai_project_plan",
    {
      p_project_id: projectId,
      p_idempotency_key: planKey,
      p_plan: plan,
      p_ai_provider: "mock",
      p_ai_model: "daily-log-postgrest-setup-v1",
      p_input_snapshot: { source: "daily-log-postgrest-smoke" },
      p_payload_hash: "a".repeat(64),
    },
  );
  if (planError) throw planError;
  const taskId = planResult?.task_ids?.[0];
  assertResult(taskId, "Plan setup did not return a task.");

  const { error: activationError } = await userClient
    .from("projects")
    .update({ status: "active" })
    .eq("id", projectId);
  if (activationError) throw activationError;

  const payload = {
    project_id: projectId,
    log_date: isoDate(0),
    summary: "Saved through the PostgREST daily log RPC.",
    time_spent_minutes: 75,
    blockers: "",
    next_steps: "Confirm the stored task link and proof.",
    task_ids: [taskId],
    proof_links: ["https://example.test/postgrest-daily-proof"],
  };
  const payloadHash = createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
  const rpcArguments = {
    p_idempotency_key: dailyLogKey,
    p_payload: payload,
    p_payload_hash: payloadHash,
  };

  const { data: firstResult, error: firstError } = await userClient.rpc(
    "save_daily_log_with_tasks",
    rpcArguments,
  );
  if (firstError) throw firstError;
  const { data: retryResult, error: retryError } = await userClient.rpc(
    "save_daily_log_with_tasks",
    rpcArguments,
  );
  if (retryError) throw retryError;

  const { error: conflictError } = await userClient.rpc(
    "save_daily_log_with_tasks",
    {
      ...rpcArguments,
      p_payload: {
        ...payload,
        summary: "A different payload reusing the same key.",
      },
      p_payload_hash: "b".repeat(64),
    },
  );
  const { error: anonymousError } = await anonymousClient.rpc(
    "save_daily_log_with_tasks",
    rpcArguments,
  );

  const [{ data: logs }, { data: taskLinks }, { data: proof }, { data: audit }] =
    await Promise.all([
      userClient
        .from("daily_logs")
        .select("id")
        .eq("project_id", projectId),
      userClient
        .from("daily_log_tasks")
        .select("daily_log_id, task_id")
        .eq("daily_log_id", firstResult.daily_log_id),
      userClient
        .from("evidence")
        .select("daily_log_id, task_id, url")
        .eq("daily_log_id", firstResult.daily_log_id),
      userClient
        .from("audit_logs")
        .select("id")
        .eq("project_id", projectId)
        .eq("action", "daily_log_submitted"),
    ]);

  assertResult(firstResult?.replayed === false, "First save was not new.");
  assertResult(retryResult?.replayed === true, "Retry was not replayed.");
  assertResult(Boolean(conflictError), "Conflicting key reuse was accepted.");
  assertResult(Boolean(anonymousError), "Anonymous RPC execution was accepted.");
  assertResult(logs?.length === 1, "PostgREST created duplicate daily logs.");
  assertResult(taskLinks?.length === 1, "PostgREST task links were incomplete.");
  assertResult(proof?.length === 1, "PostgREST proof rows were incomplete.");
  assertResult(audit?.length === 1, "PostgREST audit rows were duplicated.");

  process.stdout.write(
    "POSTGREST_DAILY_LOG_SMOKE_OK logs=1 task_links=1 proof=1 audit=1 replayed=true\n",
  );
} finally {
  if (teamId) {
    await admin.from("teams").delete().eq("id", teamId);
  }
  if (userId) {
    await admin.auth.admin.deleteUser(userId);
  }
}
