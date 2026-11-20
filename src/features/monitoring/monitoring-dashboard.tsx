"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowUpDown,
  Bot,
  CircleAlert,
  CircleCheck,
  CircleX,
  Clock3,
  FilterX,
  Search,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AvailabilityStatusBadge,
  ConnectionStatusBadge,
  StatusBadge,
  type StatusTone,
} from "@/components/ui/status-badge";
import { agentDemoData } from "@/features/agents/demo-data";
import { AgentExecutionStateBadge } from "@/features/agents/agent-execution-state-badge";
import type {
  AgentAvailability,
  AgentConnectivity,
  AgentExecutionState,
  WorkforceAgent,
} from "@/features/agents/types";
import { useWorkforceDirectory } from "@/features/members/workforce-directory-context";
import { useProjects } from "@/features/projects/projects-context";
import { useReviews } from "@/features/reviews/reviews-context";
import { reviewStatusLabels } from "@/features/reviews/labels";
import { useTasks } from "@/features/tasks/tasks-context";
import { ExecutionStatusBadge } from "@/features/executions/execution-status-badge";
import { executionStatusLabels } from "@/features/executions/labels";
import { executionDemoData, executionObservabilityDemoData } from "@/features/executions/demo-data";
import {
  formatExecutionDuration,
  formatExecutionTimestamp,
} from "@/features/executions/execution-utils";
import { monitoringEventDemoData } from "./demo-data";
import {
  agentNeedsAttention,
  deriveMonitoringAlerts,
  getAgentLastActivityAt,
  monitoringCategories,
  monitoringCategoryLabels,
  monitoringEventTypeLabels,
  monitoringSeverities,
  monitoringSeverityLabels,
} from "./monitoring-utils";
import type {
  MonitoringAlert,
  MonitoringCategory,
  MonitoringEvent,
  MonitoringSeverity,
} from "./types";

const connectivityLabels: Record<AgentConnectivity, string> = {
  connected: "Connected",
  disconnected: "Disconnected",
  degraded: "Degraded",
};

const executionStateLabels: Record<AgentExecutionState, string> = {
  running: "Running",
  idle: "Idle",
  waiting: "Waiting",
  blocked: "Blocked",
  failed: "Failed",
};

const availabilityLabels: Record<AgentAvailability, string> = {
  available: "Available",
  busy: "Busy",
  unavailable: "Unavailable",
};

const connectivityOptions = Object.keys(
  connectivityLabels,
) as AgentConnectivity[];
const executionStateOptions = Object.keys(
  executionStateLabels,
) as AgentExecutionState[];
const availabilityOptions = Object.keys(
  availabilityLabels,
) as AgentAvailability[];

const severityTones: Record<MonitoringSeverity, StatusTone> = {
  info: "neutral",
  warning: "attention",
  critical: "critical",
};

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <Card className="min-w-0 gap-0 py-0">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-body text-muted-foreground">{title}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
          </div>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Icon className="size-4" aria-hidden="true" />
          </span>
        </div>
        <p className="mt-2 text-metadata text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function FilterSelect({
  id,
  label,
  value,
  onChange,
  options,
  allLabel,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
  allLabel: string;
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full min-w-0 rounded-md border border-input bg-surface px-3 text-control text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <option value="">{allLabel}</option>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: MonitoringSeverity }) {
  return (
    <StatusBadge tone={severityTones[severity]} category="Severity">
      {monitoringSeverityLabels[severity]}
    </StatusBadge>
  );
}

function healthPresentation(agent: WorkforceAgent) {
  if (!agentNeedsAttention(agent)) {
    return { label: "Operational", tone: "operational" as const };
  }

  if (
    agent.connectivity === "disconnected" ||
    agent.executionState === "blocked" ||
    agent.executionState === "failed"
  ) {
    return { label: "Attention", tone: "critical" as const };
  }

  return { label: "Attention", tone: "attention" as const };
}

function AgentHealthSection({
  tasks,
  events,
}: {
  tasks: ReturnType<typeof useTasks>["tasks"];
  events: MonitoringEvent[];
}) {
  const [search, setSearch] = useState("");
  const [connectivity, setConnectivity] = useState<AgentConnectivity | "">("");
  const [executionState, setExecutionState] = useState<
    AgentExecutionState | ""
  >("");
  const [availability, setAvailability] = useState<AgentAvailability | "">("");

  const filteredAgents = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    return agentDemoData.filter((agent) => {
      const matchesSearch =
        !normalizedSearch ||
        agent.name.toLocaleLowerCase().includes(normalizedSearch) ||
        agent.responsibility.toLocaleLowerCase().includes(normalizedSearch);
      return (
        matchesSearch &&
        (!connectivity || agent.connectivity === connectivity) &&
        (!executionState || agent.executionState === executionState) &&
        (!availability || agent.availability === availability)
      );
    });
  }, [availability, connectivity, executionState, search]);

  const hasFilters = Boolean(
    search || connectivity || executionState || availability,
  );

  function clearFilters() {
    setSearch("");
    setConnectivity("");
    setExecutionState("");
    setAvailability("");
  }

  return (
    <Card className="min-w-0">
      <CardHeader>
        <div>
          <h2 className="text-card-title font-semibold">Agent health</h2>
          <p className="text-metadata text-muted-foreground">
            Connectivity, execution state, and availability are independent
            reported dimensions.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 border-t border-border pt-4">
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(12rem,1.4fr)_repeat(3,minmax(9rem,1fr))_auto] xl:items-end">
          <div className="min-w-0 space-y-1.5">
            <Label htmlFor="monitoring-agent-search">Search agents</Label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="monitoring-agent-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Name or role"
                className="pl-9"
              />
            </div>
          </div>
          <FilterSelect
            id="monitoring-connectivity-filter"
            label="Connectivity"
            value={connectivity}
            onChange={(value) =>
              setConnectivity(value as AgentConnectivity | "")
            }
            options={connectivityOptions.map(
              (value) => [value, connectivityLabels[value]] as [string, string],
            )}
            allLabel="All connectivity"
          />
          <FilterSelect
            id="monitoring-execution-filter"
            label="Execution state"
            value={executionState}
            onChange={(value) =>
              setExecutionState(value as AgentExecutionState | "")
            }
            options={executionStateOptions.map(
              (value) => [value, executionStateLabels[value]] as [string, string],
            )}
            allLabel="All execution states"
          />
          <FilterSelect
            id="monitoring-availability-filter"
            label="Availability"
            value={availability}
            onChange={(value) =>
              setAvailability(value as AgentAvailability | "")
            }
            options={availabilityOptions.map(
              (value) => [value, availabilityLabels[value]] as [string, string],
            )}
            allLabel="All availability"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearFilters}
            disabled={!hasFilters}
            className="w-full sm:w-fit"
          >
            <FilterX aria-hidden="true" />
            Clear filters
          </Button>
        </div>

        <p aria-live="polite" className="text-metadata text-muted-foreground">
          {filteredAgents.length} of {agentDemoData.length} agents
        </p>

        {filteredAgents.length ? (
          <Table aria-label="Agent health" className="min-w-[1180px]">
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Connectivity</TableHead>
                <TableHead>Execution state</TableHead>
                <TableHead>Availability</TableHead>
                <TableHead>Current task</TableHead>
                <TableHead>Last activity</TableHead>
                <TableHead>Health</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAgents.map((agent) => {
                const health = healthPresentation(agent);
                const matchingTask = tasks.find(
                  (task) => task.title === agent.currentTask,
                );
                const lastActivityAt = getAgentLastActivityAt(
                  agent.id,
                  events,
                  executionDemoData,
                );
                return (
                  <TableRow key={agent.id}>
                    <TableCell className="min-w-56">
                      <Link
                        href={`/agents/${agent.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {agent.name}
                      </Link>
                      <p className="mt-1 text-metadata text-muted-foreground">
                        {agent.responsibility}
                      </p>
                    </TableCell>
                    <TableCell>
                      <ConnectionStatusBadge status={agent.connectivity} />
                    </TableCell>
                    <TableCell>
                      <AgentExecutionStateBadge state={agent.executionState} />
                    </TableCell>
                    <TableCell>
                      <AvailabilityStatusBadge status={agent.availability} />
                    </TableCell>
                    <TableCell className="min-w-52">
                      {agent.currentTask ? (
                        matchingTask ? (
                          <Link
                            href={`/tasks/${matchingTask.id}`}
                            className="text-primary hover:underline"
                          >
                            {agent.currentTask}
                          </Link>
                        ) : (
                          agent.currentTask
                        )
                      ) : (
                        <span className="text-muted-foreground">
                          Not reported
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="min-w-48 whitespace-nowrap">
                      {formatExecutionTimestamp(lastActivityAt)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        tone={health.tone}
                        category="Health indicator"
                      >
                        {health.label}
                      </StatusBadge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <EmptyState
            title="No agents match these filters"
            description="Try a different search or clear the selected status filters."
            icon={FilterX}
            action={
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            }
          />
        )}
      </CardContent>
    </Card>
  );
}

function actorName(
  event: MonitoringEvent,
  members: ReturnType<typeof useWorkforceDirectory>["members"],
) {
  const { actor } = event;
  switch (actor.type) {
    case "system":
      return actor.label;
    case "agent":
      return (
        agentDemoData.find((agent) => agent.id === actor.agentId)?.name ??
        "Agent unavailable"
      );
    case "human":
      return (
        members.find((member) => member.id === actor.memberId)?.name ??
        "Member unavailable"
      );
  }
}

function MonitoringEventReferences({
  event,
  tasks,
  projects,
}: {
  event: MonitoringEvent;
  tasks: ReturnType<typeof useTasks>["tasks"];
  projects: ReturnType<typeof useProjects>["projects"];
}) {
  const references: { key: string; label: string; href: string }[] = [];
  const agent = agentDemoData.find((item) => item.id === event.agentId);
  const task = tasks.find((item) => item.id === event.taskId);
  const project = projects.find((item) => item.id === event.projectId);

  if (agent) {
    references.push({
      key: `agent-${agent.id}`,
      label: agent.name,
      href: `/agents/${agent.id}`,
    });
  }
  if (task) {
    references.push({
      key: `task-${task.id}`,
      label: task.id,
      href: `/tasks/${task.id}`,
    });
  }
  if (project) {
    references.push({
      key: `project-${project.id}`,
      label: project.name,
      href: `/projects/${project.id}`,
    });
  }
  if (event.executionId) {
    references.push({
      key: `execution-${event.executionId}`,
      label: event.executionId,
      href: `/executions/${event.executionId}`,
    });
  }
  if (event.reviewId) {
    references.push({
      key: `review-${event.reviewId}`,
      label: event.reviewId,
      href: `/reviews/${event.reviewId}`,
    });
  }

  if (!references.length) {
    return null;
  }

  return (
    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
      {references.map((reference) => (
        <Link
          key={reference.key}
          href={reference.href}
          className="max-w-full break-words text-metadata font-medium text-primary hover:underline"
        >
          {reference.label}
        </Link>
      ))}
    </div>
  );
}

function ActivityFeedSection({
  tasks,
  projects,
}: {
  tasks: ReturnType<typeof useTasks>["tasks"];
  projects: ReturnType<typeof useProjects>["projects"];
}) {
  const { members } = useWorkforceDirectory();
  const [category, setCategory] = useState<MonitoringCategory | "">("");
  const [agentId, setAgentId] = useState("");
  const [severity, setSeverity] = useState<MonitoringSeverity | "">("");
  const [sortDirection, setSortDirection] = useState<"desc" | "asc">("desc");

  const filteredEvents = useMemo(
    () =>
      monitoringEventDemoData
        .filter(
          (event) =>
            (!category || event.category === category) &&
            (!agentId || event.agentId === agentId) &&
            (!severity || event.severity === severity),
        )
        .sort((first, second) => {
          const difference =
            new Date(first.occurredAt).getTime() -
            new Date(second.occurredAt).getTime();
          return difference * (sortDirection === "asc" ? 1 : -1);
        }),
    [agentId, category, severity, sortDirection],
  );

  const hasFilters = Boolean(category || agentId || severity);

  function clearFilters() {
    setCategory("");
    setAgentId("");
    setSeverity("");
  }

  return (
    <Card className="min-w-0">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-card-title font-semibold">
              Workforce activity
            </h2>
            <p className="text-metadata text-muted-foreground">
              Central chronological feed · demonstration events
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setSortDirection((current) =>
                current === "desc" ? "asc" : "desc",
              )
            }
          >
            <ArrowUpDown aria-hidden="true" />
            {sortDirection === "desc" ? "Newest first" : "Oldest first"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 border-t border-border pt-4">
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-[repeat(3,minmax(9rem,1fr))_auto] xl:items-end">
          <FilterSelect
            id="monitoring-event-category"
            label="Category"
            value={category}
            onChange={(value) =>
              setCategory(value as MonitoringCategory | "")
            }
            options={monitoringCategories.map(
              (value) =>
                [value, monitoringCategoryLabels[value]] as [string, string],
            )}
            allLabel="All categories"
          />
          <FilterSelect
            id="monitoring-event-agent"
            label="Agent"
            value={agentId}
            onChange={setAgentId}
            options={agentDemoData.map(
              (agent) => [agent.id, agent.name] as [string, string],
            )}
            allLabel="All agents"
          />
          <FilterSelect
            id="monitoring-event-severity"
            label="Severity"
            value={severity}
            onChange={(value) => setSeverity(value as MonitoringSeverity | "")}
            options={monitoringSeverities.map(
              (value) =>
                [value, monitoringSeverityLabels[value]] as [string, string],
            )}
            allLabel="All severities"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearFilters}
            disabled={!hasFilters}
            className="w-full sm:w-fit"
          >
            <FilterX aria-hidden="true" />
            Clear filters
          </Button>
        </div>

        <p aria-live="polite" className="text-metadata text-muted-foreground">
          {filteredEvents.length} of {monitoringEventDemoData.length} events
        </p>

        {filteredEvents.length ? (
          <ol aria-label="Workforce activity timeline" className="space-y-0">
            {filteredEvents.map((event) => (
              <li
                key={event.id}
                className="grid grid-cols-[minmax(0,1fr)] gap-2 border-b border-border py-4 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-4"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge tone="neutral" category="Event type">
                      {monitoringEventTypeLabels[event.type]}
                    </StatusBadge>
                    <SeverityBadge severity={event.severity} />
                    <span className="text-metadata text-muted-foreground">
                      by {actorName(event, members)}
                    </span>
                  </div>
                  <p className="mt-2 break-words text-body">
                    {event.description}
                  </p>
                  <MonitoringEventReferences
                    event={event}
                    tasks={tasks}
                    projects={projects}
                  />
                </div>
                <time
                  dateTime={event.occurredAt}
                  className="shrink-0 text-metadata text-muted-foreground sm:text-right"
                >
                  {formatExecutionTimestamp(event.occurredAt)}
                </time>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState
            title="No activity matches these filters"
            description="Try another event category, agent, or severity."
            icon={FilterX}
            action={
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            }
          />
        )}
      </CardContent>
    </Card>
  );
}

function monitoringAlertReference(
  alert: MonitoringAlert,
  tasks: ReturnType<typeof useTasks>["tasks"],
  reviews: ReturnType<typeof useReviews>["reviews"],
) {
  const reference = alert.reference;
  switch (reference.type) {
    case "agent": {
      const agent = agentDemoData.find(
        (candidate) => candidate.id === reference.agentId,
      );
      return agent
        ? { label: agent.name, href: `/agents/${agent.id}` }
        : { label: "Agent unavailable", href: "/agents" };
    }
    case "task": {
      const task = tasks.find(
        (candidate) => candidate.id === reference.taskId,
      );
      return task
        ? { label: `${task.id} · ${task.title}`, href: `/tasks/${task.id}` }
        : { label: "Task unavailable", href: "/tasks" };
    }
    case "execution": {
      const execution = executionDemoData.find(
        (candidate) => candidate.id === reference.executionId,
      );
      return execution
        ? { label: execution.id, href: `/executions/${execution.id}` }
        : { label: "Execution unavailable", href: "/executions" };
    }
    case "review": {
      const review = reviews.find(
        (candidate) => candidate.id === reference.reviewId,
      );
      return review
        ? {
            label: `${review.id} · ${reviewStatusLabels[review.status]}`,
            href: `/reviews/${review.id}`,
          }
        : { label: "Review unavailable", href: "/reviews" };
    }
  }
}

function AttentionSection({
  alerts,
  tasks,
  reviews,
}: {
  alerts: MonitoringAlert[];
  tasks: ReturnType<typeof useTasks>["tasks"];
  reviews: ReturnType<typeof useReviews>["reviews"];
}) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-warning/15 text-warning-foreground">
            <AlertTriangle className="size-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-card-title font-semibold">
              Operational attention
            </h2>
            <p className="text-metadata text-muted-foreground">
              Derived from the current illustrative agent, task, execution, and
              review records. No alerts are delivered.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="border-t border-border pt-4">
        {alerts.length ? (
          <ul className="divide-y divide-border">
            {alerts.map((alert) => {
              const reference = monitoringAlertReference(
                alert,
                tasks,
                reviews,
              );
              const affectedAgent = alert.agentId
                ? agentDemoData.find(
                    (agent) => agent.id === alert.agentId,
                  )
                : undefined;
              return (
                <li
                  key={alert.id}
                  className="grid min-w-0 gap-2 py-4 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <SeverityBadge severity={alert.severity} />
                      <p className="text-body font-medium">
                        {alert.reason}
                      </p>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-metadata">
                      <Link
                        href={reference.href}
                        className="font-medium text-primary hover:underline"
                      >
                        {reference.label}
                      </Link>
                      {affectedAgent &&
                        alert.reference.type !== "agent" && (
                          <Link
                            href={`/agents/${affectedAgent.id}`}
                            className="text-primary hover:underline"
                          >
                            {affectedAgent.name}
                          </Link>
                        )}
                    </div>
                  </div>
                  <time
                    dateTime={alert.detectedAt}
                    className="shrink-0 text-metadata text-muted-foreground sm:text-right"
                  >
                    Detected {formatExecutionTimestamp(alert.detectedAt)}
                  </time>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            title="No attention items"
            description="The current demonstration data has no outstanding operational attention items."
            icon={CircleCheck}
          />
        )}
      </CardContent>
    </Card>
  );
}

type AgentExecutionCounts = {
  agent: WorkforceAgent;
  total: number;
  completed: number;
  failed: number;
  other: number;
};

function ActivityInsightsSection() {
  const outcomes = useMemo(() => {
    const completed = executionDemoData.filter(
      (execution) => execution.status === "completed",
    ).length;
    const failed = executionDemoData.filter(
      (execution) =>
        execution.status === "failed" || execution.status === "timed-out",
    ).length;
    const active = executionDemoData.filter((execution) =>
      ["queued", "starting", "running", "waiting"].includes(execution.status),
    ).length;
    const cancelled = executionDemoData.filter(
      (execution) => execution.status === "cancelled",
    ).length;

    return { completed, failed, active, cancelled };
  }, []);

  const agentCounts = useMemo<AgentExecutionCounts[]>(() => {
    const countsByAgent = new Map<string, AgentExecutionCounts>();
    for (const agent of agentDemoData) {
      countsByAgent.set(agent.id, {
        agent,
        total: 0,
        completed: 0,
        failed: 0,
        other: 0,
      });
    }

    for (const execution of executionDemoData) {
      const counts = countsByAgent.get(execution.agentId);
      if (!counts) {
        continue;
      }

      counts.total += 1;
      if (execution.status === "completed") {
        counts.completed += 1;
      } else if (
        execution.status === "failed" ||
        execution.status === "timed-out"
      ) {
        counts.failed += 1;
      } else {
        counts.other += 1;
      }
    }

    return [...countsByAgent.values()].sort(
      (first, second) =>
        second.total - first.total ||
        first.agent.name.localeCompare(second.agent.name),
    );
  }, []);

  const repeatedFailures = agentCounts.filter((counts) => counts.failed >= 2);
  const maximumVolume = Math.max(1, ...agentCounts.map((counts) => counts.total));

  return (
    <Card className="min-w-0">
      <CardHeader>
        <div>
          <h2 className="text-card-title font-semibold">Activity insights</h2>
          <p className="text-metadata text-muted-foreground">
            Counts reflect the available execution sample, not a historical
            trend.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 border-t border-border pt-4">
        <section aria-labelledby="outcome-snapshot-heading" className="space-y-3">
          <h3
            id="outcome-snapshot-heading"
            className="text-control font-semibold"
          >
            Recorded execution outcomes
          </h3>
          <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Completed"
              value={String(outcomes.completed)}
              description="Completed records"
              icon={CircleCheck}
            />
            <MetricCard
              title="Failed or timed out"
              value={String(outcomes.failed)}
              description="Error and timeout records"
              icon={CircleX}
            />
            <MetricCard
              title="In progress / queued"
              value={String(outcomes.active)}
              description="Queued, starting, running, or waiting"
              icon={Activity}
            />
            <MetricCard
              title="Cancelled"
              value={String(outcomes.cancelled)}
              description="Kept separate from failures"
              icon={Clock3}
            />
          </div>
          <div className="flex flex-wrap gap-3 text-metadata text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-success" aria-hidden="true" />
              Completed
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-error" aria-hidden="true" />
              Failed / timed out
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-muted-foreground" aria-hidden="true" />
              Other states
            </span>
          </div>
        </section>

        <section aria-labelledby="agent-volume-heading" className="space-y-3">
          <div>
            <h3
              id="agent-volume-heading"
              className="text-control font-semibold"
            >
              Execution volume by agent
            </h3>
            <p className="text-metadata text-muted-foreground">
              Total records per agent, segmented by outcome. Small sample sizes
              are not trend estimates.
            </p>
          </div>
          <div className="space-y-4">
            {agentCounts.map((counts) => {
              const completedWidth =
                (counts.completed / maximumVolume) * 100;
              const failedWidth = (counts.failed / maximumVolume) * 100;
              const otherWidth = (counts.other / maximumVolume) * 100;
              return (
                <div key={counts.agent.id} className="grid min-w-0 gap-2 sm:grid-cols-[minmax(10rem,0.8fr)_minmax(0,2fr)_auto] sm:items-center">
                  <Link
                    href={`/agents/${counts.agent.id}`}
                    className="truncate text-body font-medium text-primary hover:underline"
                  >
                    {counts.agent.name}
                  </Link>
                  <div
                    role="img"
                    aria-label={`${counts.agent.name}: ${counts.completed} completed, ${counts.failed} failed or timed out, ${counts.other} other execution records`}
                    className="flex h-3 min-w-0 overflow-hidden rounded-full bg-muted"
                  >
                    {counts.completed > 0 && (
                      <span
                        className="h-full bg-success"
                        style={{ width: `${completedWidth}%` }}
                      />
                    )}
                    {counts.failed > 0 && (
                      <span
                        className="h-full bg-error"
                        style={{ width: `${failedWidth}%` }}
                      />
                    )}
                    {counts.other > 0 && (
                      <span
                        className="h-full bg-muted-foreground"
                        style={{ width: `${otherWidth}%` }}
                      />
                    )}
                  </div>
                  <p className="text-metadata tabular-nums text-muted-foreground sm:text-right">
                    {counts.total} {counts.total === 1 ? "execution" : "executions"}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="repeated-failures-heading" className="space-y-2">
          <h3
            id="repeated-failures-heading"
            className="text-control font-semibold"
          >
            Agents with repeated failures
          </h3>
          {repeatedFailures.length ? (
            <ul className="space-y-2">
              {repeatedFailures.map(({ agent, failed }) => (
                <li
                  key={agent.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3"
                >
                  <Link
                    href={`/agents/${agent.id}`}
                    className="text-body font-medium text-primary hover:underline"
                  >
                    {agent.name}
                  </Link>
                  <StatusBadge tone="critical" category="Failed executions">
                    {failed}
                  </StatusBadge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-body text-muted-foreground">
              No agent has multiple failed or timed-out executions in this
              sample. This is not a historical reliability trend.
            </p>
          )}
        </section>
      </CardContent>
    </Card>
  );
}

function recentExecutionOutcome(executionId: string) {
  const execution = executionDemoData.find(
    (candidate) => candidate.id === executionId,
  );
  if (!execution) {
    return "Not reported";
  }

  if (execution.status === "failed" || execution.status === "timed-out") {
    return execution.errorSummary ?? executionStatusLabels[execution.status];
  }

  const output = executionObservabilityDemoData[executionId]?.output;
  if (output) {
    return output.summary;
  }

  if (execution.status === "completed") {
    return "Execution completed; output not reported.";
  }

  if (execution.status === "waiting") {
    return "Waiting for further activity.";
  }

  if (execution.status === "queued") {
    return "Awaiting start.";
  }

  if (execution.status === "cancelled") {
    return "Cancelled; no output reported.";
  }

  return "Execution is still in progress.";
}

function RecentExecutionsSection({
  tasks,
  projects,
}: {
  tasks: ReturnType<typeof useTasks>["tasks"];
  projects: ReturnType<typeof useProjects>["projects"];
}) {
  const tasksById = useMemo(
    () => new Map(tasks.map((task) => [task.id, task])),
    [tasks],
  );
  const projectsById = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects],
  );
  const recentExecutions = useMemo(
    () =>
      [...executionDemoData]
        .sort((first, second) => {
          const firstTime = new Date(
            first.lastActivityAt ??
              first.startedAt ??
              first.queuedAt ??
              "",
          ).getTime();
          const secondTime = new Date(
            second.lastActivityAt ??
              second.startedAt ??
              second.queuedAt ??
              "",
          ).getTime();
          return secondTime - firstTime;
        })
        .slice(0, 6),
    [],
  );

  return (
    <Card className="min-w-0">
      <CardHeader>
        <div>
          <h2 className="text-card-title font-semibold">Recent executions</h2>
          <p className="text-metadata text-muted-foreground">
            Latest reported activity in the demonstration registry.
          </p>
        </div>
      </CardHeader>
      <CardContent className="border-t border-border pt-4">
        {recentExecutions.length ? (
          <Table
            aria-label="Recent executions"
            className="min-w-[1120px]"
          >
            <TableHeader>
              <TableRow>
                <TableHead>Execution</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Task</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Outcome</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentExecutions.map((execution) => {
                const agent = agentDemoData.find(
                  (candidate) => candidate.id === execution.agentId,
                );
                const task = tasksById.get(execution.taskId);
                const project = projectsById.get(execution.projectId);
                return (
                  <TableRow key={execution.id}>
                    <TableCell>
                      <Link
                        href={`/executions/${execution.id}`}
                        className="font-mono font-medium text-primary hover:underline"
                      >
                        {execution.id}
                      </Link>
                    </TableCell>
                    <TableCell className="min-w-44">
                      {agent ? (
                        <Link
                          href={`/agents/${agent.id}`}
                          className="text-primary hover:underline"
                        >
                          {agent.name}
                        </Link>
                      ) : (
                        "Agent unavailable"
                      )}
                    </TableCell>
                    <TableCell className="min-w-52">
                      {task ? (
                        <Link
                          href={`/tasks/${task.id}`}
                          className="text-primary hover:underline"
                        >
                          {task.title}
                        </Link>
                      ) : (
                        "Task unavailable"
                      )}
                    </TableCell>
                    <TableCell className="min-w-44">
                      {project ? (
                        <Link
                          href={`/projects/${project.id}`}
                          className="text-primary hover:underline"
                        >
                          {project.name}
                        </Link>
                      ) : (
                        "Project unavailable"
                      )}
                    </TableCell>
                    <TableCell>
                      <ExecutionStatusBadge status={execution.status} />
                    </TableCell>
                    <TableCell className="min-w-48 whitespace-nowrap">
                      {execution.startedAt ? (
                        formatExecutionTimestamp(execution.startedAt)
                      ) : (
                        <span className="text-muted-foreground">
                          Not started
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatExecutionDuration(execution)}
                    </TableCell>
                    <TableCell className="min-w-60">
                      {recentExecutionOutcome(execution.id)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <EmptyState
            title="No execution records"
            description="No illustrative execution sessions are available."
            icon={Activity}
          />
        )}
      </CardContent>
    </Card>
  );
}

function MonitoringDashboard() {
  const { tasks } = useTasks();
  const { projects } = useProjects();
  const { reviews } = useReviews();

  const metrics = useMemo(() => {
    const needsAttention = agentDemoData.filter(agentNeedsAttention).length;
    return {
      totalAgents: agentDemoData.length,
      connected: agentDemoData.filter(
        (agent) => agent.connectivity === "connected",
      ).length,
      disconnected: agentDemoData.filter(
        (agent) => agent.connectivity === "disconnected",
      ).length,
      degraded: agentDemoData.filter(
        (agent) => agent.connectivity === "degraded",
      ).length,
      runningExecutions: executionDemoData.filter(
        (execution) => execution.status === "running",
      ).length,
      needsAttention,
    };
  }, []);

  const alerts = useMemo(
    () =>
      deriveMonitoringAlerts({
        agents: agentDemoData,
        tasks,
        executions: executionDemoData,
        reviews,
        events: monitoringEventDemoData,
      }),
    [reviews, tasks],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workforce monitoring"
        description="Operational visibility into agent health, activity, and execution outcomes."
      />

      <Alert variant="info">
        <CircleAlert aria-hidden="true" />
        <AlertDescription>
          Monitoring activity, attention items, and execution insights are
          illustrative demonstration data. This page does not poll agents,
          deliver alerts, or control customer-managed runtimes.
        </AlertDescription>
      </Alert>

      <section
        aria-label="Workforce overview"
        className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3"
      >
        <MetricCard
          title="Registered agents"
          value={String(metrics.totalAgents)}
          description="Central agent registry"
          icon={Bot}
        />
        <MetricCard
          title="Connected agents"
          value={String(metrics.connected)}
          description="Connectivity dimension"
          icon={CircleCheck}
        />
        <MetricCard
          title="Disconnected agents"
          value={String(metrics.disconnected)}
          description="Connectivity dimension"
          icon={CircleX}
        />
        <MetricCard
          title="Degraded agents"
          value={String(metrics.degraded)}
          description="Connectivity dimension"
          icon={AlertTriangle}
        />
        <MetricCard
          title="Running executions"
          value={String(metrics.runningExecutions)}
          description="Execution registry status"
          icon={Activity}
        />
        <MetricCard
          title="Agents needing attention"
          value={String(metrics.needsAttention)}
          description="Unique agents with reported attention states"
          icon={CircleAlert}
        />
      </section>

      <AttentionSection
        alerts={alerts}
        tasks={tasks}
        reviews={reviews}
      />
      <AgentHealthSection
        tasks={tasks}
        events={monitoringEventDemoData}
      />
      <div className="grid min-w-0 gap-6 xl:grid-cols-2">
        <ActivityFeedSection tasks={tasks} projects={projects} />
        <ActivityInsightsSection />
      </div>
      <RecentExecutionsSection tasks={tasks} projects={projects} />
    </div>
  );
}

export { MonitoringDashboard };
