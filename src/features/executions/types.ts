export type ExecutionStatus =
  | "queued"
  | "starting"
  | "running"
  | "waiting"
  | "completed"
  | "failed"
  | "cancelled"
  | "timed-out";

export type ExecutionTriggerType =
  | "task-assignment"
  | "manual"
  | "retry"
  | "scheduled"
  | "webhook";

export type ExecutionEventType =
  | "queued"
  | "started"
  | "agent-initialized"
  | "task-context-received"
  | "tool-invocation"
  | "tool-result"
  | "model-response"
  | "waiting"
  | "retry"
  | "output-generated"
  | "completed"
  | "failed"
  | "cancelled"
  | "timed-out";

export type ExecutionEventMetadata = Record<
  string,
  string | number | boolean
>;

export type ExecutionEvent = {
  id: string;
  type: ExecutionEventType;
  occurredAt: string;
  description: string;
  durationMs?: number;
  metadata?: ExecutionEventMetadata;
};

export type ExecutionSpanStatus =
  | "completed"
  | "running"
  | "waiting"
  | "failed"
  | "cancelled"
  | "timed-out"
  | "skipped";

export type ExecutionSpan = {
  id: string;
  name: string;
  startOffsetMs: number;
  durationMs?: number;
  status: ExecutionSpanStatus;
  children?: ExecutionSpan[];
};

export type ExecutionMetrics = {
  modelLatencyMs?: number;
  toolExecutionMs?: number;
  retryCount?: number;
  toolCalls?: number;
};

export type ExecutionJsonValue =
  | string
  | number
  | boolean
  | null
  | ExecutionJsonValue[]
  | { [key: string]: ExecutionJsonValue };

export type ExecutionOutput = {
  kind: "text" | "markdown" | "structured";
  summary: string;
  content?: string;
  structuredResult?: ExecutionJsonValue;
  generatedAt?: string;
  metadata?: ExecutionEventMetadata;
};

export type ExecutionDiagnostics = {
  category: "connector-error" | "timeout" | "runtime-error";
  eventId: string;
  retryInfo?: {
    attempt: number;
    maxAttempts?: number;
    retryScheduled: boolean;
    note: string;
  };
  metadata?: ExecutionEventMetadata;
};

export type ExecutionObservability = {
  events: ExecutionEvent[];
  spans?: ExecutionSpan[];
  metrics?: ExecutionMetrics;
  output?: ExecutionOutput;
  diagnostics?: ExecutionDiagnostics;
};

export type ExecutionRecord = {
  id: string;
  agentId: string;
  taskId: string;
  projectId: string;
  reviewId?: string;
  status: ExecutionStatus;
  queuedAt?: string;
  startedAt?: string;
  endedAt?: string;
  durationSeconds?: number;
  triggerType: ExecutionTriggerType;
  model?: {
    name?: string;
    provider?: string;
  };
  tokenUsage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
  estimatedCost?: number;
  lastActivityAt?: string;
  errorSummary?: string;
};
