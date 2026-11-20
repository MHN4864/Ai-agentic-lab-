# Agent Workforce

A multi-tenant workspace for managing customer-owned, framework-agnostic AI
agent workforces. Agents run on customer infrastructure; this application
provides the management experience.

## Stack

- Next.js App Router, React, and strict TypeScript
- Tailwind CSS v4
- shadcn/ui (Base UI primitives) and Lucide icons
- Recharts for data-backed demonstration charts

## Project structure

```text
src/
  app/                 App Router routes and global styles
  components/layout/   Page and section layout primitives
  components/ui/       Reusable shadcn/ui components
  features/agent-onboarding/ Typed, in-memory agent setup wizard
  features/agents/     Typed agent registry and demonstration records
  features/members/    Member directory, profiles, forms, and shared demo state
  features/teams/      Team directory, profiles, management, and demo data
  features/overview/   Typed overview dashboard data and presentation
  features/projects/   Project registry, collaboration workspace, and demo data
  features/tasks/      Task registry, shared forms, assignment, and demo data
  features/reviews/    Human review queue, deliverables, and demo decisions
  features/executions/ Execution registry, summaries, and demo sessions
  features/monitoring/ Workforce health, activity, attention, and insights
  features/analytics/  Typed workforce analytics and demonstration charts
  features/usage-costs/ Usage and cost estimates from execution demo records
  lib/                 Shared utilities
```

Add product-specific features in focused `src/features/<feature>/` folders as
they are introduced. Keep API clients, mock data, and domain types separate
from presentation components; do not treat frontend visibility as tenant
security.

## Design conventions

- Configure colors, typography, and radius centrally in `src/app/globals.css`.
- Use semantic theme utilities such as `bg-background`, `bg-surface`,
  `text-muted-foreground`, and `border-border` rather than hardcoded colors.
- Geist Sans and Geist Mono are loaded with `next/font` and exposed as theme
  font families.
- Use `text-page-title`, `text-section-title`, `text-card-title`, `text-body`,
  `text-metadata`, and `text-control` for typography; use
  `text-muted-foreground` for secondary text.
- Use Tailwind's 4px spacing scale, subtle borders, `rounded-md`/`rounded-lg`
  surfaces, and the shared components in `src/components/ui/`.
- Use `md` (768px) as the mobile/tablet boundary and `xl` (1280px) as the
  tablet/desktop boundary: mobile uses drawer navigation, tablet uses a compact
  icon rail, and desktop uses the expandable sidebar. Page and section headers
  stack below `md`; keep flex children `min-w-0` and let actions wrap.
- Keep page content inside `ContentContainer`; place wide future tables in
  their own responsive overflow container instead of widening the page.
- Use `ConnectionStatusBadge`, `ExecutionStatusBadge`, and
  `AvailabilityStatusBadge` for their separate status concepts. Status labels
  are always visible in addition to the color indicator.
- The light theme is active by default. `.dark` semantic tokens are prepared
  for future use; no theme switcher is included.

## Overview dashboard demo data

- Typed overview models, sample data, and dashboard presentation live under
  `src/features/overview/`.
- Dashboard metrics, agent status, execution progress, and usage values are
  illustrative only and are not connected to agent telemetry or providers.

## Agent registry demo data

- Typed agent identity, framework metadata, independent operational states,
  capability reports, permissions, activity, executions, and estimated usage
  live under `src/features/agents/`.
- Registry and profile values are demonstration-only. Missing telemetry is
  shown as not reported; no live agent controls or credential management are
  implemented.

## Universal agent onboarding demo

- The four-step wizard lives under `src/features/agent-onboarding/` and is
  available at `/agents/connect`.
- Form state remains in memory while navigating wizard steps; it is not saved
  to browser storage or sent to a backend. Leaving the wizard or refreshing
  clears the draft.
- Verification is simulated only. The flow does not connect agents, discover
  metadata or capabilities, create registry records, or request credentials.

## Projects demo data

- Typed project records, the registry, and the collaboration workspace live
  under `src/features/projects/`. Project-to-agent relationships reference
  centralized records in `src/features/agents/`.
- Project details use nested Overview, Work, Agents, Activity, and Settings
  routes. Work items and activity events are illustrative data, not live tasks
  or real-time collaboration.
- Creating or editing projects updates shared in-memory state for the current
  workspace session only. Changes are not persisted to a backend or browser
  storage. Work-item assignment and execution are not implemented.

## Global tasks demo data

- The `/tasks` registry, create/edit forms, and task details live under
  `src/features/tasks/`. Task records reference centralized projects, agents,
  and workspace members by ID.
- Task status is a separate domain from agent execution state. Readiness is an
  informational demonstration and does not start execution.
- Human and agent assignments, collaborative assignees, and a separate
  assignment history are demonstration-only. Assignment designates ownership;
  it does not mean an agent accepted or started work.
- Task and project changes remain in workspace memory only; there are no
  backend APIs, task execution controls, or persistence.

## Human review demo data

- The `/reviews` queue, review details, and task deliverable submission area
  live under `src/features/reviews/`. Review records reference existing task,
  project, agent, and member records by ID.
- Task status, agent execution, deliverable submission, review status, and
  human decisions are distinct. Explicit approval marks the task Completed;
  requesting changes or rejecting returns it to Ready without cancelling or
  failing the task.
- Deliverables, feedback, and decisions are demonstration-only and remain in
  workspace memory. Attachment entries are placeholders; there are no uploads,
  backend persistence, notifications, or enforced permissions.

## Execution registry and observability demo data

- The `/executions` registry and `/executions/[executionId]` details live under
  `src/features/executions/`. Execution records reference existing agents,
  tasks, projects, and associated reviews by ID.
- Lifecycle events, static trace spans, performance metrics, output previews,
  and diagnostics are illustrative. Missing telemetry is labeled as not
  reported; failed and timed-out executions do not show successful output.
- Execution status remains separate from task status, agent connectivity and
  availability, and review status. The registry does not trigger or control
  agent runtimes and does not use live tracing, connections, APIs, or
  persistence.

## Workforce monitoring demo data

- The `/monitoring` dashboard lives under `src/features/monitoring/` and
  reuses canonical agent, task, project, review, and execution records.
- Agent connectivity, execution state, and availability are displayed and
  filtered independently. Workforce events are centralized, typed, and
  illustrative; attention items are derived from the demonstration records.
- Activity timestamps and stale-activity awareness describe only the static
  sample window. The dashboard does not poll agents, deliver alerts, control
  runtimes, or claim to provide real-time telemetry.

## Workforce analytics demo

- The `/analytics` dashboard lives under `src/features/analytics/` and derives
  execution and task metrics from the existing typed agent, task, project,
  review, execution, and monitoring records.
- Time presets are anchored to the latest date in the sample. Project, agent,
  and execution-status filters update the applicable metrics; task lifecycle
  metrics remain independent of execution status.
- Task completion trends use recorded task status-history events. Workload,
  overdue tasks, and review queue values are current illustrative snapshots,
  not historical snapshots. Unavailable comparisons and sparse samples are
  identified instead of being inferred.
- Charts provide expandable data tables. All dates and values are illustrative;
  no live telemetry, predictive analytics, recommendations, or backend
  analytics service is connected.

## Usage and costs demo

- The `/usage` dashboard lives under `src/features/usage-costs/` and normalizes
  the existing execution token/cost fields and execution timeline events into
  typed usage records. It references existing agents, tasks, and projects by
  ID rather than duplicating those entities.
- Filters scope KPIs, trends, breakdowns, insights, and the searchable,
  sortable execution table. Charts include expandable accessible data tables,
  and execution rows link to their existing detail pages.
- Token totals and model-response counts use only recorded sample values.
  Estimated costs are shown only where an execution provides an estimate;
  missing telemetry is not inferred as zero. Cost shares and averages explain
  their limited sample coverage.
- Costs are illustrative estimates, not provider pricing, invoices, or a live
  billing feed. There are no provider connections, budget controls, backend
  persistence, or spend-limiting actions.

## Members and teams demo

- `/members` and `/members/[memberId]` provide a searchable, filterable human
  directory and profiles with derived task, project, and supported activity
  references. `/teams` and `/teams/[teamId]` show team membership and workload
  derived from existing project and task records.
- Member and team records are held in the shared workspace directory context.
  Create, edit, invitation-status, team association, and team lead changes are
  demonstration-only and reset on a full reload.
- Existing task assignees and review actors continue to reference stable member
  IDs. Project ownership is synchronized when a member is renamed; team/project
  relationships retain the existing project team-label compatibility.
- No invitation email, authentication account, permission enforcement,
  persistence, or backend service is implemented.

## Development

```bash
npm run dev
npm run lint
npm run build
```

## Authentication and onboarding demo

- Public flows are routed under `src/app/(public)/` and remain separate from
  the workspace shell.
- Sign-up, organization setup, invitations, sign-in, and password reset are
  frontend demonstrations only. They do not create accounts, save credentials,
  send messages, or create real organizations.
