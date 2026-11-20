"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowUpDown,
  BadgeCheck,
  CircleAlert,
  CircleX,
  FilterX,
  Gauge,
  Search,
  Timer,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { useProjects } from "@/features/projects/projects-context";
import { useTasks } from "@/features/tasks/tasks-context";
import { agentDemoData } from "@/features/agents/demo-data";
import { executionDemoData } from "./demo-data";
import { executionStatusLabels, executionStatuses, executionTriggerLabels, executionTriggers } from "./labels";
import { ExecutionStatusBadge } from "./execution-status-badge";
import {
  executionDurationSeconds,
  executionFilterDate,
  formatExecutionCost,
  formatExecutionDuration,
  formatExecutionTimestamp,
  formatExecutionTokens,
} from "./execution-utils";
import type { ExecutionRecord } from "./types";

type ExecutionSortKey =
  | "id"
  | "agent"
  | "task"
  | "project"
  | "status"
  | "startedAt"
  | "duration"
  | "model"
  | "tokens"
  | "cost";

type SortState = {
  key: ExecutionSortKey;
  direction: "asc" | "desc";
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

function SortableHead({
  label,
  sortKey,
  sort,
  onSort,
}: {
  label: string;
  sortKey: ExecutionSortKey;
  sort: SortState;
  onSort: (key: ExecutionSortKey) => void;
}) {
  const active = sort.key === sortKey;

  return (
    <TableHead
      aria-sort={
        active
          ? sort.direction === "asc"
            ? "ascending"
            : "descending"
          : "none"
      }
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex min-h-8 items-center gap-1.5 rounded-sm text-left outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        {label}
        <ArrowUpDown
          className={`size-3.5 ${active ? "text-primary" : "text-muted-foreground"}`}
          aria-hidden="true"
        />
      </button>
    </TableHead>
  );
}

function executionSortValue(
  execution: ExecutionRecord,
  key: ExecutionSortKey,
  related: {
    agentName: string;
    taskTitle: string;
    projectName: string;
  },
): string | number {
  switch (key) {
    case "id":
      return execution.id;
    case "agent":
      return related.agentName;
    case "task":
      return related.taskTitle;
    case "project":
      return related.projectName;
    case "status":
      return executionStatusLabels[execution.status];
    case "startedAt":
      return execution.startedAt
        ? new Date(execution.startedAt).getTime()
        : Number.NEGATIVE_INFINITY;
    case "duration":
      return executionDurationSeconds(execution) ?? Number.NEGATIVE_INFINITY;
    case "model":
      return execution.model?.name ?? execution.model?.provider ?? "";
    case "tokens":
      return execution.tokenUsage?.totalTokens ?? Number.NEGATIVE_INFINITY;
    case "cost":
      return execution.estimatedCost ?? Number.NEGATIVE_INFINITY;
  }
}

function compareExecutionValues(first: string | number, second: string | number) {
  if (typeof first === "number" && typeof second === "number") {
    return first - second;
  }

  return new Intl.Collator("en", {
    numeric: true,
    sensitivity: "base",
  }).compare(String(first), String(second));
}

function modelLabel(execution: ExecutionRecord) {
  if (!execution.model?.name && !execution.model?.provider) {
    return "Not reported";
  }

  return [execution.model.name, execution.model.provider]
    .filter(Boolean)
    .join(" · ");
}

function ExecutionRegistry() {
  const router = useRouter();
  const { tasks } = useTasks();
  const { projects } = useProjects();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [agentId, setAgentId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [triggerType, setTriggerType] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [throughDate, setThroughDate] = useState("");
  const [sort, setSort] = useState<SortState>({
    key: "startedAt",
    direction: "desc",
  });

  const agentsById = useMemo(
    () => new Map(agentDemoData.map((agent) => [agent.id, agent])),
    [],
  );
  const tasksById = useMemo(
    () => new Map(tasks.map((task) => [task.id, task])),
    [tasks],
  );
  const projectsById = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects],
  );

  const metrics = useMemo(() => {
    const completed = executionDemoData.filter(
      (execution) => execution.status === "completed",
    ).length;
    const failed = executionDemoData.filter(
      (execution) => execution.status === "failed",
    ).length;
    const timedOut = executionDemoData.filter(
      (execution) => execution.status === "timed-out",
    ).length;
    const terminalOutcomes = completed + failed + timedOut;

    return {
      total: executionDemoData.length,
      running: executionDemoData.filter(
        (execution) => execution.status === "running",
      ).length,
      completed,
      failed,
      successRate:
        terminalOutcomes > 0
          ? `${Math.round((completed / terminalOutcomes) * 100)}%`
          : "Not available",
      successRateDescription:
        "Completed / completed, failed, and timed out; cancelled and non-terminal runs excluded",
    };
  }, []);

  const filteredExecutions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    return executionDemoData
      .filter((execution) => {
        const agent = agentsById.get(execution.agentId);
        const task = tasksById.get(execution.taskId);
        const project = projectsById.get(execution.projectId);
        const searchable = [
          execution.id,
          execution.agentId,
          agent?.name,
          execution.taskId,
          task?.title,
          execution.projectId,
          project?.name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase();
        const date = executionFilterDate(execution);

        return (
          (!normalizedQuery || searchable.includes(normalizedQuery)) &&
          (!status || execution.status === status) &&
          (!agentId || execution.agentId === agentId) &&
          (!projectId || execution.projectId === projectId) &&
          (!triggerType || execution.triggerType === triggerType) &&
          (!fromDate || (date !== "" && date >= fromDate)) &&
          (!throughDate || (date !== "" && date <= throughDate))
        );
      })
      .sort((first, second) => {
        const relatedFor = (execution: ExecutionRecord) => ({
          agentName:
            agentsById.get(execution.agentId)?.name ?? "Agent unavailable",
          taskTitle:
            tasksById.get(execution.taskId)?.title ?? "Task unavailable",
          projectName:
            projectsById.get(execution.projectId)?.name ?? "Project unavailable",
        });
        const comparison = compareExecutionValues(
          executionSortValue(first, sort.key, relatedFor(first)),
          executionSortValue(second, sort.key, relatedFor(second)),
        );
        return comparison * (sort.direction === "asc" ? 1 : -1);
      });
  }, [
    agentId,
    agentsById,
    fromDate,
    projectId,
    projectsById,
    query,
    sort,
    status,
    tasksById,
    throughDate,
    triggerType,
  ]);

  const hasFilters = Boolean(
    query || status || agentId || projectId || triggerType || fromDate || throughDate,
  );

  function changeSort(key: ExecutionSortKey) {
    setSort((current) => ({
      key,
      direction:
        current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  }

  function openExecution(executionId: string) {
    router.push(`/executions/${executionId}`);
  }

  function handleRowKeyDown(
    event: KeyboardEvent<HTMLTableRowElement>,
    executionId: string,
  ) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openExecution(executionId);
    }
  }

  function clearFilters() {
    setQuery("");
    setStatus("");
    setAgentId("");
    setProjectId("");
    setTriggerType("");
    setFromDate("");
    setThroughDate("");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Execution registry"
        description="Review execution sessions across connected agents, tasks, and projects."
      />

      <Alert variant="info">
        <CircleAlert aria-hidden="true" />
        <AlertDescription>
          Execution records and telemetry are illustrative demonstration data.
          This registry does not start, control, or monitor live agent runtimes.
          Execution status is independent of task, agent connectivity,
          availability, and review status.
        </AlertDescription>
      </Alert>

      <section
        aria-label="Execution summary"
        className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-5"
      >
        <MetricCard
          title="Total executions"
          value={String(metrics.total)}
          description="Illustrative execution records"
          icon={Activity}
        />
        <MetricCard
          title="Currently running"
          value={String(metrics.running)}
          description="Status is recorded per execution"
          icon={Timer}
        />
        <MetricCard
          title="Completed"
          value={String(metrics.completed)}
          description="Completed execution records"
          icon={BadgeCheck}
        />
        <MetricCard
          title="Failed"
          value={String(metrics.failed)}
          description="Failed execution records"
          icon={CircleX}
        />
        <MetricCard
          title="Success rate"
          value={metrics.successRate}
          description={metrics.successRateDescription}
          icon={Gauge}
        />
      </section>

      <Card className="min-w-0">
        <CardContent className="space-y-4 p-4">
          <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(14rem,1.5fr)_repeat(4,minmax(9rem,1fr))_auto] xl:items-end">
            <div className="min-w-0 space-y-1.5">
              <Label htmlFor="execution-search">Search executions</Label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="execution-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Execution, agent, task, or project"
                  className="pl-9"
                />
              </div>
            </div>
            <FilterSelect
              id="execution-status-filter"
              label="Status"
              value={status}
              onChange={setStatus}
              options={executionStatuses.map(
                (value) => [value, executionStatusLabels[value]] as [string, string],
              )}
              allLabel="All statuses"
            />
            <FilterSelect
              id="execution-agent-filter"
              label="Agent"
              value={agentId}
              onChange={setAgentId}
              options={agentDemoData.map(
                (agent) => [agent.id, agent.name] as [string, string],
              )}
              allLabel="All agents"
            />
            <FilterSelect
              id="execution-project-filter"
              label="Project"
              value={projectId}
              onChange={setProjectId}
              options={projects.map(
                (project) => [project.id, project.name] as [string, string],
              )}
              allLabel="All projects"
            />
            <FilterSelect
              id="execution-trigger-filter"
              label="Trigger type"
              value={triggerType}
              onChange={setTriggerType}
              options={executionTriggers.map(
                (value) =>
                  [value, executionTriggerLabels[value]] as [string, string],
              )}
              allLabel="All trigger types"
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

          <div className="grid min-w-0 gap-3 sm:grid-cols-2 sm:max-w-xl">
            <div className="min-w-0 space-y-1.5">
              <Label htmlFor="execution-from-date">
                Started or queued on or after
              </Label>
              <input
                id="execution-from-date"
                type="date"
                value={fromDate}
                onInput={(event) => setFromDate(event.currentTarget.value)}
                className="h-9 w-full min-w-0 rounded-md border border-input bg-surface px-3 py-1.5 text-control shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
              />
            </div>
            <div className="min-w-0 space-y-1.5">
              <Label htmlFor="execution-through-date">
                Started or queued on or before
              </Label>
              <input
                id="execution-through-date"
                type="date"
                value={throughDate}
                onInput={(event) => setThroughDate(event.currentTarget.value)}
                className="h-9 w-full min-w-0 rounded-md border border-input bg-surface px-3 py-1.5 text-control shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
              />
            </div>
          </div>

          <div
            aria-live="polite"
            className="flex flex-wrap items-center justify-between gap-2"
          >
            <p className="text-metadata text-muted-foreground">
              {filteredExecutions.length} of {executionDemoData.length} execution
              {executionDemoData.length === 1 ? "" : "s"}
            </p>
            <p className="text-metadata text-muted-foreground">
              Sortable by execution, agent, task, project, status, start time,
              duration, model/provider, tokens, and cost.
            </p>
          </div>

          {filteredExecutions.length ? (
            <Table
              aria-label="Execution registry"
              className="min-w-[1400px]"
            >
              <TableHeader>
                <TableRow>
                  <SortableHead label="Execution ID" sortKey="id" sort={sort} onSort={changeSort} />
                  <SortableHead label="Agent" sortKey="agent" sort={sort} onSort={changeSort} />
                  <SortableHead label="Task" sortKey="task" sort={sort} onSort={changeSort} />
                  <SortableHead label="Project" sortKey="project" sort={sort} onSort={changeSort} />
                  <SortableHead label="Status" sortKey="status" sort={sort} onSort={changeSort} />
                  <SortableHead label="Started at" sortKey="startedAt" sort={sort} onSort={changeSort} />
                  <SortableHead label="Duration" sortKey="duration" sort={sort} onSort={changeSort} />
                  <SortableHead label="Model / provider" sortKey="model" sort={sort} onSort={changeSort} />
                  <SortableHead label="Token usage" sortKey="tokens" sort={sort} onSort={changeSort} />
                  <SortableHead label="Estimated cost" sortKey="cost" sort={sort} onSort={changeSort} />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExecutions.map((execution) => {
                  const agent = agentsById.get(execution.agentId);
                  const task = tasksById.get(execution.taskId);
                  const project = projectsById.get(execution.projectId);
                  return (
                    <TableRow
                      key={execution.id}
                      role="link"
                      tabIndex={0}
                      aria-label={`Open execution ${execution.id}`}
                      className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/40"
                      onClick={() => openExecution(execution.id)}
                      onKeyDown={(event) =>
                        handleRowKeyDown(event, execution.id)
                      }
                    >
                      <TableCell className="font-mono font-medium text-primary">
                        {execution.id}
                      </TableCell>
                      <TableCell className="min-w-48">
                        {agent?.name ?? "Agent unavailable"}
                      </TableCell>
                      <TableCell className="min-w-60">
                        <p className="font-medium">
                          {task?.title ?? "Task unavailable"}
                        </p>
                        <p className="mt-1 font-mono text-metadata text-muted-foreground">
                          {execution.taskId}
                        </p>
                      </TableCell>
                      <TableCell className="min-w-52">
                        {project?.name ?? "Project unavailable"}
                      </TableCell>
                      <TableCell>
                        <ExecutionStatusBadge status={execution.status} />
                      </TableCell>
                      <TableCell className="min-w-48 whitespace-nowrap">
                        {execution.startedAt
                          ? formatExecutionTimestamp(execution.startedAt)
                          : <span className="text-muted-foreground">Not started</span>}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatExecutionDuration(execution)}
                      </TableCell>
                      <TableCell className="min-w-48">
                        {modelLabel(execution)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap tabular-nums">
                        {formatExecutionTokens(execution)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap tabular-nums">
                        {formatExecutionCost(execution.estimatedCost)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              title={
                executionDemoData.length
                  ? "No executions match these filters"
                  : "No execution records"
              }
              description={
                executionDemoData.length
                  ? "Try a different search or date range, or clear the selected filters."
                  : "Illustrative execution records will appear here when available."
              }
              icon={executionDemoData.length ? FilterX : CircleAlert}
              action={
                hasFilters ? (
                  <Button variant="outline" onClick={clearFilters}>
                    Clear filters
                  </Button>
                ) : undefined
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export { ExecutionRegistry };
