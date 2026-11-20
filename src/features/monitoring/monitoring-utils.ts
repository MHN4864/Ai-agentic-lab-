import type { WorkforceAgent } from "@/features/agents/types";
import type { ExecutionRecord } from "@/features/executions/types";
import type { ReviewRecord } from "@/features/reviews/types";
import type { TaskRecord } from "@/features/tasks/types";
import type {
  MonitoringAlert,
  MonitoringCategory,
  MonitoringEvent,
  MonitoringEventType,
  MonitoringSeverity,
} from "./types";

const monitoringCategoryLabels: Record<MonitoringCategory, string> = {
  agent: "Agent",
  execution: "Execution",
  task: "Task",
  review: "Review",
  configuration: "Configuration",
};

const monitoringEventTypeLabels: Record<MonitoringEventType, string> = {
  "agent-connected": "Agent connected",
  "agent-disconnected": "Agent disconnected",
  "agent-degraded": "Connectivity degraded",
  "execution-started": "Execution started",
  "execution-completed": "Execution completed",
  "execution-failed": "Execution failed",
  "execution-timed-out": "Execution timed out",
  "task-assigned": "Task assigned",
  "deliverable-submitted": "Deliverable submitted",
  "review-decision": "Review activity",
  "agent-configuration-changed": "Agent configuration changed",
};

const monitoringSeverityLabels: Record<MonitoringSeverity, string> = {
  info: "Info",
  warning: "Warning",
  critical: "Critical",
};

const monitoringCategories = Object.keys(
  monitoringCategoryLabels,
) as MonitoringCategory[];

const monitoringSeverities = Object.keys(
  monitoringSeverityLabels,
) as MonitoringSeverity[];

function agentNeedsAttention(agent: WorkforceAgent) {
  return (
    agent.connectivity !== "connected" ||
    agent.executionState === "blocked" ||
    agent.executionState === "failed" ||
    agent.availability === "unavailable"
  );
}

function latestTimestamp(values: Array<string | undefined>) {
  return values.reduce<string | undefined>((latest, value) => {
    if (!value) {
      return latest;
    }

    const timestamp = new Date(value).getTime();
    if (!Number.isFinite(timestamp)) {
      return latest;
    }

    return !latest || timestamp > new Date(latest).getTime() ? value : latest;
  }, undefined);
}

function getAgentLastActivityAt(
  agentId: string,
  events: MonitoringEvent[],
  executions: ExecutionRecord[],
) {
  return latestTimestamp([
    ...events
      .filter((event) => event.agentId === agentId)
      .map((event) => event.occurredAt),
    ...executions
      .filter((execution) => execution.agentId === agentId)
      .map((execution) => execution.lastActivityAt),
  ]);
}

function isTaskAssignedToAgent(task: TaskRecord, agentId: string) {
  const assignees = [
    ...(task.assignment.primaryAssignee
      ? [task.assignment.primaryAssignee]
      : []),
    ...task.assignment.collaborators,
  ];

  return assignees.some(
    (assignee) =>
      assignee.type === "agent" && assignee.agentId === agentId,
  );
}

function getLatestAgentEvent(
  agentId: string,
  events: MonitoringEvent[],
  type: MonitoringEventType,
) {
  return events
    .filter((event) => event.agentId === agentId && event.type === type)
    .sort(
      (first, second) =>
        new Date(second.occurredAt).getTime() -
        new Date(first.occurredAt).getTime(),
    )[0];
}

function deriveMonitoringAlerts({
  agents,
  tasks,
  executions,
  reviews,
  events,
}: {
  agents: WorkforceAgent[];
  tasks: TaskRecord[];
  executions: ExecutionRecord[];
  reviews: ReviewRecord[];
  events: MonitoringEvent[];
}): MonitoringAlert[] {
  const alerts: MonitoringAlert[] = [];

  for (const agent of agents) {
    if (agent.connectivity === "disconnected") {
      const disconnectedEvent = getLatestAgentEvent(
        agent.id,
        events,
        "agent-disconnected",
      );
      const assignedTasks = tasks.filter(
        (task) =>
          task.status !== "completed" &&
          task.status !== "cancelled" &&
          isTaskAssignedToAgent(task, agent.id),
      );

      for (const task of assignedTasks) {
        alerts.push({
          id: `alert-disconnected-${agent.id}-${task.id}`,
          kind: "disconnected-assigned-work",
          severity: "critical",
          reason: `${agent.name} is disconnected while designated on “${task.title}”.`,
          detectedAt:
            disconnectedEvent?.occurredAt ??
            getAgentLastActivityAt(agent.id, events, executions) ??
            task.updatedAt,
          reference: { type: "task", taskId: task.id },
          agentId: agent.id,
        });
      }
    }

    if (agent.connectivity === "degraded") {
      const degradedEvent = getLatestAgentEvent(
        agent.id,
        events,
        "agent-degraded",
      );
      alerts.push({
        id: `alert-degraded-${agent.id}`,
        kind: "degraded-agent",
        severity: "warning",
        reason: `${agent.name} has degraded connectivity; reported signals may be delayed.`,
        detectedAt:
          degradedEvent?.occurredAt ??
          getAgentLastActivityAt(agent.id, events, executions),
        reference: { type: "agent", agentId: agent.id },
        agentId: agent.id,
      });
    }

    if (
      agent.executionState === "blocked" ||
      agent.executionState === "failed"
    ) {
      alerts.push({
        id: `alert-agent-state-${agent.id}`,
        kind: "blocked-agent",
        severity: "critical",
        reason: `${agent.name} reports an execution state of ${agent.executionState}.`,
        detectedAt:
          getAgentLastActivityAt(agent.id, events, executions),
        reference: { type: "agent", agentId: agent.id },
        agentId: agent.id,
      });
    }
  }

  for (const execution of executions) {
    if (execution.status === "failed") {
      alerts.push({
        id: `alert-failed-${execution.id}`,
        kind: "failed-execution",
        severity: "critical",
        reason:
          execution.errorSummary ??
          `Execution ${execution.id} is marked failed in the demonstration data.`,
        detectedAt:
          execution.endedAt ??
          execution.lastActivityAt ??
          execution.startedAt ??
          execution.queuedAt,
        reference: { type: "execution", executionId: execution.id },
        agentId: execution.agentId,
      });
    } else if (execution.status === "timed-out") {
      alerts.push({
        id: `alert-timeout-${execution.id}`,
        kind: "timed-out-execution",
        severity: "warning",
        reason:
          execution.errorSummary ??
          `Execution ${execution.id} exceeded its recorded time window.`,
        detectedAt:
          execution.endedAt ??
          execution.lastActivityAt ??
          execution.startedAt ??
          execution.queuedAt,
        reference: { type: "execution", executionId: execution.id },
        agentId: execution.agentId,
      });
    }
  }

  for (const review of reviews) {
    if (
      review.status === "awaiting-review" ||
      review.status === "in-review"
    ) {
      alerts.push({
        id: `alert-review-${review.id}`,
        kind: "awaiting-review",
        severity: "warning",
        reason: `Task ${review.taskId} has a deliverable in ${review.status === "in-review" ? "human review" : "the review queue"}.`,
        detectedAt: review.updatedAt,
        reference: { type: "review", reviewId: review.id },
      });
    }
  }

  const referenceAt = latestTimestamp([
    ...events.map((event) => event.occurredAt),
    ...executions.map((execution) => execution.lastActivityAt),
  ]);
  if (referenceAt) {
    const referenceTime = new Date(referenceAt).getTime();
    const staleAfterMs = 30 * 60 * 1000;

    for (const agent of agents) {
      const lastActivityAt = getAgentLastActivityAt(
        agent.id,
        events,
        executions,
      );
      if (
        !lastActivityAt ||
        referenceTime - new Date(lastActivityAt).getTime() <= staleAfterMs
      ) {
        continue;
      }

      alerts.push({
        id: `alert-stale-${agent.id}`,
        kind: "stale-agent-activity",
        severity: agent.connectivity === "disconnected" ? "critical" : "warning",
        reason: `No new activity has been reported for ${agent.name} in the illustrative 30-minute sample window.`,
        detectedAt: referenceAt,
        reference: { type: "agent", agentId: agent.id },
        agentId: agent.id,
      });
    }
  }

  const failureCountByAgent = new Map<string, number>();
  for (const execution of executions) {
    if (execution.status !== "failed" && execution.status !== "timed-out") {
      continue;
    }

    failureCountByAgent.set(
      execution.agentId,
      (failureCountByAgent.get(execution.agentId) ?? 0) + 1,
    );
  }

  for (const [agentId, failureCount] of failureCountByAgent) {
    if (failureCount < 2) {
      continue;
    }

    const agent = agents.find((candidate) => candidate.id === agentId);
    if (!agent) {
      continue;
    }

    alerts.push({
      id: `alert-repeated-failures-${agentId}`,
      kind: "repeated-failures",
      severity: "critical",
      reason: `${agent.name} has ${failureCount} failed or timed-out executions in this sample.`,
      detectedAt:
        getAgentLastActivityAt(agentId, events, executions),
      reference: { type: "agent", agentId },
      agentId,
    });
  }

  return alerts.sort(
    (first, second) => {
      const severityDifference =
        severityOrder[second.severity] - severityOrder[first.severity];
      if (severityDifference) {
        return severityDifference;
      }

      const firstTime = first.detectedAt
        ? new Date(first.detectedAt).getTime()
        : Number.NEGATIVE_INFINITY;
      const secondTime = second.detectedAt
        ? new Date(second.detectedAt).getTime()
        : Number.NEGATIVE_INFINITY;
      if (!Number.isFinite(firstTime) || !Number.isFinite(secondTime)) {
        return 0;
      }
      return secondTime - firstTime;
    },
  );
}

const severityOrder: Record<MonitoringSeverity, number> = {
  info: 0,
  warning: 1,
  critical: 2,
};

export {
  agentNeedsAttention,
  deriveMonitoringAlerts,
  getAgentLastActivityAt,
  monitoringCategories,
  monitoringCategoryLabels,
  monitoringEventTypeLabels,
  monitoringSeverities,
  monitoringSeverityLabels,
  severityOrder,
};
