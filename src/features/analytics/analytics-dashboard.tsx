"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  Bot,
  CalendarDays,
  ChartNoAxesCombined,
  CircleCheck,
  Clock3,
  FilterX,
  Info,
  ListTodo,
  Percent,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { agentDemoData } from "@/features/agents/demo-data";
import { executionDemoData } from "@/features/executions/demo-data";
import { formatExecutionMilliseconds } from "@/features/executions/execution-utils";
import type { ExecutionStatus } from "@/features/executions/types";
import { monitoringEventDemoData } from "@/features/monitoring/demo-data";
import { useProjects } from "@/features/projects/projects-context";
import { useReviews } from "@/features/reviews/reviews-context";
import type { ReviewRecord } from "@/features/reviews/types";
import { useTasks } from "@/features/tasks/tasks-context";
import type { TaskRecord } from "@/features/tasks/types";
import {
  ExecutionDurationChart,
  ExecutionOutcomeTrendChart,
  ExecutionStatusChart,
  ExecutionVolumeChart,
  ProjectWorkloadChart,
  TaskCompletionChart,
  TaskStatusChart,
} from "./analytics-charts";
import { AgentPerformanceTable } from "./analytics-agent-performance";
import { AnalyticsInsights } from "./analytics-insights";
import {
  filterExecutions,
  filterTaskCompletionEvents,
  formatAnalyticsDate,
  getAgentActivityIds,
  getAgentPerformanceRows,
  getAnalyticsDateRange,
  getAnalyticsInsights,
  getAnalyticsSampleWindow,
  getExecutionStats,
  getExecutionStatusDistribution,
  getExecutionStatusFilterOptions,
  getExecutionTimeSeries,
  getPreviousDateRange,
  getProjectWorkloads,
  getRelevantAgents,
  getTaskCompletionEvents,
  getTaskCompletionTimeSeries,
  getTaskStatusDistribution,
  isWithinRange,
  taskMatchesScope,
} from "./analytics-utils";
import type {
  AnalyticsFilters,
  AnalyticsPeriod,
} from "./types";

const periodOptions: { value: AnalyticsPeriod; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "custom", label: "Custom demo range" },
];

function MetricCard({
  title,
  value,
  detail,
  icon: Icon,
}: {
  title: string;
  value: string;
  detail: string;
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
        <p className="mt-2 break-words text-metadata text-muted-foreground">
          {detail}
        </p>
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
  options: { value: string; label: string }[];
  allLabel?: string;
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
        {allLabel && <option value="">{allLabel}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function getCountComparison(
  current: number,
  previous: number,
  hasPreviousSample: boolean,
) {
  if (!hasPreviousSample) {
    return "Previous-period baseline unavailable in this sample";
  }
  const difference = current - previous;
  return difference === 0
    ? "No change vs. previous sample"
    : `${difference > 0 ? "+" : ""}${difference} vs. previous sample`;
}

function getRateComparison(current?: number, previous?: number) {
  if (current === undefined || previous === undefined) {
    return "Previous-period baseline unavailable in this sample";
  }
  const difference = current - previous;
  return `${difference > 0 ? "+" : ""}${difference.toFixed(0)} percentage points vs. previous sample`;
}

function getDurationComparison(current?: number, previous?: number) {
  if (current === undefined || previous === undefined) {
    return "Previous-period baseline unavailable in this sample";
  }
  const difference = current - previous;
  const sign = difference > 0 ? "+" : difference < 0 ? "-" : "";
  return `${sign}${formatExecutionMilliseconds(
    Math.abs(difference) * 1000,
  )} vs. previous sample`;
}

function SmallStat({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="min-w-0 rounded-md border border-border bg-surface p-3">
      <p className="text-metadata text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-metadata text-muted-foreground">{description}</p>
    </div>
  );
}

function OverdueTasksList({ tasks }: { tasks: TaskRecord[] }) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-control font-semibold">Overdue open tasks</h3>
        <p className="text-metadata text-muted-foreground">
          Compared with due dates as of the latest sample snapshot.
        </p>
      </div>
      {tasks.length ? (
        <ul className="divide-y divide-border rounded-md border border-border">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="flex min-w-0 flex-wrap items-center justify-between gap-2 p-3"
            >
              <Link
                href={`/tasks/${task.id}`}
                className="min-w-0 text-body font-medium text-primary hover:underline"
              >
                <span className="mr-2 font-mono text-metadata">{task.id}</span>
                {task.title}
              </Link>
              <span className="text-metadata text-muted-foreground">
                Due {task.dueDate}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-body text-muted-foreground">
          No overdue open task has a due date before the sample snapshot date.
        </p>
      )}
    </section>
  );
}

function TaskProductivitySection({
  tasks,
  completionEvents,
  completionSeries,
  taskStatusDistribution,
  projectWorkloads,
  activeReviews,
  overdueTasks,
  sampleDate,
  cohortCompletionRate,
  cohortCompletedCount,
  cohortTaskCount,
}: {
  tasks: TaskRecord[];
  completionEvents: ReturnType<typeof getTaskCompletionEvents>;
  completionSeries: ReturnType<typeof getTaskCompletionTimeSeries>;
  taskStatusDistribution: ReturnType<typeof getTaskStatusDistribution>;
  projectWorkloads: ReturnType<typeof getProjectWorkloads>;
  activeReviews: ReviewRecord[];
  overdueTasks: TaskRecord[];
  sampleDate: string | undefined;
  cohortCompletionRate?: number;
  cohortCompletedCount: number;
  cohortTaskCount: number;
}) {
  const openTasks = tasks.filter(
    (task) => task.status !== "completed" && task.status !== "cancelled",
  ).length;
  const completedTasks = tasks.filter(
    (task) => task.status === "completed",
  ).length;
  const cancelledTasks = tasks.filter(
    (task) => task.status === "cancelled",
  ).length;

  return (
    <section aria-labelledby="task-productivity-heading" className="space-y-4">
      <div>
        <h2
          id="task-productivity-heading"
          className="text-section-title font-semibold"
        >
          Task productivity
        </h2>
        <p className="text-body text-muted-foreground">
          Task completion is derived from task history and status, never from
          execution completion. Snapshot workload is independent of the selected
          time period and execution-status filter.
        </p>
      </div>
      <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SmallStat
          label="Open workload"
          value={String(openTasks)}
          description="Current task snapshot"
        />
        <SmallStat
          label="Completed workload"
          value={String(completedTasks)}
          description="Current task snapshot"
        />
        <SmallStat
          label="Cancelled"
          value={String(cancelledTasks)}
          description="Separate from completed"
        />
        <SmallStat
          label="Active reviews"
          value={String(activeReviews.length)}
          description="Awaiting review or in review"
        />
      </div>
      <div className="grid min-w-0 gap-4 xl:grid-cols-2">
        <div className="space-y-4">
          <div className="grid min-w-0 gap-3 sm:grid-cols-3">
            <SmallStat
              label="Cohort completion rate"
              value={
                cohortCompletionRate === undefined
                  ? "Unavailable"
                  : `${cohortCompletionRate.toFixed(0)}%`
              }
              description={
                cohortTaskCount
                  ? `${cohortCompletedCount} of ${cohortTaskCount} tasks created in period are completed now`
                  : "No tasks were created in this period"
              }
            />
            <SmallStat
              label="Completed in period"
              value={String(completionEvents.length)}
              description="Recorded task completion events"
            />
            <SmallStat
              label="Overdue open"
              value={String(overdueTasks.length)}
              description={`As of ${sampleDate ? formatAnalyticsDate(sampleDate, { year: "numeric" }) : "sample date"}`}
            />
          </div>
          <OverdueTasksList tasks={overdueTasks} />
          <TaskCompletionChart data={completionSeries} />
        </div>
        <div className="space-y-4">
          <TaskStatusChart
            data={taskStatusDistribution}
            hasTasks={tasks.length > 0}
          />
          <ProjectWorkloadChart data={projectWorkloads} />
        </div>
      </div>
    </section>
  );
}

function AnalyticsDashboard() {
  const { projects } = useProjects();
  const { tasks } = useTasks();
  const { reviews } = useReviews();

  const [period, setPeriod] = useState<AnalyticsPeriod>("30d");
  const [projectId, setProjectId] = useState("");
  const [agentId, setAgentId] = useState("");
  const [executionStatus, setExecutionStatus] =
    useState<ExecutionStatus | "">("");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const filters = useMemo<AnalyticsFilters>(
    () => ({
      period,
      projectId,
      agentId,
      executionStatus,
      customStartDate,
      customEndDate,
    }),
    [
      agentId,
      customEndDate,
      customStartDate,
      executionStatus,
      period,
      projectId,
    ],
  );

  const sampleWindow = useMemo(
    () =>
      getAnalyticsSampleWindow({
        projects,
        tasks,
        reviews,
        executions: executionDemoData,
        monitoringEvents: monitoringEventDemoData,
      }),
    [projects, reviews, tasks],
  );
  const range = useMemo(
    () =>
      getAnalyticsDateRange(
        period,
        sampleWindow,
        customStartDate,
        customEndDate,
      ),
    [customEndDate, customStartDate, period, sampleWindow],
  );

  const scopedTasks = useMemo(
    () =>
      tasks.filter((task) => taskMatchesScope(task, projectId, agentId)),
    [agentId, projectId, tasks],
  );
  const filteredExecutions = useMemo(
    () =>
      range ? filterExecutions(executionDemoData, filters, range) : [],
    [filters, range],
  );
  const completionEvents = useMemo(
    () => getTaskCompletionEvents(scopedTasks),
    [scopedTasks],
  );
  const completedInRange = useMemo(
    () =>
      range
        ? filterTaskCompletionEvents(
            completionEvents,
            projectId,
            agentId,
            range,
          )
        : [],
    [agentId, completionEvents, projectId, range],
  );
  const executionStats = useMemo(
    () => getExecutionStats(filteredExecutions),
    [filteredExecutions],
  );
  const executionSeries = useMemo(
    () => getExecutionTimeSeries(filteredExecutions),
    [filteredExecutions],
  );
  const executionDistribution = useMemo(
    () =>
      getExecutionStatusDistribution(filteredExecutions).filter(
        (point) => point.count > 0,
      ),
    [filteredExecutions],
  );
  const taskCompletionSeries = useMemo(
    () => getTaskCompletionTimeSeries(completedInRange),
    [completedInRange],
  );
  const taskStatusDistribution = useMemo(
    () => getTaskStatusDistribution(scopedTasks),
    [scopedTasks],
  );
  const projectWorkloads = useMemo(
    () => getProjectWorkloads(projects, scopedTasks, projectId),
    [projectId, projects, scopedTasks],
  );
  const relevantAgents = useMemo(
    () =>
      getRelevantAgents(
        agentDemoData,
        projects,
        scopedTasks,
        filteredExecutions,
        projectId,
        agentId,
      ),
    [agentId, filteredExecutions, projectId, projects, scopedTasks],
  );
  const performanceRows = useMemo(
    () =>
      getAgentPerformanceRows(
        relevantAgents,
        filteredExecutions,
        scopedTasks,
        completedInRange,
      ),
    [completedInRange, filteredExecutions, relevantAgents, scopedTasks],
  );

  const currentTaskIds = useMemo(
    () => new Set(scopedTasks.map((task) => task.id)),
    [scopedTasks],
  );
  const activeReviews = useMemo(
    () =>
      reviews.filter(
        (review) =>
          currentTaskIds.has(review.taskId) &&
          (review.status === "awaiting-review" ||
            review.status === "in-review"),
      ),
    [currentTaskIds, reviews],
  );
  const sampleDate = sampleWindow?.endDate;
  const overdueTasks = useMemo(
    () =>
      scopedTasks.filter(
        (task) =>
          task.dueDate &&
          sampleDate &&
          task.dueDate < sampleDate &&
          task.status !== "completed" &&
          task.status !== "cancelled",
      ),
    [sampleDate, scopedTasks],
  );
  const taskCohort = useMemo(
    () =>
      range
        ? scopedTasks.filter((task) => isWithinRange(task.createdAt, range))
        : [],
    [range, scopedTasks],
  );
  const completedTaskCohort = taskCohort.filter(
    (task) => task.status === "completed",
  ).length;
  const taskCohortCompletionRate = taskCohort.length
    ? (completedTaskCohort / taskCohort.length) * 100
    : undefined;

  const previousRange = range ? getPreviousDateRange(range) : undefined;
  const previousExecutions = useMemo(
    () =>
      previousRange
        ? filterExecutions(executionDemoData, filters, previousRange)
        : [],
    [filters, previousRange],
  );
  const previousStats = useMemo(
    () => getExecutionStats(previousExecutions),
    [previousExecutions],
  );
  const previousCompleted = useMemo(
    () =>
      previousRange
        ? filterTaskCompletionEvents(
            completionEvents,
            projectId,
            agentId,
            previousRange,
          )
        : [],
    [agentId, completionEvents, projectId, previousRange],
  );

  const activityAgentIds = useMemo(
    () =>
      range
        ? getAgentActivityIds(
            agentId,
            filteredExecutions,
            monitoringEventDemoData,
            projectId,
            range,
          )
        : [],
    [agentId, filteredExecutions, projectId, range],
  );
  const relevantAgentIds = useMemo(
    () => new Set(relevantAgents.map((agent) => agent.id)),
    [relevantAgents],
  );
  const activeRelevantAgentCount = activityAgentIds.filter((id) =>
    relevantAgentIds.has(id),
  ).length;
  const insights = useMemo(
    () =>
      getAnalyticsInsights({
        executions: filteredExecutions,
        tasks: scopedTasks,
        reviews: activeReviews,
        agents: relevantAgents,
        projectWorkloads,
        sampleDate: sampleDate ?? "",
      }),
    [
      activeReviews,
      filteredExecutions,
      projectWorkloads,
      relevantAgents,
      sampleDate,
      scopedTasks,
    ],
  );

  function clearFilters() {
    setPeriod("30d");
    setProjectId("");
    setAgentId("");
    setExecutionStatus("");
    setCustomStartDate("");
    setCustomEndDate("");
  }

  function changePeriod(value: string) {
    const nextPeriod = value as AnalyticsPeriod;
    setPeriod(nextPeriod);
    if (nextPeriod === "custom" && sampleWindow) {
      setCustomStartDate(sampleWindow.startDate);
      setCustomEndDate(sampleWindow.endDate);
    }
  }

  const periodHasPreviousExecutions = previousExecutions.length > 0;
  const successValue =
    executionStats.successRate === undefined
      ? "Unavailable"
      : `${executionStats.successRate.toFixed(0)}%`;
  const averageDurationValue =
    executionStats.averageDurationSeconds === undefined
      ? "Unavailable"
      : formatExecutionMilliseconds(
          executionStats.averageDurationSeconds * 1000,
        );
  const activityValue =
    relevantAgents.length > 0
      ? `${activeRelevantAgentCount} / ${relevantAgents.length}`
      : "Unavailable";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workforce analytics"
        description="Understand execution outcomes, task throughput, and operational bottlenecks across the agent workforce."
      />

      <Alert variant="info">
        <Info aria-hidden="true" />
        <AlertDescription>
          All analytics use illustrative demonstration records. Time presets
          are anchored to the latest sample event
          {sampleDate ? ` (${formatAnalyticsDate(sampleDate, { year: "numeric" })} UTC)` : ""};
          they do not represent live telemetry or a complete historical feed.
          Dates without reported records are omitted from trend charts rather
          than assumed to be zero. No predictive recommendations are generated.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <div>
            <h2 className="text-card-title font-semibold">Analytics filters</h2>
            <p className="text-metadata text-muted-foreground">
              Project and agent filters scope both domains. Execution status
              applies to execution analytics; task lifecycle counts stay
              independent.
            </p>
          </div>
        </CardHeader>
        <CardContent className="border-t border-border pt-4">
          <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-[repeat(4,minmax(9rem,1fr))_auto] xl:items-end">
            <FilterSelect
              id="analytics-period"
              label="Time period"
              value={period}
              onChange={changePeriod}
              options={periodOptions}
            />
            <FilterSelect
              id="analytics-project"
              label="Project"
              value={projectId}
              onChange={setProjectId}
              options={projects.map((project) => ({
                value: project.id,
                label: project.name,
              }))}
              allLabel="All projects"
            />
            <FilterSelect
              id="analytics-agent"
              label="Agent"
              value={agentId}
              onChange={setAgentId}
              options={agentDemoData.map((agent) => ({
                value: agent.id,
                label: agent.name,
              }))}
              allLabel="All agents"
            />
            <FilterSelect
              id="analytics-execution-status"
              label="Execution status"
              value={executionStatus}
              onChange={(value) =>
                setExecutionStatus(value as ExecutionStatus | "")
              }
              options={getExecutionStatusFilterOptions()}
              allLabel="All statuses"
            />
            <Button
              type="button"
              variant="outline"
              onClick={clearFilters}
              className="w-full sm:w-fit"
            >
              <FilterX aria-hidden="true" />
              Clear filters
            </Button>
          </div>

          {period === "custom" && (
            <div className="mt-4 grid min-w-0 gap-3 rounded-md border border-border bg-muted/40 p-3 sm:grid-cols-2">
              <div className="min-w-0 space-y-1.5">
                <Label htmlFor="analytics-custom-start">Start date</Label>
                <Input
                  id="analytics-custom-start"
                  type="date"
                  value={customStartDate || sampleWindow?.startDate || ""}
                  min={sampleWindow?.startDate}
                  max={sampleWindow?.endDate}
                  onChange={(event) => setCustomStartDate(event.target.value)}
                />
              </div>
              <div className="min-w-0 space-y-1.5">
                <Label htmlFor="analytics-custom-end">End date</Label>
                <Input
                  id="analytics-custom-end"
                  type="date"
                  value={customEndDate || sampleWindow?.endDate || ""}
                  min={sampleWindow?.startDate}
                  max={sampleWindow?.endDate}
                  onChange={(event) => setCustomEndDate(event.target.value)}
                />
              </div>
            </div>
          )}

          {period === "custom" && !range && (
            <p role="alert" className="mt-3 text-body text-error">
              Choose a valid demo date range with the start on or before the end.
            </p>
          )}
          {range && (
            <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-metadata text-muted-foreground">
              <CalendarDays className="size-3.5" aria-hidden="true" />
              Sample window: {formatAnalyticsDate(range.startDate, { year: "numeric" })}
              {" – "}
              {formatAnalyticsDate(range.endDate, { year: "numeric" })} UTC ·{" "}
              {filteredExecutions.length} execution records ·{" "}
              {completedInRange.length} task completion events
            </p>
          )}
        </CardContent>
      </Card>

      <section
        aria-label="Workforce KPI overview"
        className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3"
      >
        <MetricCard
          title="Total executions"
          value={range ? String(executionStats.total) : "Unavailable"}
          detail={
            range
              ? getCountComparison(
                  executionStats.total,
                  previousExecutions.length,
                  periodHasPreviousExecutions,
                )
              : "Select a valid sample date range"
          }
          icon={Activity}
        />
        <MetricCard
          title="Execution success rate"
          value={range ? successValue : "Unavailable"}
          detail={
            range
              ? `${executionStats.terminalOutcomes} completed, failed, or timed-out outcomes · ${getRateComparison(
                  executionStats.successRate,
                  previousStats.successRate,
                )}`
              : "Select a valid sample date range"
          }
          icon={Percent}
        />
        <MetricCard
          title="Tasks completed"
          value={range ? String(completedInRange.length) : "Unavailable"}
          detail={
            range
              ? getCountComparison(
                  completedInRange.length,
                  previousCompleted.length,
                  previousCompleted.length > 0,
                )
              : "Select a valid sample date range"
          }
          icon={CircleCheck}
        />
        <MetricCard
          title="Task completion rate"
          value={
            range && taskCohortCompletionRate !== undefined
              ? `${taskCohortCompletionRate.toFixed(0)}%`
              : "Unavailable"
          }
          detail={
            range
              ? taskCohort.length
                ? `${completedTaskCohort} of ${taskCohort.length} tasks created in period are completed in the current snapshot`
                : "No tasks created in this sample period"
              : "Select a valid sample date range"
          }
          icon={ListTodo}
        />
        <MetricCard
          title="Average execution duration"
          value={range ? averageDurationValue : "Unavailable"}
          detail={
            range
              ? `${executionStats.durationSamples} ended executions with reported duration · ${getDurationComparison(
                  executionStats.averageDurationSeconds,
                  previousStats.averageDurationSeconds,
                )}`
              : "Select a valid sample date range"
          }
          icon={Clock3}
        />
        <MetricCard
          title="Agent activity coverage"
          value={range ? activityValue : "Unavailable"}
          detail="Agents with a reported execution or monitoring event in this sample; not runtime utilization."
          icon={Bot}
        />
      </section>

      <section aria-labelledby="execution-analytics-heading" className="space-y-4">
        <div>
          <h2
            id="execution-analytics-heading"
            className="text-section-title font-semibold"
          >
            Execution performance
          </h2>
          <p className="text-body text-muted-foreground">
            Execution records are filtered by period, project, agent, and
            execution status. Cancellation is not counted as failure.
          </p>
        </div>
        <div className="grid min-w-0 gap-4 xl:grid-cols-2">
          <ExecutionVolumeChart data={executionSeries} />
          <ExecutionOutcomeTrendChart data={executionSeries} />
          <ExecutionStatusChart
            data={executionDistribution}
            hasRecords={filteredExecutions.length > 0 && Boolean(range)}
          />
          <ExecutionDurationChart data={executionSeries} />
        </div>
      </section>

      <section aria-labelledby="agent-performance-heading" className="space-y-3">
        <div>
          <h2
            id="agent-performance-heading"
            className="text-section-title font-semibold"
          >
            Agent comparison
          </h2>
          <p className="text-body text-muted-foreground">
            Success rates exclude cancelled and non-terminal executions.
            Duration averages include ended records with reported durations
            only. Completed task contribution uses recorded task completion
            events; collaborators may contribute to more than one agent.
          </p>
        </div>
        <Card className="min-w-0">
          <CardContent className="pt-4">
            <AgentPerformanceTable rows={performanceRows} />
          </CardContent>
        </Card>
      </section>

      <TaskProductivitySection
        tasks={scopedTasks}
        completionEvents={completedInRange}
        completionSeries={taskCompletionSeries}
        taskStatusDistribution={taskStatusDistribution}
        projectWorkloads={projectWorkloads}
        activeReviews={activeReviews}
        overdueTasks={overdueTasks}
        sampleDate={sampleDate}
        cohortCompletionRate={taskCohortCompletionRate}
        cohortCompletedCount={completedTaskCohort}
        cohortTaskCount={taskCohort.length}
      />

      <AnalyticsInsights insights={insights} />

      <Card className="border-info/25 bg-info/5">
        <CardContent className="flex items-start gap-3 p-4">
          <ChartNoAxesCombined
            className="mt-0.5 size-4 shrink-0 text-info"
            aria-hidden="true"
          />
          <p className="text-body text-muted-foreground">
            Historical windows are simulated from the dates available in the
            demonstration records. This dashboard does not calculate predictive
            analytics, recommend automated actions, or collect live telemetry.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export { AnalyticsDashboard };
