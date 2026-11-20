import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FileCheck2,
  Info,
  ListTodo,
  Play,
  PlugZap,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/layout";
import {
  AvailabilityStatusBadge,
  ConnectionStatusBadge,
  ExecutionStatusBadge,
  StatusBadge,
  type StatusTone,
} from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { overviewDemoData } from "./demo-data";
import type {
  ActivityEvent,
  ActivityEventType,
  Agent,
  AgentExecutionState,
  Project,
  ProjectStatus,
} from "./types";

type DashboardCardProps = {
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
  className?: string;
  children: ReactNode;
};

function DashboardCard({
  title,
  description,
  href,
  linkLabel = "View all",
  className,
  children,
}: DashboardCardProps) {
  return (
    <Card className={cn("min-w-0 gap-4", className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-card-title font-semibold">{title}</h2>
          {description && (
            <CardDescription className="mt-1">
              {description}
            </CardDescription>
          )}
        </div>
        {href && (
          <Link
            href={href}
            className="inline-flex shrink-0 items-center gap-1 rounded-sm text-metadata font-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            {linkLabel}
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </Link>
        )}
      </CardHeader>
      <CardContent className="min-w-0">{children}</CardContent>
    </Card>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <Card className="min-w-0 gap-0 py-0">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-body text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
          </div>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Icon className="size-4" aria-hidden="true" />
          </span>
        </div>
        <p className="mt-2 break-words text-metadata text-muted-foreground">
          {detail}
        </p>
      </CardContent>
    </Card>
  );
}

function AgentDetail({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-metadata text-muted-foreground">{label}</dt>
      <dd className="mt-1 min-w-0 text-body text-foreground">{children}</dd>
    </div>
  );
}

const agentExecutionPresentation: Record<
  AgentExecutionState,
  { label: string; tone: StatusTone }
> = {
  running: { label: "Running", tone: "operational" },
  idle: { label: "Idle", tone: "neutral" },
  waiting: { label: "Waiting", tone: "attention" },
  blocked: { label: "Blocked", tone: "critical" },
  failed: { label: "Failed", tone: "critical" },
};

function AgentExecutionStateBadge({ state }: { state: AgentExecutionState }) {
  const presentation = agentExecutionPresentation[state];
  return (
    <StatusBadge tone={presentation.tone} category="Execution state">
      {presentation.label}
    </StatusBadge>
  );
}

function AgentCard({ agent }: { agent: Agent }) {
  return (
    <article className="min-w-0 rounded-md border border-border p-3">
      <div className="min-w-0">
        <h3 className="break-words text-body font-semibold">{agent.name}</h3>
        <p className="mt-0.5 break-words text-body text-muted-foreground">
          {agent.responsibility}
        </p>
        <Badge variant="outline" className="mt-2">
          {agent.framework}
        </Badge>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <AgentDetail label="Connectivity">
          <ConnectionStatusBadge status={agent.connectivity} />
        </AgentDetail>
        <AgentDetail label="Execution state">
          <AgentExecutionStateBadge state={agent.executionState} />
        </AgentDetail>
        <AgentDetail label="Availability">
          <AvailabilityStatusBadge status={agent.availability} />
        </AgentDetail>
        <AgentDetail label="Current task">
          {agent.currentTask ? (
            <Link
              href="/tasks"
              className="line-clamp-2 break-words font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
            >
              {agent.currentTask}
            </Link>
          ) : (
            <span className="text-muted-foreground">No current task</span>
          )}
        </AgentDetail>
        <AgentDetail label="Last seen">
          {agent.lastSeen ?? (
            <span className="text-muted-foreground">Not reported</span>
          )}
        </AgentDetail>
      </dl>
    </article>
  );
}

function AgentHealthCard() {
  return (
    <DashboardCard
      title="Agent workforce health"
      description="Connectivity, execution state, and availability are shown separately."
      href="/agents"
      linkLabel="All agents"
      className="xl:col-span-2"
    >
      <div className="space-y-3">
        {overviewDemoData.agents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>
      <p className="mt-3 text-metadata text-muted-foreground">
        Framework names are informational metadata. Customers operate their
        agents on their own infrastructure.
      </p>
    </DashboardCard>
  );
}

function ExecutionProgress({ value, id }: { value?: number; id: string }) {
  if (value === undefined) {
    return <span className="text-body text-muted-foreground">Not reported</span>;
  }

  return (
    <div className="flex min-w-24 items-center gap-2">
      <Progress
        value={value}
        aria-label={`${id} demonstration progress`}
        className="max-w-20"
      />
      <span className="text-metadata tabular-nums text-muted-foreground">
        {value}%
      </span>
    </div>
  );
}

function ActiveExecutionsCard() {
  return (
    <DashboardCard
      title="Active executions"
      description="Current runs in this demonstration snapshot."
      href="/executions"
      linkLabel="All executions"
      className="xl:col-span-2"
    >
      <Table aria-label="Active executions" className="min-w-[700px]">
        <TableHeader>
          <TableRow>
            <TableHead>Execution</TableHead>
            <TableHead>Task</TableHead>
            <TableHead>Agent</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Started</TableHead>
            <TableHead>Progress</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {overviewDemoData.executions.map((execution) => (
            <TableRow key={execution.id}>
              <TableCell className="font-medium tabular-nums">
                {execution.id}
              </TableCell>
              <TableCell className="max-w-52">
                <span className="line-clamp-2">{execution.taskName}</span>
                <span className="mt-0.5 block text-metadata text-muted-foreground">
                  Duration {execution.duration}
                </span>
              </TableCell>
              <TableCell className="min-w-40">{execution.agentName}</TableCell>
              <TableCell>
                <ExecutionStatusBadge status={execution.status} />
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {execution.startedAt}
              </TableCell>
              <TableCell>
                <ExecutionProgress
                  value={execution.progress}
                  id={execution.id}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="mt-3 text-metadata text-muted-foreground">
        Progress is illustrative and may not be available for every agent or
        integration.
      </p>
    </DashboardCard>
  );
}

const projectStatusPresentation: Record<
  ProjectStatus,
  { label: string; tone: StatusTone }
> = {
  "on-track": { label: "On track", tone: "operational" },
  "at-risk": { label: "At risk", tone: "attention" },
  completed: { label: "Completed", tone: "neutral" },
};

function ProjectOverviewCard({ project }: { project: Project }) {
  const status = projectStatusPresentation[project.status];
  return (
    <li className="rounded-md border border-border p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="break-words text-body font-medium">{project.name}</h3>
          <p className="mt-1 text-metadata text-muted-foreground">
            {project.openTasks} open {project.openTasks === 1 ? "task" : "tasks"}
          </p>
        </div>
        <StatusBadge tone={status.tone} category="Project status">
          {status.label}
        </StatusBadge>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Progress
          value={project.progress}
          aria-label={`${project.name} demonstration progress`}
          className="flex-1"
        />
        <span className="w-10 text-right text-metadata tabular-nums text-muted-foreground">
          {project.progress}%
        </span>
      </div>
    </li>
  );
}

function ProjectsCard() {
  return (
    <DashboardCard
      title="Projects"
      description="Progress estimates and open task counts from sample project data."
      href="/projects"
      linkLabel="All projects"
      className="xl:col-span-2"
    >
      <ul className="space-y-3">
        {overviewDemoData.projects.map((project) => (
          <ProjectOverviewCard key={project.id} project={project} />
        ))}
      </ul>
    </DashboardCard>
  );
}

function TaskOverviewCard() {
  const { tasks } = overviewDemoData;
  const summary = [
    { label: "Open tasks", value: tasks.open, icon: ListTodo },
    { label: "In progress", value: tasks.inProgress, icon: Activity },
    { label: "Awaiting review", value: tasks.awaitingReview, icon: Clock3 },
    {
      label: "Completed this period",
      value: tasks.completedThisPeriod,
      icon: CheckCircle2,
    },
  ];

  return (
    <DashboardCard
      title="Task overview"
      description="Work status across this demonstration workspace."
      href="/tasks"
      linkLabel="All tasks"
    >
      <dl className="grid grid-cols-2 gap-3">
        {summary.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-md border border-border p-3">
            <dt className="flex items-center gap-1.5 text-metadata text-muted-foreground">
              <Icon className="size-3.5" aria-hidden="true" />
              {label}
            </dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 border-t border-border pt-3">
        <h3 className="text-body font-medium">Recently completed</h3>
        <ul className="mt-2 space-y-3">
          {tasks.recentlyCompleted.map((task) => (
            <li
              key={task.id}
              className="flex min-w-0 items-start justify-between gap-3"
            >
              <div className="min-w-0">
                <Link
                  href="/tasks"
                  className="line-clamp-2 break-words text-body font-medium text-foreground hover:text-primary"
                >
                  {task.title}
                </Link>
                <p className="mt-0.5 break-words text-metadata text-muted-foreground">
                  {task.project}
                </p>
              </div>
              <span className="shrink-0 text-metadata text-muted-foreground">
                {task.completedAt}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </DashboardCard>
  );
}

function ReviewQueueCard() {
  return (
    <DashboardCard
      title="Human review queue"
      description="Submitted work awaiting a human review."
      href="/tasks"
      linkLabel="Review tasks"
      className="border-warning/40 xl:col-span-2"
    >
      <ul className="space-y-3">
        {overviewDemoData.reviewQueue.map((item) => (
          <li
            key={item.taskId}
            className="flex min-w-0 flex-col gap-3 rounded-md border border-border p-3 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="min-w-0">
              <Link
                href="/tasks"
                className="break-words text-body font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
              >
                {item.title}
              </Link>
              <p className="mt-1 break-words text-body text-muted-foreground">
                {item.project}
              </p>
              <p className="mt-1 break-words text-metadata text-muted-foreground">
                Submitted by {item.submittedBy} · {item.submittedAt}
              </p>
            </div>
            <StatusBadge
              tone="attention"
              category="Review status"
              className="shrink-0"
            >
              Awaiting review
            </StatusBadge>
          </li>
        ))}
      </ul>
    </DashboardCard>
  );
}

const activityIcons: Record<ActivityEventType, LucideIcon> = {
  "agent-connected": PlugZap,
  "task-claimed": ListTodo,
  "execution-started": Play,
  "execution-completed": CheckCircle2,
  "deliverable-submitted": FileCheck2,
  "agent-error": CircleAlert,
};

const activityTones: Record<ActivityEventType, string> = {
  "agent-connected": "text-success",
  "task-claimed": "text-info",
  "execution-started": "text-primary",
  "execution-completed": "text-success",
  "deliverable-submitted": "text-warning-foreground",
  "agent-error": "text-error",
};

function ActivityItem({ event }: { event: ActivityEvent }) {
  const Icon = activityIcons[event.type];
  return (
    <li className="flex min-w-0 gap-3">
      <span
        className={cn(
          "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted",
          activityTones[event.type],
        )}
      >
        <Icon className="size-3.5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-body font-medium">{event.summary}</p>
        <p className="mt-0.5 break-words text-body text-muted-foreground">
          {event.agent} ·{" "}
          <Link
            href={event.href}
            className="text-foreground underline-offset-4 hover:text-primary hover:underline"
          >
            {event.subject}
          </Link>
        </p>
        <time className="mt-1 block text-metadata text-muted-foreground">
          {event.occurredAt}
        </time>
      </div>
    </li>
  );
}

function RecentActivityCard() {
  return (
    <DashboardCard
      title="Recent activity"
      description="A sample timeline of workforce events."
      href="/executions"
      linkLabel="Executions"
    >
      <ol className="space-y-4">
        {overviewDemoData.activity.map((event) => (
          <ActivityItem key={event.id} event={event} />
        ))}
      </ol>
    </DashboardCard>
  );
}

function UsageCard() {
  const { usage } = overviewDemoData;
  const tokenCount = new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(usage.estimatedTokens);
  const estimatedCost = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(usage.estimatedCost);

  return (
    <DashboardCard
      title="Usage and cost snapshot"
      description={usage.period}
      href="/usage"
      linkLabel="Usage details"
    >
      <dl className="grid grid-cols-2 gap-3">
        <div>
          <dt className="text-body text-muted-foreground">
            Estimated tokens
          </dt>
          <dd className="mt-1 text-xl font-semibold tabular-nums">
            {tokenCount}
          </dd>
        </div>
        <div>
          <dt className="text-body text-muted-foreground">
            Estimated cost
          </dt>
          <dd className="mt-1 text-xl font-semibold tabular-nums">
            {estimatedCost}
          </dd>
        </div>
      </dl>
      <div className="mt-4 flex gap-2 border-t border-border pt-3">
        <Info
          className="mt-0.5 size-4 shrink-0 text-info"
          aria-hidden="true"
        />
        <p className="text-metadata text-muted-foreground">
          Illustrative estimates only. These are not provider-reported usage or
          billing values.
        </p>
      </div>
    </DashboardCard>
  );
}

function AlertsCard() {
  return (
    <DashboardCard
      title="Needs attention"
      description="Exceptions that may need an operator follow-up."
    >
      <ul className="space-y-3">
        {overviewDemoData.alerts.map((alert) => (
          <li key={alert.id}>
            <Link
              href={alert.href}
              className="group block rounded-md border border-border p-3 outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-start gap-2">
                  <AlertCircle
                    className={cn(
                      "mt-0.5 size-4 shrink-0",
                      alert.severity === "critical"
                        ? "text-error"
                        : "text-warning-foreground",
                    )}
                    aria-hidden="true"
                  />
                  <span className="min-w-0">
                    <span className="block break-words text-body font-medium text-foreground">
                      {alert.title}
                    </span>
                    <span className="mt-1 block break-words text-metadata text-muted-foreground">
                      {alert.description}
                    </span>
                  </span>
                </div>
                <ArrowUpRight
                  className="size-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
                  aria-hidden="true"
                />
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
        <CircleAlert className="size-4 text-muted-foreground" aria-hidden="true" />
        <p className="text-metadata text-muted-foreground">
          Alerts are sample items, not live incidents.
        </p>
      </div>
    </DashboardCard>
  );
}

function OverviewDashboard({ dateLabel }: { dateLabel: string }) {
  const { agents, executions, tasks } = overviewDemoData;
  const connectedAgents = agents.filter(
    (agent) => agent.connectivity === "connected",
  ).length;
  const runningExecutions = executions.filter(
    (execution) => execution.status === "running",
  ).length;
  const waitingExecutions = executions.filter(
    (execution) => execution.status === "waiting",
  ).length;

  return (
    <>
      <PageHeader
        title="Overview"
        description="Monitor your AI workforce, track ongoing work, and identify what needs attention."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline" className="border-info/30 text-info">
              Demo data
            </Badge>
            <div className="flex items-center gap-2 text-body text-muted-foreground">
              <CalendarDays className="size-4 shrink-0" aria-hidden="true" />
              <time>{dateLabel}</time>
            </div>
          </div>
        }
      />

      <div className="mt-4 flex items-start gap-2 rounded-md border border-info/25 bg-info/5 p-3 text-body text-foreground">
        <Info className="mt-0.5 size-4 shrink-0 text-info" aria-hidden="true" />
        <p>
          <span className="font-medium">Demonstration snapshot.</span> This
          illustrative view is not connected to customer-owned agents, live
          telemetry, or provider billing.
        </p>
      </div>

      <section
        aria-label="Workforce summary"
        className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <MetricCard
          icon={UsersRound}
          label="Total agents"
          value={String(agents.length)}
          detail="In this representative demo workspace"
        />
        <MetricCard
          icon={PlugZap}
          label="Connected agents"
          value={`${connectedAgents} / ${agents.length}`}
          detail="Degraded and disconnected states are reported separately"
        />
        <MetricCard
          icon={Activity}
          label="Active executions"
          value={String(executions.length)}
          detail={`${runningExecutions} running · ${waitingExecutions} waiting on input`}
        />
        <MetricCard
          icon={CheckCircle2}
          label="Tasks completed"
          value={String(tasks.completedThisPeriod)}
          detail="Completed this period · demonstration only"
        />
      </section>

      <div className="mt-4 grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <AgentHealthCard />
        <AlertsCard />
        <ActiveExecutionsCard />
        <UsageCard />
        <TaskOverviewCard />
        <ProjectsCard />
        <ReviewQueueCard />
        <RecentActivityCard />
      </div>
    </>
  );
}

export { OverviewDashboard };
