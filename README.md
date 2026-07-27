# CommitBet

CommitBet is a mobile-first AI accountability web app for small teams. Teams create a project, define success criteria, declare virtual pledge points, generate an execution plan, submit evidence, review each other's work, resolve disputes, and confirm a final pledge outcome manually.

AI is advisory only. The MVP does not collect, hold, transfer, or distribute real money.

## Tech Stack

- Next.js 16 App Router with TypeScript
- Tailwind CSS
- Supabase Auth, Postgres, Row Level Security, and Storage
- OpenAI Responses API behind a server-only service layer
- Mock AI mode by default
- Vitest and Playwright for focused verification

## Setup

1. Install dependencies:

```bash
npm install
```

2. Start Docker Desktop.

3. Start local Supabase:

```bash
npx supabase start --ignore-health-check
```

The project disables local Supabase analytics in `supabase/config.toml` for a smoother Windows local setup.

4. Copy local keys into `.env.local`.

This workspace already contains a generated `.env.local` for the current local Supabase stack. For a fresh machine, run:

```bash
npx supabase status -o env
```

Then set:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<PUBLISHABLE_KEY>
# NEXT_PUBLIC_SUPABASE_ANON_KEY=<LEGACY_ANON_KEY>
NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000
SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY>
GEMINI_API_KEY=<server-only-key>
GEMINI_MODEL=gemini-3.6-flash
AI_PROVIDER=mock
```

For the production Vercel environment, set `NEXT_PUBLIC_SITE_URL` to the
canonical deployment URL, such as `https://commit-bet.vercel.app`. Also set
`NEXT_PUBLIC_SUPABASE_URL` to the hosted Supabase project URL, not
`http://127.0.0.1:54321`, and use the project publishable key for
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

5. Run the app:

```bash
npm run dev
```

Open `http://127.0.0.1:3000`.

## Supabase Migrations

Reset and apply migrations:

```bash
npx supabase db reset
```

Main schema:

- `profiles`
- `teams`, `team_members`
- `projects`, `project_member_profiles`, `pledges`
- `tasks`, `task_assignments`
- `daily_logs`, `daily_log_tasks`
- `evidence`
- `reviews`, `disputes`
- `ai_reports`, `final_decisions`
- `audit_logs`, `notifications`

RLS is enabled on all public tables. Server Actions also verify the authenticated user and team/project relationship before mutating data.

## Deterministic AI Test Mode

Mock mode is reserved for local automated tests:

```bash
AI_PROVIDER=mock
```

The mock planner returns deterministic phases, tasks, risks, evidence requirements, dispute recommendations, and final reports based on project inputs.

## Gemini Mode

Set:

```bash
GEMINI_API_KEY=<your-server-only-key>
GEMINI_MODEL=gemini-3.6-flash
```

Gemini calls are server-only, time-bounded, prompt-injection delimited, and use strict structured Zod output validation. Production never silently falls back to mock mode when the key is missing.

## MVP Flow

1. Register or log in.
2. Create a team.
3. Create a project with success criteria, selected members, profiles, and virtual pledges.
4. Generate a Gemini AI plan (or a deterministic mock only in tests).
5. Review/edit generated task basics and start the project.
6. Assignee adds evidence and submits the task.
7. Another team member approves, requests changes, or rejects.
8. Rejected assignee can open a dispute and get an AI recommendation.
9. Owner generates the final report.
10. Owner manually confirms the virtual pledge decision.

## Demo Scenario

Use the wizard to create:

- Project: `Build a landing page and waitlist in 7 days`
- Members: Martynas and Jonas
- Criteria:
  - Landing page online
  - Waitlist form works
  - Data stored in database
  - 3 value proposition sections
  - Final demo video
- Pledge: 20 points each

## Verification

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npx supabase db reset
npx supabase test db
npm run test:e2e
```

The Supabase commands apply every migration from zero and run the pgTAP database
authorization tests. `test:e2e` starts the Next.js dev server and verifies the
browser flows.

## MVP Limitations

- No real payments or escrow.
- No marketplace.
- No GitHub/Figma integration.
- No background job worker.
- Notifications are schema-only/minimal.
- One assignee per task.
- One open dispute per task.
- Email/password auth only.

## No-Real-Payments Disclaimer

CommitBet MVP uses only virtual pledge points or declared commitment amounts. AI reports are recommendations only. Humans make all final pledge decisions, and the app does not transfer money.
