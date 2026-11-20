import type { WorkforceAgent } from "@/features/agents/types";
import type { ProjectRecord } from "@/features/projects/types";

export type UsagePeriod = "7d" | "30d" | "90d" | "custom";

export type UsageTypeFilter =
  | "all"
  | "tokens"
  | "estimated-cost"
  | "model-requests";

export type UsageDateRange = {
  startDate: string;
  endDate: string;
  startInclusiveMs: number;
  endExclusiveMs: number;
  dayCount: number;
};

export type UsageSampleWindow = {
  startDate: string;
  endDate: string;
};

export type UsageFilters = {
  period: UsagePeriod;
  projectId: string;
  agentId: string;
  modelKey: string;
  usageType: UsageTypeFilter;
  customStartDate: string;
  customEndDate: string;
  query: string;
};

export type UsageRecord = {
  executionId: string;
  agentId: string;
  taskId: string;
  projectId: string;
  modelKey: string;
  modelLabel: string;
  modelName?: string;
  provider?: string;
  occurredAt?: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  estimatedCost?: number;
  modelRequests?: number;
};

export type UsageSummary = {
  totalEstimatedCost?: number;
  costRecords: number;
  totalTokens?: number;
  totalTokenRecords: number;
  inputTokens?: number;
  inputTokenRecords: number;
  outputTokens?: number;
  outputTokenRecords: number;
  modelRequests?: number;
  requestRecords: number;
  averageCostPerExecution?: number;
};

export type UsageTimePoint = {
  date: string;
  label: string;
  totalTokens?: number;
  inputTokens?: number | null;
  outputTokens?: number | null;
  estimatedCost?: number;
  modelRequests?: number;
};

export type UsageBreakdownRow = {
  id: string;
  label: string;
  href?: string;
  totalTokens?: number;
  inputTokens?: number;
  outputTokens?: number;
  estimatedCost?: number;
  requests?: number;
  costShare?: number;
  recordCount: number;
  tokenRecords: number;
  inputTokenRecords: number;
  outputTokenRecords: number;
  costRecords: number;
  requestRecords: number;
};

export type UsageBreakdownKind = "agent" | "project" | "model";

export type UsageInsight = {
  id: string;
  title: string;
  value: string;
  detail: string;
  tone: "info" | "attention";
};

export type UsageEntityMaps = {
  agents: Map<string, WorkforceAgent>;
  projects: Map<string, ProjectRecord>;
  taskTitles: Map<string, string>;
};
