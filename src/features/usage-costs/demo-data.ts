import {
  executionDemoData,
  executionObservabilityDemoData,
} from "@/features/executions/demo-data";
import type { UsageRecord } from "./types";

function validNonNegative(value: number | undefined) {
  return value !== undefined && Number.isFinite(value) && value >= 0
    ? value
    : undefined;
}

function toUsageRecord(
  execution: (typeof executionDemoData)[number],
): UsageRecord {
  const usage = execution.tokenUsage;
  const inputTokens = validNonNegative(usage?.inputTokens);
  const outputTokens = validNonNegative(usage?.outputTokens);
  const reportedTotalTokens = validNonNegative(usage?.totalTokens);
  const totalTokens =
    reportedTotalTokens ??
    (inputTokens !== undefined && outputTokens !== undefined
      ? inputTokens + outputTokens
      : undefined);
  const observability = executionObservabilityDemoData[execution.id];
  const modelRequests = observability
    ? observability.events.filter((event) => event.type === "model-response")
        .length
    : undefined;
  const modelName = execution.model?.name;
  const provider = execution.model?.provider;
  const estimatedCost = validNonNegative(execution.estimatedCost);
  const hasModelIdentity = Boolean(modelName || provider);

  return {
    executionId: execution.id,
    agentId: execution.agentId,
    taskId: execution.taskId,
    projectId: execution.projectId,
    modelKey: hasModelIdentity
      ? `${provider ?? "provider-unreported"}::${modelName ?? "model-unreported"}`
      : "model-unreported",
    modelLabel: hasModelIdentity
      ? [provider, modelName].filter(Boolean).join(" · ")
      : "Model/provider not reported",
    ...(modelName ? { modelName } : {}),
    ...(provider ? { provider } : {}),
    ...(execution.startedAt ?? execution.queuedAt
      ? { occurredAt: execution.startedAt ?? execution.queuedAt }
      : {}),
    ...(inputTokens !== undefined ? { inputTokens } : {}),
    ...(outputTokens !== undefined ? { outputTokens } : {}),
    ...(totalTokens !== undefined ? { totalTokens } : {}),
    ...(estimatedCost !== undefined ? { estimatedCost } : {}),
    ...(modelRequests !== undefined ? { modelRequests } : {}),
  };
}

export const usageDemoData: UsageRecord[] =
  executionDemoData.map(toUsageRecord);
