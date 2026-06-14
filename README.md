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
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY>
SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY>
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.5
AI_PROVIDER=mock
```

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

## Mocked AI Mode

Mocked AI is the default and works without an OpenAI key:

```bash
AI_PROVIDER=mock
OPENAI_API_KEY=
```

The mock planner returns deterministic phases, tasks, risks, evidence requirements, dispute recommendations, and final reports based on project inputs.

## Optional OpenAI Mode

Set:

```bash
AI_PROVIDER=openai
OPENAI_API_KEY=<your-key>
OPENAI_MODEL=gpt-5.5
```

OpenAI calls are server-only and use structured Zod output validation. If no API key is present, the app falls back to mock mode.

## MVP Flow

1. Register or log in.
2. Create a team.
3. Create a project with success criteria, selected members, profiles, and virtual pledges.
4. Generate a mock AI plan.
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

Install Playwright's Chromium build once:

```bash
npx playwright install chromium
```

To use an existing Chrome installation instead, set `PLAYWRIGHT_CHROME_PATH`
to its executable path.

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

`test:e2e` starts the Next.js dev server and verifies the mobile landing page.

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
