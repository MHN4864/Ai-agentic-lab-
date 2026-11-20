# Ai Agentic Lab — Engineering Handoff

> You are taking over the engineering implementation of Ai Agentic Lab from another AI coding agent. Read this document completely before modifying code. The product vision, architecture decisions, completed steps, scope restrictions, and roadmap are already established. Do not redesign, re-plan, or repeat completed work without a strong technical reason. Check the actual repository state, identify the next incomplete step, and continue implementing that step only. Preserve existing functionality and conventions. Keep your work practical and token-efficient. If the previous agent stopped midway through a step, assess the current implementation and finish that step instead of starting the next one. Report completion and verification concisely.

## Current State / Resume Here

- Steps 01–19 are complete in the project history.
- **Next: STEP 20 — PERMISSIONS & GOVERNANCE.**
- The current product is a frontend demonstration built with Next.js App Router, React, TypeScript, and Tailwind CSS. Most domain data is illustrative and client-side; there is no product backend or real agent runtime.
- The latest Step 18 work added the `/usage` Usage & Costs dashboard, typed usage records derived from existing execution telemetry, global filters, cost/token charts, sortable breakdowns, execution links, and README documentation. Fresh validation for Step 18: TypeScript, ESLint, production build, and browser checks for filters, search, sorting, execution navigation, and responsive overflow passed.
- Step 19 added `/members`, `/members/[memberId]`, and `/teams` with detail, create, and edit routes; shared in-memory directory state; member/task/review relationship updates; project-owner synchronization; and demo-only membership management. Fresh validation: TypeScript, ESLint, production build, browser workflows, and responsive overflow checks passed.
- Workspace root: `C:\Users\hamza\Desktop\Ai Agentic lab`.
- The environment reports that this workspace is not a Git repository, so the current branch and Git status are unavailable. Do not initialize Git, push, merge, or change branches unless explicitly requested.
- For any new task, inspect the current repository first. If implementation is requested, implement only the requested numbered step and preserve approved functionality.

## Product Vision

Ai Agentic Lab is a multi-tenant SaaS Agent Workforce Management Platform. It helps organizations manage, coordinate, monitor, govern, and optimize AI agents alongside human employees. The initial target is AI-native startups and technical teams operating roughly 5–20 agents; that is a sizing assumption, not a product limit.

The platform is agent-agnostic. Customers bring and operate agents on their own infrastructure. The platform manages the connected workforce; it does not build, host, or execute customer agents in the current product model.

It is not an AI chatbot, agent builder, agent runtime/hosting product, Jira clone, or simple agent directory. Native projects and tasks are central; external work-tracking tools are optional future integrations.

## Architecture and Product Decisions

### Agent independence and connectivity

- Treat framework and model provider as metadata, never as eligibility or architectural constraints.
- The product direction includes OpenClaw, Hermes, LangGraph, LangChain, CrewAI, custom Python/TypeScript/Java agents, and future frameworks.
- Do not assume every agent exposes the same API, SDK, connector, webhook, runtime, or deployment model. Universal onboarding keeps integration details flexible and optional.
- Agents remain customer-managed. A frontend assignment does not mean acceptance, execution, or control.

### Separate operational and work lifecycles

Keep these dimensions distinct in models, UI, and derived metrics:

| Dimension | Values / concepts |
|---|---|
| Connectivity | Connected, Disconnected, Degraded |
| Agent execution state | Running, Idle, Waiting, Blocked, Failed |
| Availability | Available, Busy, Unavailable |
| Task | Status and ownership/assignment |
| Execution | Queued, Starting, Running, Waiting, Completed, Failed, Cancelled, Timed Out |
| Deliverable and review | Submission, In Review, Changes Requested, Approved, Rejected |

Assignment designates ownership; it is not acceptance or execution. Execution completion is not approval. Rejection is not cancellation or task failure. An approved result follows an explicit human review action.

### Human governance and tenancy

- Human reviewers are responsible for approval and rejection in the demonstration workflow. Agent submissions do not self-approve.
- Frontend labels and visibility are not authorization or security enforcement.
- Strict organization/tenant isolation is a future backend requirement. Do not claim that the current frontend provides tenant security.

## Actual Technology and Project Structure

### Installed stack

| Area | Current implementation |
|---|---|
| Framework | Next.js 16.4.6 App Router |
| UI | React 19.3, TypeScript 5, Tailwind CSS 4.3 |
| Components | Shared shadcn-style primitives backed by Base UI |
| Icons | Lucide React |
| Styling | Semantic CSS tokens in `src/app/globals.css`, light theme by default, dark tokens prepared |
| Package manager | `pnpm-lock.yaml` is present; prior commands used `corepack pnpm` |

Recharts is installed for the workforce analytics charts. React Hook Form, Zod, and TanStack Query are not installed. Avoid adding dependencies unless a requested feature genuinely requires them.

### Route map

- `src/app/(public)/`: demonstration sign-in/sign-up, password reset, organization setup, and optional invitations.
- `src/app/(workspace)/layout.tsx`: workspace provider composition and shared `AppShell`.
- `src/app/(workspace)/[section]/page.tsx`: Overview, Agents, Monitoring, Analytics, and Usage handling; remaining unimplemented navigation sections render placeholders.
- `/agents/[agentId]` and `/agents/connect` with nested configure, verify, and complete onboarding routes.
- `/projects`, `/projects/new`, `/projects/[projectId]`, and nested work, agents, activity, settings, and edit routes.
- `/tasks`, `/tasks/new`, `/tasks/[taskId]`, nested assignment, and edit routes.
- `/reviews` and `/reviews/[reviewId]`.
- `/executions` and `/executions/[executionId]`.
- `/monitoring`.
- `/analytics`.
- `/usage`.
- `/members`, `/members/new`, `/members/[memberId]`, and `/members/[memberId]/edit`.
- `/teams`, `/teams/new`, `/teams/[teamId]`, and `/teams/[teamId]/edit`.
- `/` redirects to the workspace Overview.

### Feature and shared-code layout

- `src/features/<feature>/`: product-specific types, demo data, contexts, and UI. Current feature folders include `agent-onboarding`, `agents`, `analytics`, `executions`, `members`, `monitoring`, `overview`, `projects`, `reviews`, `tasks`, `teams`, and `usage-costs`.
- `src/components/app-shell/` and `src/components/layout/`: application shell, navigation, page containers, and headers.
- `src/components/ui/`: reusable form, card, badge, table, alert, and other UI primitives.
- `src/config/navigation.ts`: typed workspace navigation.
- `src/lib/`: shared utilities.

Use the existing semantic theme classes, typography utilities, spacing, responsive patterns, status badges, and feature boundaries. Keep wide tables in their own horizontal scroll containers rather than widening the page.

### Data and state

- Keep demo data out of presentation components and use existing typed records/datasets wherever possible.
- Use IDs to relate agents, tasks, projects, executions, reviews, and members. Do not create duplicate entities when extending a feature.
- Workspace layout nests `ProjectsProvider > WorkforceDirectoryProvider > TasksProvider > ReviewsProvider > AppShell`. These React contexts hold project, member, team, task, assignment, review, and decision changes in memory across client-side workspace navigation.
- In-memory changes are not persisted to a database or browser storage; a full reload resets them to seed data. Agent, execution, monitoring, and many other feature datasets are static demonstrations.
- `src/features/members/demo-data.ts` preserves existing member IDs derived from project owners and work-item assignees, and supplies illustrative directory fields and statuses. Team records derive from existing project team labels; project/task relationships continue to reference the existing records.
- Member/team forms update shared in-memory state. Renaming a member synchronizes existing project owner labels; renaming a team preserves old and new project-label associations. Invitation status does not send email or create accounts.
- Feature-local demo models may not all be one live shared store. Check actual types and references before treating older sample values as canonical.
- Missing telemetry should remain “Not reported” or “Unavailable”; never fabricate zero or healthy states.

## Implementation Progress — Steps 01–19

All rows are **completed / approved** according to the project’s step sequence. Verification notes below are historical reports, not a fresh audit performed while writing this document. The saved checkpoints do not contain equally complete test details for every step.

| Step | Implementation and boundaries | Verification reported |
|---|---|---|
| 01 — Project Foundation | Next.js App Router, TypeScript, Tailwind baseline, and project configuration. | Build, TypeScript, and lint passed in the initial setup report. |
| 02 — Design System | Light-first semantic theme tokens and reusable UI primitives; dark-mode tokens prepared without a theme switcher. | Build, TypeScript, and lint were reported passing during foundation/design work. |
| 03 — Application Shell & Navigation | Grouped workspace navigation, shared shell, public/workspace layouts, menu previews, and Overview redirect. | Browser route checks and shell interactions, plus build/TypeScript/lint, were reported passing. |
| 04 — Responsive Layout Refinement | Mobile drawer below 768px, compact tablet navigation from 768px, desktop navigation from 1280px. | Responsive checks at 1440×900, 1024×768, 768×1024, and 390×844, plus TypeScript/build, were reported. |
| 05 — Authentication & Organization Onboarding | Demonstration sign-in/sign-up, password reset, organization setup, and optional invitations. No real accounts or messages. | Browser flow, optional paths, validation, responsive behavior, and empty storage checks; TypeScript, lint, and build were reported passing. |
| 06 — Overview Dashboard | Responsive operational overview with typed demonstration metrics and workforce summaries. | Four viewport checks and TypeScript/lint were reported passing; later project history records a successful build. |
| 07 — Agent Registry & Details | Searchable/filterable registry, agent profiles, framework metadata, independent operational states, and honest missing-telemetry states. | Browser filters, profile/unknown-agent behavior, responsive overflow, TypeScript, lint, and build were reported passing. |
| 08 — Universal Agent Onboarding | Four-step, framework-agnostic demo wizard. Optional integration details; no credentials, live verification, connection, or registry insertion. | Browser validation and client-navigation draft retention were reported. The saved checkpoint does not record a complete final end-to-end/build result. |
| 09 — Projects Management | Project registry, create/edit, details, filtering, and shared in-memory project state. | Completion and prior checks are recorded in project history; exact final test details are incomplete in saved checkpoints. |
| 10 — Project Collaboration Workspace | Nested Overview, Work, Agents, Activity, and Settings tabs; project-scoped work/activity demos; existing edit form reused. | Tab/filter/settings/unknown-project and responsive checks plus TypeScript/lint were reported. The saved checkpoint captured the build as pending. |
| 11 — Global Tasks Management | Task registry, create/edit/details, filters, status, project relationships, and informational readiness. | TypeScript, lint, production build, and browser checks were reported passing before Step 12. |
| 12 — Task Assignment & Coordination | Human/agent primary assignees, collaborators, reassignment, unassignment, history, agent-state guidance, and registry updates. Assignment does not trigger execution. | Later step requests treat this as approved. The saved Step 12 checkpoint predates final verification and has no final test logs. |
| 13 — Human Review & Approval | Deliverable submission, review queue/details, human review actions, feedback validation, and decision history. Review/task/execution statuses remain distinct. | Browser workflow and responsive checks plus TypeScript/lint were reported. The saved checkpoint captured production build as pending; do not interpret this context file as a new build run. |
| 14 — Execution Registry | Typed execution sessions, filters/sorting, derived metrics, related links, and unknown-ID handling. | TypeScript, lint, production build, filters, navigation, and responsive browser checks were reported passing. |
| 15 — Execution Details & Observability | Status-appropriate timeline, static trace, metrics, output/review references, and failure/timeout diagnostics. | TypeScript, lint, production build, multiple execution states, related links, not-found, and responsive checks were reported passing. |
| 16 — Agent Activity & Monitoring | `/monitoring`, independent agent health dimensions, filtered demo activity, derived attention items, sample execution insights, and recent executions. | TypeScript, ESLint, production build, and browser checks for navigation, filters, execution links, and mobile overflow passed in the immediately preceding task. |
| 17 — Workforce Analytics | `/analytics`, derived execution and task metrics, global filters, previous-period comparison where supported, agent performance table, charts with accessible table alternatives, and data-backed reliability/bottleneck insights. | TypeScript, ESLint, production build, and browser checks for execution-status/project/custom-range filters, sorting, no page-level mobile overflow, and no client errors passed in the current task. |
| 18 — Usage & Costs | `/usage`, typed execution-level usage records, sample-relative filters, derived token/cost/request KPIs, trend charts, agent/project/model breakdowns, cost insights, and searchable linked execution records. Missing telemetry remains unavailable. | TypeScript, ESLint, production build, and browser checks for filters, search, sorting, execution-detail navigation, and desktop/tablet/mobile page overflow passed in the current task. |
| 19 — Members & Teams | `/members` and `/teams` registries, profiles, create/edit flows, shared in-memory identities and teams, derived workload/activity summaries, stable task/review references, and team membership management. Invitations, statuses, and edits remain demo-only. | TypeScript, ESLint, production build, member/team create/edit and association browser flows, filtering/empty states, owner relationship synchronization, and page-level overflow at mobile, tablet, and desktop sizes passed in the current task. |

## Current Roadmap

This is the agreed approximate order. Adjust only intentionally and document the reason.

| Next | Planned step | Scope |
|---|---|---|
| **20** | **Permissions & Governance** | Role permissions, governance controls, and policies. |
| 21 | Integrations | External platform integrations. |
| 22 | Settings | Organization and platform configuration. |
| 23 | Billing | Subscription and billing experience. |
| 24 | Platform Refinement | UX consistency and missing workflow integration. |
| 25 | QA & Production Readiness | Quality assurance, security/backend readiness assessment, and launch preparation. |

## Technical Reality and Migration Boundaries

### Works in the frontend

- Workspace shell and the implemented registries, profiles, forms, project/task workflows, human review, execution observability, and monitoring are usable demonstrations.
- Some create/edit, task assignment, and review actions update React context and connected views during the current client session.
- Static data supports representative statuses, filtering, sorting, navigation, and empty/not-found states.

### Demonstration-only or not implemented

- Authentication and organization onboarding do not authenticate users or create accounts, organizations, invitations, or messages.
- Projects, tasks, assignments, reviews, members, and teams are not persisted. Member invitations do not provision accounts or send email. No backend API, database, real notifications, or external integration is connected.
- Agent onboarding does not connect to, verify, discover, or register an agent. The platform does not host, trigger, restart, claim, or cancel agent work.
- Execution events, traces, output, costs, and monitoring events/alerts are illustrative; there is no live telemetry, heartbeat polling, streaming, or alert delivery.
- Workforce analytics derives metrics from the available demonstration records. Time windows are sample-relative, task history is incomplete, and current task/review workload is a snapshot; unavailable comparisons are not fabricated.
- Usage values are derived from existing execution token and estimated-cost fields and recorded model-response events. Costs are illustrative estimates only; missing values are excluded from totals and averages, with no live pricing or billing connection.
- File attachments are placeholders, not uploads. Review responsibility and permission labels are not authorization enforcement.
- Governance, Integrations, and Settings remain navigation placeholders; Billing remains roadmap work.
- Passing frontend checks does not make the application production-ready. Backend tenancy isolation, authentication, authorization, integrations, persistence, real observability, privacy, and security still require deliberate implementation and review.

## Collaboration Workflow

1. Implement one numbered step at a time; do not build roadmap items early.
2. Read the actual current files and existing conventions before changing code. Resolve any partial implementation before starting the next step.
3. Preserve approved behavior. Reuse shared components, types, contexts, utilities, and canonical ID-based records. Avoid duplicate stores and unnecessary dependencies.
4. Keep demonstration data and future backend integration boundaries explicit. Never imply frontend visibility is security enforcement or that assignment starts execution.
5. Add only focused tests for new/fixed behavior where a test setup exists; otherwise run the smallest relevant existing checks and manual/browser checks.
6. Run the relevant TypeScript, lint, build, and responsive checks. Report what actually ran and distinguish historical reports from fresh verification.
7. Do not commit, push, merge, or change branches unless explicitly requested. Finish with a concise implementation summary and verification results.

## Common Commands

The project has `dev`, `lint`, `build`, and `start` package scripts. No dedicated automated test script is currently defined.

```powershell
corepack pnpm dev
corepack pnpm lint
corepack pnpm exec tsc --noEmit
corepack pnpm build
```
