# CommitBet UI/UX iteration

Date: 2026-10-24 (Europe/Vilnius)

## Executive summary

Improved the existing Next.js application in place. The iteration replaces the purple and orange identity, removes fabricated authenticated dashboard metrics, prioritizes the next real action, simplifies daily logging, improves the seven-step wizard, and makes peer review and AI limitations clearer.

The repository was cloned into `commit-bet/` without changing the reference documents in its parent workspace. The initial checkout was clean on `main` at `247e154931b75d51048bc3e5b165a34ab0f74911` (`Make AI plan replacement atomic and idempotent (#8)`). Work is on `codex/ui-ux-remediation`.

## Visual redesign

The main colors are background `#0B1220`, surface `#111C2E`, elevated surface `#19283C`, decorative border `#2B3B50`, teal primary `#2DD4BF`, hover `#14B8A6`, blue review accent `#60A5FA`, text `#F8FAFC`, and secondary text `#9FB0C3`.

Semantic success, warning, danger and AI colors are `#34D399`, `#FBBF24`, `#FB7185` and `#7DD3FC`. Shared Tailwind tokens replace hardcoded violet, purple, orange and cyan classes. Purple glow effects and marketing gradients were removed. Inputs use a stronger `#60738A` border to provide at least 3:1 contrast against the surface; the initial weaker input border failed the new contrast test and was corrected.

Buttons, focus rings, inputs, badges, cards, typography, radii and reduced-motion behavior are consistent across public, authentication and protected UI. Teal buttons use dark navy text. Review, approved, changes requested, rejected and disputed states have text labels as well as different visual treatments. Disputes also use a dashed border.

## Audit remediation

| Original issue | Status | Implemented behavior |
| --- | --- | --- |
| Authenticated sample pledges, contribution scores and AI risk fallback | Fixed | Authenticated dashboard has no sample-data import; values come from authenticated RLS reads. No-data and query-error states are distinct. |
| Calendar-based progress clamped to fabricated percentages | Fixed | Approved tasks / all project tasks. Zero and 100 percent are valid. No-task state shows an em dash with an explanation. Calendar elapsed time is separate, including upcoming and expired sprints. |
| Misleading task and pledge labels | Fixed | Due-today count uses the calendar date and actionable assigned tasks in active sprints. Pending reviews exclude every own assignment. Commitment points include only this user's active `POINTS` pledges. |
| Six equally weighted mobile destinations | Fixed | Home, Sprints, prominent Log today, Reviews, More. Profile, settings, teams, creation, language and logout are accessible through the native modal. Active route and safe-area handling are present. |
| Dashboard decorative hierarchy | Fixed | Current sprint, next action, assigned attention queue, peer reviews, genuine secondary metrics and recent evidence. Sprint switching and a separate sprint list/history route are available. |
| Long daily log and disabled upload | Fixed | Summary, optional related tasks and optional proof link are the main flow. Date, minutes, blockers and next steps are disclosed on demand. File upload links go to the existing task evidence screen. |
| Daily-log input lost on recoverable errors | Fixed | Action-state errors and controlled fields retain input. Pending state disables submission; success is explicit. Validation and task ownership checks happen before writes. Existing proof links are checked on retry. |
| Hardcoded wizard preview presented as generated | Fixed | Clearly labeled illustrative example. Actual plan generation remains on the project page through the existing atomic workflow. |
| Wizard cognitive load and final review | Fixed | Compact numbered progress, early basic/date checks, fewer project types by default, optional member details, and a review of goal, criteria, dates, members and availability. |
| View Product linked to login | Fixed | Honest “See how it works” anchor, separate sign-in link, explicit sample-data preview and no-money explanation. |
| Task and approval clarity | Fixed; live integration not fully verified | Status explanations, evidence anchors, localized labels, explicit reviewer responsibility, evidence acknowledgement for approval, deliberate second step for rejection, and pending review state. Existing authorization and transitions are unchanged. |
| Extra project “success score” credited unapproved submissions | Fixed | Removed. Project overview uses verified approved-task completion, with no unapproved-task bonus. |
| AI trust and evidence limitations | Fixed in UI | Shared recommendation component explains actual data categories, distinguishes plan/dispute/final inputs, marks stored mock reports and shows confidence only when numeric. File contents and external links are explicitly not inspected. Human confirmation remains required. |
| EN/LT consistency | Improved | Existing translator/provider retained; additional dictionaries cover new UI and relevant existing task, project, review and final-report copy. User-authored text stays unchanged. Live language switching and localized dates are supported. |
| Responsive and accessibility verification | Partially complete | Six widths and both languages were browser tested. Keyboard modal behavior, overflow, submit docks, translation keys and palette contrast were checked. Physical mobile keyboards and complete live authenticated flows remain unverified. |

## Significant files

- `src/app/globals.css`, `src/components/ui.tsx`: semantic palette, shared visual styles, focus, progress accessibility and safe-area layout.
- `src/components/app-nav.tsx`, protected layout, new `/app/projects` page: navigation, native More dialog and sprint browsing.
- `src/components/dashboard.tsx`, `src/lib/dashboard.ts`, `src/lib/workspace.ts`, protected dashboard page: genuine data reads, action hierarchy, task/review semantics and honest error/empty states.
- `src/lib/progress.ts`: approved-work completion and separate calendar calculation.
- `src/components/daily-log-form.tsx`, `src/lib/daily-log.ts`, daily-log action/page: concise logging, optional details, validation, ownership checks, recovery and task-evidence navigation.
- `src/components/project-wizard.tsx`, `chip-select.tsx`: progressive disclosure, review and step navigation without replacing atomic project creation.
- Task, approvals, project overview, dispute and final-report pages: semantic statuses, genuine project completion, translation and evidence clarity.
- `src/components/review-form.tsx`, `task-status-help.tsx`, `ai-recommendation.tsx`: review guardrails, next-step guidance and consistent AI transparency.
- `src/lib/i18n.ts`, `ui-translations.ts`, `screen-copy.ts`, language provider and localized fields: additions to the existing localization system.
- Landing/auth screens: new identity, truthful preview, honest conversion actions.
- Unit tests, `tests/e2e/ui-remediation.spec.ts`, `playwright.ui.config.ts`, `tests/visual/`: isolated UI fixtures and regression checks. Fixtures are outside application routes and never write to the database.

No package dependencies or lockfile changes were required. The fixture server uses Vite already supplied by Vitest. A temporary Prettier CLI was used to format changed sources.

## Preserved boundaries

No SQL migration, RLS policy, Supabase SSR/auth helper, evidence bucket setting, signed-URL authorization, task-transition RPC, atomic creation/AI-plan action, self-review server check or human final-decision action was changed. Existing routes and compatibility redirects remain. The only changed persistence action is daily logging, which still uses the authenticated client and existing RLS.

## Validation

Commands were run from the cloned repository using bundled Node.js v24.22.1. Since npm was not installed globally, npm 10.9.2 was downloaded from the official npm registry into a temporary directory. Command environment:

```sh
PATH=/tmp/commitbet-bin:/Users/marijosius/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH
```

| Exact quality command | Result |
| --- | --- |
| `node /tmp/commitbet-npm/package/bin/npm-cli.js ci` | Pass; installed the existing lockfile. |
| `npm test` (baseline) | Pass: 6 files, 41 tests. |
| `npm run typecheck` | Pass. |
| `npm run lint` | Pass, no warnings. |
| `npm test` (iteration) | Pass: 10 files, 60 tests. |
| `npm run build` | Pass; production routes generated, including `/app/projects`. |
| `PLAYWRIGHT_BROWSER_EXECUTABLE_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' npm run test:e2e -- --config=playwright.ui.config.ts --max-failures=1` | Pass: 18 browser tests. |
| `PLAYWRIGHT_BROWSER_EXECUTABLE_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' npm run test:e2e -- --max-failures=1` | Failed at the registration prerequisite: app requested email confirmation instead of entering the authenticated dashboard. Stopped after one failure; remaining full integration scenarios were not run. |
| `git diff --check` | Pass. |

Initial UI-test fixture startup failures (missing router mock) and a case-sensitive wizard selector were fixed. An input-border contrast test caught an insufficient border contrast; the implemented token was strengthened. The final focused UI run passes all 18 tests.

The full E2E result does not establish a product regression: it cannot pass the email-confirmation prerequisite in this environment. It also does not establish that the complete authenticated workflow works; that still requires a configured test Supabase and verified test users. No authentication safeguard was weakened to get a green result. Docker/Supabase CLI are absent, so pgTAP/database tests were not run.

## Visual evidence

Actual Chromium rendering was used. The browser matrix covers 320, 375, 390, 768, 1024 and 1440 px in EN and LT. Each matrix case renders landing, login and isolated dashboard, empty, daily-log, wizard and review component states. Horizontal overflow and browser errors are checked, along with mobile navigation visibility and dock separation.

Screenshots are in `audit-evidence/`:

- `landing-before-deployed-390.png`, `landing-before-deployed-1440.png`: actual deployed public page before this local iteration. These are a deployed baseline, not a claim that production exactly matches the repository commit.
- `landing-en-390.png`, `landing-en-1440.png`, `landing-lt-390.png`, `landing-lt-1440.png`: local Next.js implementation after the redesign.
- `login-{en,lt}-{390,1440}.png`: local Next.js authentication screen.
- `{dashboard,empty,log,wizard,review}-{en,lt}-{390,1440}.png`: actual reusable components rendered by isolated test fixtures. Screenshots visibly identify sample test data. They are not screenshots of a live authenticated database session.

No before screenshots of authenticated project data were available. The complete task, dispute and final-report server pages were typechecked/built and inspected in source, but were not browser verified against live project data.

## Remaining limitations

1. Full registration/team/project/evidence/dispute/final-decision E2E and database/RLS integration need a local test Supabase or verified test accounts. Current registration reaches the email-confirmation gate.
2. Daily logging still spans the existing log, link and evidence tables without a new cross-table transaction. Partial-save errors are explicit and preserve input. Retry checks prevent ordinary duplicate proof, but concurrent submissions from separate tabs are not a database-enforced exactly-once operation.
3. File evidence uploads remain on task detail; daily logs intentionally link to that existing authorized workflow. AI still receives recorded claims/metadata rather than file contents; the interface states this limitation.
4. Viewport and keyboard navigation were tested in Chromium. Physical iOS/Android keyboards, device safe-area hardware and a full screen-reader audit were not available.

## Git and deployment

Branch: `codex/ui-ux-remediation`.

Base: `247e154931b75d51048bc3e5b165a34ab0f74911`. This iteration is being committed on `codex/ui-ux-remediation` for publication to the existing GitHub repository at the user’s explicit request. Use `git log -1` for the resulting revision. Parent reference documents are preserved. No merge into main is included.

The original instruction prohibited automatic deployment. A later explicit user message, “padeployink po pakeitimu,” authorized deployment after changes. Deployment access is now being checked against the existing Vercel project; no merge into main is authorized or needed for a direct Vercel deployment.

Deployment access result: `npm exec --yes --package=vercel -- vercel whoami` reported “Logged out” (CLI 65.2.0). `npm exec --yes --package=vercel -- vercel login` started an OAuth device login. Deployment is waiting for the user to complete that login or connect the Vercel integration. No temporary/new Vercel project was created, no production deployment was triggered, and no branch was merged.
