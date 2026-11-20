import type {
  ExecutionDiagnostics,
  ExecutionEventType,
  ExecutionSpanStatus,
  ExecutionStatus,
  ExecutionTriggerType,
} from "./types";

export const executionStatusLabels: Record<ExecutionStatus, string> = {
  queued: "Queued",
  starting: "Starting",
  running: "Running",
  waiting: "Waiting",
  completed: "Completed",
  failed: "Failed",
  cancelled: "Cancelled",
  "timed-out": "Timed Out",
};

export const executionTriggerLabels: Record<ExecutionTriggerType, string> = {
  "task-assignment": "Task assignment",
  manual: "Manual",
  retry: "Retry",
  scheduled: "Scheduled",
  webhook: "Webhook",
};

export const executionEventTypeLabels: Record<ExecutionEventType, string> = {
  queued: "Queued",
  started: "Started",
  "agent-initialized": "Agent initialized",
  "task-context-received": "Task context received",
  "tool-invocation": "Tool invocation",
  "tool-result": "Tool result",
  "model-response": "Model response",
  waiting: "Waiting",
  retry: "Retry",
  "output-generated": "Output generated",
  completed: "Completed",
  failed: "Failed",
  cancelled: "Cancelled",
  "timed-out": "Timed out",
};

export const executionSpanStatusLabels: Record<ExecutionSpanStatus, string> = {
  completed: "Completed",
  running: "Running",
  waiting: "Waiting",
  failed: "Failed",
  cancelled: "Cancelled",
  "timed-out": "Timed out",
  skipped: "Skipped",
};

export const executionDiagnosticCategoryLabels: Record<
  ExecutionDiagnostics["category"],
  string
> = {
  "connector-error": "Connector error",
  timeout: "Timeout",
  "runtime-error": "Runtime error",
};

export const executionStatuses = Object.keys(
  executionStatusLabels,
) as ExecutionStatus[];

export const executionTriggers = Object.keys(
  executionTriggerLabels,
) as ExecutionTriggerType[];
