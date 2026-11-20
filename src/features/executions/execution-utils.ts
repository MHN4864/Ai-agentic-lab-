import type { ExecutionRecord } from "./types";

function formatExecutionTimestamp(value?: string) {
  if (!value) {
    return "Not reported";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not reported";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(date);
}

function executionDurationSeconds(execution: ExecutionRecord) {
  if (execution.durationSeconds !== undefined) {
    return Number.isFinite(execution.durationSeconds) &&
      execution.durationSeconds >= 0
      ? execution.durationSeconds
      : undefined;
  }

  if (!execution.startedAt || !execution.endedAt) {
    return undefined;
  }

  const duration =
    (new Date(execution.endedAt).getTime() -
      new Date(execution.startedAt).getTime()) /
    1000;
  return Number.isFinite(duration) && duration >= 0 ? duration : undefined;
}

function formatExecutionMilliseconds(value?: number) {
  if (value === undefined || !Number.isFinite(value) || value < 0) {
    return "Not reported";
  }

  if (value < 1000) {
    return `${Math.round(value)} ms`;
  }

  return formatSeconds(value / 1000);
}

function formatSeconds(seconds: number) {
  if (seconds < 60) {
    return `${Math.floor(seconds)} sec`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0) {
    return `${hours}h ${remainingMinutes}m`;
  }

  return remainingSeconds > 0
    ? `${minutes}m ${remainingSeconds}s`
    : `${minutes}m`;
}

function formatExecutionDuration(execution: ExecutionRecord) {
  const seconds = executionDurationSeconds(execution);
  if (seconds === undefined) {
    return "Not reported";
  }

  return formatSeconds(seconds);
}

function formatTokenCount(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatExecutionTokens(execution: ExecutionRecord) {
  const usage = execution.tokenUsage;
  if (!usage) {
    return "Not reported";
  }

  const total =
    usage.totalTokens ??
    (usage.inputTokens !== undefined && usage.outputTokens !== undefined
      ? usage.inputTokens + usage.outputTokens
      : undefined);

  return total === undefined
    ? "Partial"
    : `${formatTokenCount(total)} tokens`;
}

function formatExecutionCost(value?: number) {
  if (value === undefined || !Number.isFinite(value)) {
    return "Not reported";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value);
}

function executionFilterDate(execution: ExecutionRecord) {
  return (execution.startedAt ?? execution.queuedAt)?.slice(0, 10) ?? "";
}

export {
  executionDurationSeconds,
  executionFilterDate,
  formatExecutionCost,
  formatExecutionDuration,
  formatExecutionMilliseconds,
  formatExecutionTimestamp,
  formatExecutionTokens,
  formatTokenCount,
};
