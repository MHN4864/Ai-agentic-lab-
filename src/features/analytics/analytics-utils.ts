import type { WorkforceAgent } from "@/features/agents/types";
import type { ExecutionRecord, ExecutionStatus } from "@/features/executions/types";
import { executionStatusLabels } from "@/features/executions/labels";
import { executionDurationSeconds } from "@/features/executions/execution-utils";
import type { MonitoringEvent } from "@/features/monitoring/types";
import type { ProjectRecord } from "@/features/projects/types";
import { reviewStatusLabels } from "@/features/reviews/labels";
import type { ReviewRecord } from "@/features/reviews/types";
import { taskStatusLabels } from "@/features/tasks/labels";
import type { TaskAssignee, TaskRecord, TaskStatus } from "@/features/tasks/types";
import type {
  AgentPerformanceRow,
  AnalyticsDateRange,
  AnalyticsFilters,
  AnalyticsInsight,
  AnalyticsPeriod,
  AnalyticsSampleWindow,
  AnalyticsStatusCounts,
  DistributionPoint,
  ExecutionTimePoint,
  ProjectWorkload,
  TaskCompletionEvent,
  TaskCompletionPoint,
  TaskStatusCount,
} from "./types";

const dayMilliseconds = 24 * 60 * 60 * 1000;

const executionStatuses: ExecutionStatus[] = [
  "queued",
  "starting",
  "running",
  "waiting",
  "completed",
  "failed",
  "cancelled",
  "timed-out",
];

const taskStatuses: TaskStatus[] = [
  "backlog",
  "ready",
  "in-progress",
  "waiting",
  "blocked",
  "in-review",
  "completed",
  "cancelled",
];

function dateKeyFromTimestamp(value: string) {
  const timestamp = new Date(value);
  return Number.isNaN(timestamp.getTime())
    ? undefined
    : timestamp.toISOString().slice(0, 10);
}

function parseDateKey(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return undefined;
  }

  const timestamp = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(timestamp.getTime()) ? undefined : timestamp;
}

function shiftDateKey(value: string, days: number) {
  const date = parseDateKey(value);
  if (!date) {
    return undefined;
  }

  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function isWithinRange(value: string | undefined, range: AnalyticsDateRange) {
  if (!value) {
    return false;
  }

  const timestamp = new Date(value).getTime();
  return (
    Number.isFinite(timestamp) &&
    timestamp >= range.startInclusiveMs &&
    timestamp < range.endExclusiveMs
  );
}

function getTimestampRange(
  timestamps: Array<string | undefined>,
): AnalyticsSampleWindow | undefined {
  const validTimestamps = timestamps
    .map((value) => (value ? new Date(value).getTime() : Number.NaN))
    .filter(Number.isFinite);

  if (!validTimestamps.length) {
    return undefined;
  }

  const startDate = new Date(Math.min(...validTimestamps))
    .toISOString()
    .slice(0, 10);
  const endDate = new Date(Math.max(...validTimestamps))
    .toISOString()
    .slice(0, 10);

  return { startDate, endDate };
}

function getAnalyticsSampleWindow({
  projects,
  tasks,
  reviews,
  executions,
  monitoringEvents,
}: {
  projects: ProjectRecord[];
  tasks: TaskRecord[];
  reviews: ReviewRecord[];
  executions: ExecutionRecord[];
  monitoringEvents: MonitoringEvent[];
}) {
  return getTimestampRange([
    ...projects.flatMap((project) =>
      project.activity.map((event) => event.occurredAt),
    ),
    ...tasks.flatMap((task) => [
      task.createdAt,
      task.updatedAt,
      ...task.activity.map((event) => event.occurredAt),
    ]),
    ...reviews.flatMap((review) => [
      review.submittedAt,
      review.updatedAt,
      ...review.history.map((event) => event.occurredAt),
    ]),
    ...executions.flatMap((execution) => [
      execution.queuedAt,
      execution.startedAt,
      execution.endedAt,
      execution.lastActivityAt,
    ]),
    ...monitoringEvents.map((event) => event.occurredAt),
  ]);
}

function getAnalyticsDateRange(
  period: AnalyticsPeriod,
  sampleWindow: AnalyticsSampleWindow | undefined,
  customStartDate: string,
  customEndDate: string,
): AnalyticsDateRange | undefined {
  if (!sampleWindow) {
    return undefined;
  }

  let startDate: string | undefined;
  let endDate: string | undefined;

  if (period === "custom") {
    startDate = customStartDate || sampleWindow.startDate;
    endDate = customEndDate || sampleWindow.endDate;
  } else {
    const days = Number.parseInt(period, 10);
    endDate = sampleWindow.endDate;
    startDate = shiftDateKey(endDate, -(days - 1));
  }

  const start = startDate ? parseDateKey(startDate) : undefined;
  const end = endDate ? parseDateKey(endDate) : undefined;
  if (!start || !end || start.getTime() > end.getTime()) {
    return undefined;
  }

  const endExclusive = new Date(end.getTime() + dayMilliseconds);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
    startInclusiveMs: start.getTime(),
    endExclusiveMs: endExclusive.getTime(),
    dayCount:
      Math.round((endExclusive.getTime() - start.getTime()) / dayMilliseconds),
  };
}

function getPreviousDateRange(range: AnalyticsDateRange) {
  const endDate = shiftDateKey(range.startDate, -1);
  const startDate = endDate
    ? shiftDateKey(endDate, -(range.dayCount - 1))
    : undefined;
  const start = startDate ? parseDateKey(startDate) : undefined;
  const end = endDate ? parseDateKey(endDate) : undefined;

  if (!start || !end) {
    return undefined;
  }

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
    startInclusiveMs: start.getTime(),
    endExclusiveMs: end.getTime() + dayMilliseconds,
    dayCount: range.dayCount,
  } satisfies AnalyticsDateRange;
}

function formatAnalyticsDate(value: string, options?: Intl.DateTimeFormatOptions) {
  const date = parseDateKey(value);
  if (!date) {
    return "Not reported";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
    ...options,
  }).format(date);
}

function executionTimestamp(execution: ExecutionRecord) {
  return execution.startedAt ?? execution.queuedAt;
}

function getAssigneeAgentIds(assignees: Array<TaskAssignee | null | undefined>) {
  return [
    ...new Set(
      assignees.flatMap((assignee) =>
        assignee?.type === "agent" ? [assignee.agentId] : [],
      ),
    ),
  ];
}

function taskAgentIds(task: TaskRecord) {
  return getAssigneeAgentIds([
    task.assignment.primaryAssignee,
    ...task.assignment.collaborators,
  ]);
}

function taskMatchesScope(
  task: TaskRecord,
  projectId: string,
  agentId: string,
) {
  return (
    (!projectId || task.projectId === projectId) &&
    (!agentId || taskAgentIds(task).includes(agentId))
  );
}

function executionMatchesScope(
  execution: ExecutionRecord,
  filters: AnalyticsFilters,
) {
  return (
    (!filters.projectId || execution.projectId === filters.projectId) &&
    (!filters.agentId || execution.agentId === filters.agentId) &&
    (!filters.executionStatus ||
      execution.status === filters.executionStatus)
  );
}

function filterExecutions(
  executions: ExecutionRecord[],
  filters: AnalyticsFilters,
  range: AnalyticsDateRange,
) {
  return executions.filter(
    (execution) =>
      executionMatchesScope(execution, filters) &&
      isWithinRange(executionTimestamp(execution), range),
  );
}

function getTaskCompletionEvents(tasks: TaskRecord[]): TaskCompletionEvent[] {
  return tasks.flatMap((task) => {
    const completionEvent = task.activity
      .filter(
        (event) =>
          event.type === "status" &&
          event.summary.toLocaleLowerCase().includes("completed"),
      )
      .sort(
        (first, second) =>
          new Date(second.occurredAt).getTime() -
          new Date(first.occurredAt).getTime(),
      )[0];

    return completionEvent
      ? [
          {
            taskId: task.id,
            projectId: task.projectId,
            agentIds: taskAgentIds(task),
            completedAt: completionEvent.occurredAt,
          },
        ]
      : [];
  });
}

function filterTaskCompletionEvents(
  events: TaskCompletionEvent[],
  projectId: string,
  agentId: string,
  range: AnalyticsDateRange,
) {
  return events.filter(
    (event) =>
      (!projectId || event.projectId === projectId) &&
      (!agentId || event.agentIds.includes(agentId)) &&
      isWithinRange(event.completedAt, range),
  );
}

function getTerminalDurationStats(executions: ExecutionRecord[]) {
  const terminalStatuses: ExecutionStatus[] = [
    "completed",
    "failed",
    "timed-out",
    "cancelled",
  ];
  const durations = executions.flatMap((execution) => {
    if (!terminalStatuses.includes(execution.status)) {
      return [];
    }

    const duration = executionDurationSeconds(execution);
    return duration === undefined ? [] : [duration];
  });

  return {
    averageDurationSeconds: durations.length
      ? durations.reduce((sum, duration) => sum + duration, 0) /
        durations.length
      : undefined,
    durationSamples: durations.length,
  };
}

function getExecutionStats(executions: ExecutionRecord[]): AnalyticsStatusCounts {
  const completed = executions.filter(
    (execution) => execution.status === "completed",
  ).length;
  const failed = executions.filter(
    (execution) =>
      execution.status === "failed" || execution.status === "timed-out",
  ).length;
  const terminalOutcomes = completed + failed;
  const durationStats = getTerminalDurationStats(executions);

  return {
    total: executions.length,
    completed,
    failed,
    terminalOutcomes,
    successRate: terminalOutcomes
      ? (completed / terminalOutcomes) * 100
      : undefined,
    ...durationStats,
  };
}

function getExecutionTimeSeries(
  executions: ExecutionRecord[],
): ExecutionTimePoint[] {
  const byDate = new Map<
    string,
    {
      total: number;
      completed: number;
      failed: number;
      durationTotalMinutes: number;
      durationCount: number;
    }
  >();

  for (const execution of executions) {
    const date = executionTimestamp(execution);
    const dateKey = date ? dateKeyFromTimestamp(date) : undefined;
    if (!dateKey) {
      continue;
    }

    const point = byDate.get(dateKey) ?? {
      total: 0,
      completed: 0,
      failed: 0,
      durationTotalMinutes: 0,
      durationCount: 0,
    };
    point.total += 1;
    if (execution.status === "completed") {
      point.completed += 1;
    } else if (
      execution.status === "failed" ||
      execution.status === "timed-out"
    ) {
      point.failed += 1;
    }

    if (
      ["completed", "failed", "timed-out", "cancelled"].includes(
        execution.status,
      )
    ) {
      const duration = executionDurationSeconds(execution);
      if (duration !== undefined) {
        point.durationTotalMinutes += duration / 60;
        point.durationCount += 1;
      }
    }
    byDate.set(dateKey, point);
  }

  return [...byDate.entries()]
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([date, point]) => ({
      date,
      label: formatAnalyticsDate(date),
      total: point.total,
      completed: point.completed,
      failed: point.failed,
      ...(point.durationCount
        ? {
            averageDurationMinutes:
              point.durationTotalMinutes / point.durationCount,
          }
        : {}),
    }));
}

function getTaskCompletionTimeSeries(
  events: TaskCompletionEvent[],
): TaskCompletionPoint[] {
  const byDate = new Map<string, number>();
  for (const event of events) {
    const date = dateKeyFromTimestamp(event.completedAt);
    if (date) {
      byDate.set(date, (byDate.get(date) ?? 0) + 1);
    }
  }

  return [...byDate.entries()]
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([date, completed]) => ({
      date,
      label: formatAnalyticsDate(date),
      completed,
    }));
}

function getExecutionStatusDistribution(
  executions: ExecutionRecord[],
): DistributionPoint[] {
  return executionStatuses.map((status) => ({
    status,
    label: executionStatusLabels[status],
    count: executions.filter((execution) => execution.status === status).length,
  }));
}

function getTaskStatusDistribution(tasks: TaskRecord[]): TaskStatusCount[] {
  return taskStatuses.map((status) => ({
    status,
    count: tasks.filter((task) => task.status === status).length,
  }));
}

function getRelevantAgents(
  agents: WorkforceAgent[],
  projects: ProjectRecord[],
  tasks: TaskRecord[],
  executions: ExecutionRecord[],
  projectId: string,
  agentId: string,
) {
  if (agentId) {
    return agents.filter((agent) => agent.id === agentId);
  }
  if (!projectId) {
    return agents;
  }

  const agentIds = new Set(
    projects.find((project) => project.id === projectId)?.agentIds ?? [],
  );
  for (const task of tasks) {
    if (task.projectId === projectId) {
      taskAgentIds(task).forEach((id) => agentIds.add(id));
    }
  }
  for (const execution of executions) {
    if (execution.projectId === projectId) {
      agentIds.add(execution.agentId);
    }
  }

  return agents.filter((agent) => agentIds.has(agent.id));
}

function getAgentPerformanceRows(
  agents: WorkforceAgent[],
  executions: ExecutionRecord[],
  tasks: TaskRecord[],
  completedTaskEvents: TaskCompletionEvent[],
): AgentPerformanceRow[] {
  return agents.map((agent) => {
    const agentExecutions = executions.filter(
      (execution) => execution.agentId === agent.id,
    );
    const successfulExecutions = agentExecutions.filter(
      (execution) => execution.status === "completed",
    ).length;
    const failedExecutions = agentExecutions.filter(
      (execution) =>
        execution.status === "failed" || execution.status === "timed-out",
    ).length;
    const terminalOutcomes = successfulExecutions + failedExecutions;
    const durationStats = getTerminalDurationStats(agentExecutions);
    const completedTaskIds = new Set(
      completedTaskEvents
        .filter((event) => event.agentIds.includes(agent.id))
        .map((event) => event.taskId),
    );
    const activeDates = new Set(
      agentExecutions.flatMap((execution) => {
        const timestamp = executionTimestamp(execution);
        const date = timestamp ? dateKeyFromTimestamp(timestamp) : undefined;
        return date ? [date] : [];
      }),
    );

    return {
      agent,
      executions: agentExecutions.length,
      successfulExecutions,
      failedExecutions,
      successRate: terminalOutcomes
        ? (successfulExecutions / terminalOutcomes) * 100
        : undefined,
      ...durationStats,
      completedTasks: tasks.filter(
        (task) =>
          completedTaskIds.has(task.id) &&
          taskAgentIds(task).includes(agent.id),
      ).length,
      activeDates: activeDates.size,
    };
  });
}

function getProjectWorkloads(
  projects: ProjectRecord[],
  tasks: TaskRecord[],
  projectId: string,
): ProjectWorkload[] {
  return projects
    .filter((project) => !projectId || project.id === projectId)
    .map((project) => {
      const projectTasks = tasks.filter(
        (task) => task.projectId === project.id,
      );
      return {
        project,
        total: projectTasks.length,
        open: projectTasks.filter(
          (task) =>
            task.status !== "completed" && task.status !== "cancelled",
        ).length,
        completed: projectTasks.filter(
          (task) => task.status === "completed",
        ).length,
        cancelled: projectTasks.filter(
          (task) => task.status === "cancelled",
        ).length,
      };
    })
    .sort(
      (first, second) =>
        second.open - first.open ||
        second.total - first.total ||
        first.project.name.localeCompare(second.project.name),
    );
}

function getAgentActivityIds(
  agentId: string,
  executions: ExecutionRecord[],
  monitoringEvents: MonitoringEvent[],
  projectId: string,
  range: AnalyticsDateRange,
) {
  const executionAgentIds = executions
    .filter(
      (execution) =>
        (!projectId || execution.projectId === projectId) &&
        isWithinRange(executionTimestamp(execution), range),
    )
    .map((execution) => execution.agentId);
  const eventAgentIds = monitoringEvents
    .flatMap(
      (event) =>
        event.agentId &&
        (!projectId || event.projectId === projectId) &&
        isWithinRange(event.occurredAt, range)
          ? [event.agentId]
          : [],
    )
  const activityAgentIds = new Set([...executionAgentIds, ...eventAgentIds]);

  return agentId
    ? activityAgentIds.has(agentId)
      ? [agentId]
      : []
    : [...activityAgentIds];
}

function getOpenTaskAssignments(tasks: TaskRecord[]) {
  const counts = new Map<string, number>();
  for (const task of tasks) {
    if (task.status === "completed" || task.status === "cancelled") {
      continue;
    }
    for (const agentId of taskAgentIds(task)) {
      counts.set(agentId, (counts.get(agentId) ?? 0) + 1);
    }
  }
  return counts;
}

function getAnalyticsInsights({
  executions,
  tasks,
  reviews,
  agents,
  projectWorkloads,
  sampleDate,
}: {
  executions: ExecutionRecord[];
  tasks: TaskRecord[];
  reviews: ReviewRecord[];
  agents: WorkforceAgent[];
  projectWorkloads: ProjectWorkload[];
  sampleDate: string;
}): AnalyticsInsight[] {
  const insights: AnalyticsInsight[] = [];
  const failureCounts = new Map<string, number>();
  for (const execution of executions) {
    if (execution.status === "failed" || execution.status === "timed-out") {
      failureCounts.set(
        execution.agentId,
        (failureCounts.get(execution.agentId) ?? 0) + 1,
      );
    }
  }

  const repeatedFailures = [...failureCounts.entries()].filter(
    ([, count]) => count >= 2,
  );
  if (repeatedFailures.length) {
    for (const [agentId, count] of repeatedFailures) {
      const agent = agents.find((candidate) => candidate.id === agentId);
      if (agent) {
        insights.push({
          id: `repeated-failure-${agentId}`,
          title: `${agent.name}: repeated execution failures`,
          description: `${count} failed or timed-out records appear in the selected sample. This is not a long-term reliability rate.`,
          tone: "critical",
          href: `/agents/${agent.id}`,
        });
      }
    }
  } else {
    insights.push({
      id: "no-repeated-failures",
      title: "Repeated failures",
      description: executions.length
        ? "No agent has multiple failed or timed-out executions in this sample. The data is too small to infer a reliability trend."
        : "There are no execution records in this filter selection to assess repeated failures.",
      tone: "info",
    });
  }

  const largestBacklog = projectWorkloads.filter(
    (workload) => workload.open > 0 && workload.open === projectWorkloads[0]?.open,
  );
  if (largestBacklog.length) {
    insights.push({
      id: "largest-project-backlog",
      title: "Largest current project backlogs",
      description: largestBacklog
        .map(
          (workload) =>
            `${workload.project.name}: ${workload.open} open ${
              workload.open === 1 ? "task" : "tasks"
            }`,
        )
        .join(" · "),
      tone: largestBacklog[0].open >= 3 ? "attention" : "info",
      href: `/projects/${largestBacklog[0].project.id}`,
    });
  } else {
    insights.push({
      id: "no-open-backlogs",
      title: "Project backlog",
      description: "No open tasks appear in the selected project scope.",
      tone: "info",
    });
  }

  const waitingOrBlocked = tasks.filter(
    (task) => task.status === "waiting" || task.status === "blocked",
  );
  insights.push(
    waitingOrBlocked.length
      ? {
          id: "waiting-blocked-tasks",
          title: `${waitingOrBlocked.length} task${waitingOrBlocked.length === 1 ? "" : "s"} waiting or blocked`,
          description: waitingOrBlocked
            .slice(0, 3)
            .map((task) => `${task.id} · ${task.title}`)
            .join(" · "),
          tone: waitingOrBlocked.some((task) => task.status === "blocked")
            ? "critical"
            : "attention",
          href: `/tasks/${waitingOrBlocked[0].id}`,
        }
      : {
          id: "no-waiting-blocked-tasks",
          title: "Waiting and blocked tasks",
          description:
            "No tasks in these states appear in the selected current snapshot.",
          tone: "info",
        },
  );

  const activeReviews = reviews.filter((review) => {
    const task = tasks.find((candidate) => candidate.id === review.taskId);
    return (
      task &&
      (review.status === "awaiting-review" || review.status === "in-review")
    );
  });
  const oldestReview = activeReviews.reduce<ReviewRecord | undefined>(
    (oldest, review) =>
      !oldest ||
      new Date(review.submittedAt).getTime() <
        new Date(oldest.submittedAt).getTime()
        ? review
        : oldest,
    undefined,
  );
  if (activeReviews.length && oldestReview) {
    const oldestTask = tasks.find(
      (task) => task.id === oldestReview.taskId,
    );
    const sampleEnd = parseDateKey(sampleDate)?.getTime();
    const submittedAt = new Date(oldestReview.submittedAt).getTime();
    const waitDays =
      sampleEnd !== undefined && Number.isFinite(submittedAt)
        ? Math.max(0, Math.floor((sampleEnd - submittedAt) / dayMilliseconds))
        : undefined;
    insights.push({
      id: "active-review-queue",
      title: `${activeReviews.length} deliverable${activeReviews.length === 1 ? "" : "s"} awaiting a human decision`,
      description: `Oldest active review: ${oldestTask?.title ?? oldestReview.taskId}${
        waitDays === undefined
          ? ""
          : ` · ${waitDays} sample day${waitDays === 1 ? "" : "s"} since submission`
      }.`,
      tone: "attention",
      href: `/reviews/${oldestReview.id}`,
    });
  } else {
    insights.push({
      id: "no-active-review-queue",
      title: "Review queue",
      description:
        "No active review records appear in the selected current snapshot.",
      tone: "info",
      href: "/reviews",
    });
  }

  const durationByAgent = new Map<string, number[]>();
  for (const execution of executions) {
    if (
      !["completed", "failed", "timed-out", "cancelled"].includes(
        execution.status,
      )
    ) {
      continue;
    }
    const duration = executionDurationSeconds(execution);
    if (duration === undefined) {
      continue;
    }
    durationByAgent.set(execution.agentId, [
      ...(durationByAgent.get(execution.agentId) ?? []),
      duration,
    ]);
  }
  const allDurations = [...durationByAgent.values()].flat();
  const overallAverage = allDurations.length
    ? allDurations.reduce((sum, value) => sum + value, 0) /
      allDurations.length
    : undefined;
  const highDurationAgents =
    overallAverage === undefined
      ? []
      : [...durationByAgent.entries()].filter(([agentId, durations]) => {
          const agentAverage =
            durations.reduce((sum, value) => sum + value, 0) /
            durations.length;
          return (
            durations.length >= 2 &&
            agentAverage >= overallAverage * 1.5 &&
            agents.some((agent) => agent.id === agentId)
          );
        });

  if (highDurationAgents.length) {
    for (const [agentId, durations] of highDurationAgents) {
      const agent = agents.find((candidate) => candidate.id === agentId);
      if (!agent) {
        continue;
      }
      const average =
        durations.reduce((sum, value) => sum + value, 0) / durations.length;
      insights.push({
        id: `duration-outlier-${agentId}`,
        title: `${agent.name} has higher observed durations`,
        description: `Average ${Math.round(average / 60)} min across ${durations.length} ended executions, at least 1.5× the filtered sample average. Investigate context before drawing conclusions.`,
        tone: "attention",
        href: `/agents/${agent.id}`,
      });
    }
  } else {
    insights.push({
      id: "insufficient-duration-sample",
      title: "Execution duration outliers",
      description: overallAverage === undefined
        ? "No ended execution has a reported duration in this selection."
        : "No agent has at least two ended executions meeting the 1.5× sample-average threshold. The per-agent duration sample is limited.",
      tone: "info",
    });
  }

  const openAssignments = getOpenTaskAssignments(tasks);
  const assignmentCounts = [...openAssignments.entries()].sort(
    (first, second) => second[1] - first[1],
  );
  const assignmentAverage = assignmentCounts.length
    ? assignmentCounts.reduce((sum, [, count]) => sum + count, 0) /
      assignmentCounts.length
    : 0;
  const mostAssigned = assignmentCounts[0];
  const mostAssignedAgent = mostAssigned
    ? agents.find((agent) => agent.id === mostAssigned[0])
    : undefined;
  if (
    mostAssigned &&
    mostAssignedAgent &&
    assignmentCounts.length > 1 &&
    mostAssigned[1] >= 2 &&
    mostAssigned[1] > assignmentAverage * 1.5
  ) {
    insights.push({
      id: `workload-concentration-${mostAssignedAgent.id}`,
      title: "Open assignments are concentrated",
      description: `${mostAssignedAgent.name} has ${mostAssigned[1]} open agent-assigned tasks versus a filtered mean of ${assignmentAverage.toFixed(1)}. Collaborators can appear in more than one agent's count.`,
      tone: "attention",
      href: `/agents/${mostAssignedAgent.id}`,
    });
  } else {
    insights.push({
      id: "no-clear-workload-imbalance",
      title: "Agent workload balance",
      description: assignmentCounts.length
        ? "No pronounced concentration meets the sample threshold. This compares open agent assignments only; it is not a capacity measure."
        : "No open agent assignments are available in the selected task scope.",
      tone: "info",
    });
  }

  return insights;
}

function getExecutionStatusFilterOptions() {
  return executionStatuses.map((status) => ({
    value: status,
    label: executionStatusLabels[status],
  }));
}

function getTaskStatusFilterOptions() {
  return taskStatuses.map((status) => ({
    value: status,
    label: taskStatusLabels[status],
  }));
}

function getReviewStatusLabel(status: ReviewRecord["status"]) {
  return reviewStatusLabels[status];
}

export {
  dateKeyFromTimestamp,
  executionTimestamp,
  filterExecutions,
  filterTaskCompletionEvents,
  formatAnalyticsDate,
  getAgentActivityIds,
  getAgentPerformanceRows,
  getAnalyticsDateRange,
  getAnalyticsInsights,
  getAnalyticsSampleWindow,
  getAssigneeAgentIds,
  getExecutionStats,
  getExecutionStatusDistribution,
  getExecutionStatusFilterOptions,
  getExecutionTimeSeries,
  getPreviousDateRange,
  getProjectWorkloads,
  getRelevantAgents,
  getReviewStatusLabel,
  getTaskCompletionEvents,
  getTaskCompletionTimeSeries,
  getTaskStatusDistribution,
  getTaskStatusFilterOptions,
  isWithinRange,
  parseDateKey,
  taskAgentIds,
  taskMatchesScope,
};
