import type { WorkforceAgent } from "@/features/agents/types";
import type { ExecutionRecord, ExecutionStatus } from "@/features/executions/types";
import type { ProjectRecord } from "@/features/projects/types";
import type { TaskRecord, TaskStatus } from "@/features/tasks/types";

export type AnalyticsPeriod = "7d" | "30d" | "90d" | "custom";

export type AnalyticsDateRange = {
  startDate: string;
  endDate: string;
  startInclusiveMs: number;
  endExclusiveMs: number;
  dayCount: number;
};

export type AnalyticsSampleWindow = {
  startDate: string;
  endDate: string;
};

export type AnalyticsFilters = {
  period: AnalyticsPeriod;
  projectId: string;
  agentId: string;
  executionStatus: ExecutionStatus | "";
  customStartDate: string;
  customEndDate: string;
};

export type ExecutionTimePoint = {
  date: string;
  label: string;
  total: number;
  completed: number;
  failed: number;
  averageDurationMinutes?: number;
};

export type TaskCompletionEvent = {
  taskId: string;
  projectId: string;
  agentIds: string[];
  completedAt: string;
};

export type TaskCompletionPoint = {
  date: string;
  label: string;
  completed: number;
};

export type DistributionPoint = {
  status: string;
  label: string;
  count: number;
};

export type AgentPerformanceRow = {
  agent: WorkforceAgent;
  executions: number;
  successfulExecutions: number;
  failedExecutions: number;
  successRate?: number;
  averageDurationSeconds?: number;
  durationSamples: number;
  completedTasks: number;
  activeDates: number;
};

export type ProjectWorkload = {
  project: ProjectRecord;
  total: number;
  open: number;
  completed: number;
  cancelled: number;
};

export type AnalyticsInsight = {
  id: string;
  title: string;
  description: string;
  tone: "info" | "attention" | "critical";
  href?: string;
};

export type AnalyticsData = {
  agents: WorkforceAgent[];
  projects: ProjectRecord[];
  tasks: TaskRecord[];
  executions: ExecutionRecord[];
};

export type AnalyticsStatusCounts = {
  total: number;
  completed: number;
  failed: number;
  terminalOutcomes: number;
  successRate?: number;
  averageDurationSeconds?: number;
  durationSamples: number;
};

export type TaskStatusCount = {
  status: TaskStatus;
  count: number;
};
