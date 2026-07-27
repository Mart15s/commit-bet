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
const ownerClient = createClient(url, anonKey, clientOptions);
const anonymousClient = createClient(url, anonKey, clientOptions);
const email = `atomic-finalization-${randomUUID()}@postgrest.test`;
const password = `Local-${randomUUID()}-pass`;
const projectId = randomUUID();
const finalizationKey = randomUUID();
let userId;
let teamId;
let finalReportId;

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

  const { error: signInError } = await ownerClient.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError) throw signInError;

  const { data: createdTeamId, error: teamError } = await ownerClient.rpc(
    "create_team",
    { team_name: "Atomic finalization PostgREST smoke" },
  );
  if (teamError) throw teamError;
  teamId = createdTeamId;

  const { error: projectError } = await ownerClient.rpc(
    "create_project_with_members",
    {
      p_request_id: projectId,
      p_team_id: teamId,
      p_project_type: "MVP",
      p_title: "PostgREST atomic project finalization",
      p_description: "Exercise finalization through the production transport.",
      p_goal: "Commit one human-confirmed virtual pledge result.",
      p_selected_success_criteria: ["One atomic final decision exists"],
      p_custom_success_criteria: [],
      p_start_date: isoDate(-7),
      p_end_date: isoDate(7),
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
          evidence_types: ["demo"],
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

  const { error: activationError } = await ownerClient
    .from("projects")
    .update({ status: "active" })
    .eq("id", projectId);
  if (activationError) throw activationError;

  const { error: directCompletionError } = await ownerClient
    .from("projects")
    .update({ status: "completed" })
    .eq("id", projectId);
  assertResult(
    Boolean(directCompletionError),
    "Direct project completion bypass was accepted.",
  );

  const finalReportOutput = {
    project_summary: "Saved recommendation for a virtual pledge outcome.",
    pledge_recommendation: [
      {
        user_id: userId,
        pledge_return_percentage: 100,
        reason: "The recorded project result supports a full virtual return.",
      },
    ],
    human_confirmation_required: true,
  };
  const { data: finalReport, error: finalReportError } = await ownerClient
    .from("ai_reports")
    .insert({
      project_id: projectId,
      type: "final",
      input_snapshot: { project: { id: projectId } },
      output: finalReportOutput,
      model: "mock-finalization-postgrest-v1",
      provider: "mock",
    })
    .select("id")
    .single();
  if (finalReportError) throw finalReportError;
  finalReportId = finalReport.id;

  const finalAction = [{ user_id: userId, return_percentage: 100 }];
  const rpcArguments = {
    p_project_id: projectId,
    p_final_report_id: finalReportId,
    p_idempotency_key: finalizationKey,
    p_final_action: finalAction,
    p_confirmation_note: "Confirmed through authenticated PostgREST.",
  };

  const { error: directDecisionError } = await ownerClient
    .from("final_decisions")
    .insert({
      project_id: projectId,
      final_report_id: finalReportId,
      ai_recommendation: finalReportOutput,
      confirmed_by: userId,
      final_action: {},
    });
  const { error: directPledgeError } = await ownerClient
    .from("pledges")
    .update({ status: "confirmed" })
    .eq("project_id", projectId);
  const { error: directAuditError } = await ownerClient
    .from("audit_logs")
    .insert({
      project_id: projectId,
      user_id: userId,
      action: "final_decision_confirmed",
      details: {},
    });

  const { data: firstResult, error: firstError } = await ownerClient.rpc(
    "finalize_project",
    rpcArguments,
  );
  if (firstError) throw firstError;
  const { data: retryResult, error: retryError } = await ownerClient.rpc(
    "finalize_project",
    rpcArguments,
  );
  if (retryError) throw retryError;

  const { error: conflictError } = await ownerClient.rpc(
    "finalize_project",
    {
      ...rpcArguments,
      p_final_action: [{ user_id: userId, return_percentage: 50 }],
    },
  );
  const { error: newKeyError } = await ownerClient.rpc(
    "finalize_project",
    {
      ...rpcArguments,
      p_idempotency_key: randomUUID(),
    },
  );
  const { error: anonymousError } = await anonymousClient.rpc(
    "finalize_project",
    rpcArguments,
  );

  const [
    { data: decisions },
    { data: pledges },
    { data: projects },
    { data: audit },
  ] = await Promise.all([
    ownerClient
      .from("final_decisions")
      .select("id, final_report_id, confirmed_by")
      .eq("project_id", projectId),
    ownerClient
      .from("pledges")
      .select("status, amount, currency")
      .eq("project_id", projectId),
    ownerClient
      .from("projects")
      .select("status")
      .eq("id", projectId),
    ownerClient
      .from("audit_logs")
      .select("id")
      .eq("project_id", projectId)
      .eq("action", "final_decision_confirmed"),
  ]);

  assertResult(Boolean(directDecisionError), "Direct decision bypass was accepted.");
  assertResult(Boolean(directPledgeError), "Direct pledge bypass was accepted.");
  assertResult(Boolean(directAuditError), "Direct audit bypass was accepted.");
  assertResult(firstResult?.replayed === false, "First finalization was not new.");
  assertResult(retryResult?.replayed === true, "Exact retry was not replayed.");
  assertResult(
    firstResult?.final_decision_id === retryResult?.final_decision_id,
    "Exact retry returned a different final decision.",
  );
  assertResult(Boolean(conflictError), "Conflicting key reuse was accepted.");
  assertResult(Boolean(newKeyError), "A new key finalized the project twice.");
  assertResult(Boolean(anonymousError), "Anonymous RPC execution was accepted.");
  assertResult(decisions?.length === 1, "PostgREST created duplicate decisions.");
  assertResult(
    decisions?.[0]?.final_report_id === finalReportId
      && decisions?.[0]?.confirmed_by === userId,
    "The committed decision lost report or confirmer identity.",
  );
  assertResult(
    pledges?.length === 1
      && pledges[0].status === "confirmed"
      && Number(pledges[0].amount) === 20
      && pledges[0].currency === "POINTS",
    "The project pledge was incomplete or financially modified.",
  );
  assertResult(
    projects?.length === 1 && projects[0].status === "completed",
    "The project was not completed.",
  );
  assertResult(audit?.length === 1, "PostgREST audit rows were duplicated.");

  process.stdout.write(
    "POSTGREST_PROJECT_FINALIZATION_SMOKE_OK decisions=1 pledges=1 project=completed audit=1 replayed=true direct_bypass=blocked\n",
  );
} finally {
  if (teamId) {
    await admin.from("teams").delete().eq("id", teamId);
  }
  if (userId) {
    await admin.auth.admin.deleteUser(userId);
  }
}
