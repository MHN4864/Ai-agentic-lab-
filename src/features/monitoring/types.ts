import type { AgentAvailability, AgentConnectivity, AgentExecutionState } from "@/features/agents/types";

export type MonitoringSeverity = "info" | "warning" | "critical";

export type MonitoringCategory =
  | "agent"
  | "execution"
  | "task"
  | "review"
  | "configuration";

export type MonitoringEventType =
  | "agent-connected"
  | "agent-disconnected"
  | "agent-degraded"
  | "execution-started"
  | "execution-completed"
  | "execution-failed"
  | "execution-timed-out"
  | "task-assigned"
  | "deliverable-submitted"
  | "review-decision"
  | "agent-configuration-changed";

export type MonitoringActor =
  | { type: "agent"; agentId: string }
  | { type: "human"; memberId: string }
  | { type: "system"; label: string };

export type MonitoringEvent = {
  id: string;
  type: MonitoringEventType;
  category: MonitoringCategory;
  severity: MonitoringSeverity;
  occurredAt: string;
  actor: MonitoringActor;
  description: string;
  agentId?: string;
  taskId?: string;
  projectId?: string;
  executionId?: string;
  reviewId?: string;
};

export type MonitoringEntityReference =
  | { type: "agent"; agentId: string }
  | { type: "task"; taskId: string }
  | { type: "execution"; executionId: string }
  | { type: "review"; reviewId: string };

export type MonitoringAlertKind =
  | "disconnected-assigned-work"
  | "failed-execution"
  | "timed-out-execution"
  | "degraded-agent"
  | "blocked-agent"
  | "awaiting-review"
  | "stale-agent-activity"
  | "repeated-failures";

export type MonitoringAlert = {
  id: string;
  kind: MonitoringAlertKind;
  severity: MonitoringSeverity;
  reason: string;
  detectedAt?: string;
  reference: MonitoringEntityReference;
  agentId?: string;
};

export type AgentOperationalFilters = {
  search: string;
  connectivity: AgentConnectivity | "";
  executionState: AgentExecutionState | "";
  availability: AgentAvailability | "";
};
