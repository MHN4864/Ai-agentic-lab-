import { formatExecutionCost } from "@/features/executions/execution-utils";
import type {
  UsageBreakdownKind,
  UsageBreakdownRow,
  UsageDateRange,
  UsageEntityMaps,
  UsageFilters,
  UsageInsight,
  UsagePeriod,
  UsageRecord,
  UsageSampleWindow,
  UsageSummary,
  UsageTimePoint,
} from "./types";

const dayMilliseconds = 24 * 60 * 60 * 1000;

function parseDateKey(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return undefined;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function getUsageSampleWindow(records: UsageRecord[]): UsageSampleWindow | undefined {
  const timestamps = records
    .map((record) => (record.occurredAt ? new Date(record.occurredAt).getTime() : Number.NaN))
    .filter(Number.isFinite);
  if (!timestamps.length) {
    return undefined;
  }
  return {
    startDate: new Date(Math.min(...timestamps)).toISOString().slice(0, 10),
    endDate: new Date(Math.max(...timestamps)).toISOString().slice(0, 10),
  };
}

function shiftDate(value: string, days: number) {
  const date = parseDateKey(value);
  if (!date) {
    return undefined;
  }
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function getUsageDateRange(
  period: UsagePeriod,
  sampleWindow: UsageSampleWindow | undefined,
  customStartDate: string,
  customEndDate: string,
): UsageDateRange | undefined {
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
    startDate = shiftDate(sampleWindow.endDate, -(days - 1));
    endDate = sampleWindow.endDate;
  }
  const start = startDate ? parseDateKey(startDate) : undefined;
  const end = endDate ? parseDateKey(endDate) : undefined;

  if (!start || !end || start.getTime() > end.getTime()) {
    return undefined;
  }

  const endExclusiveMs = end.getTime() + dayMilliseconds;
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
    startInclusiveMs: start.getTime(),
    endExclusiveMs,
    dayCount: Math.round(
      (endExclusiveMs - start.getTime()) / dayMilliseconds,
    ),
  };
}

function formatUsageDate(value: string) {
  const date = parseDateKey(value);
  return date
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      }).format(date)
    : "Not reported";
}

function formatUsageTimestamp(value?: string) {
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

function formatTokenCount(value?: number) {
  return value === undefined || !Number.isFinite(value)
    ? "Not reported"
    : new Intl.NumberFormat("en-US").format(value);
}

function isWithinRange(value: string | undefined, range: UsageDateRange) {
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

function recordHasUsageType(
  record: UsageRecord,
  usageType: UsageFilters["usageType"],
) {
  switch (usageType) {
    case "all":
      return true;
    case "tokens":
      return (
        record.totalTokens !== undefined ||
        record.inputTokens !== undefined ||
        record.outputTokens !== undefined
      );
    case "estimated-cost":
      return record.estimatedCost !== undefined;
    case "model-requests":
      return record.modelRequests !== undefined;
  }
}

function filterUsageRecords(
  records: UsageRecord[],
  filters: UsageFilters,
  range: UsageDateRange | undefined,
  entities: UsageEntityMaps,
) {
  if (!range) {
    return [];
  }
  const query = filters.query.trim().toLocaleLowerCase();
  return records.filter((record) => {
    if (
      (filters.projectId && record.projectId !== filters.projectId) ||
      (filters.agentId && record.agentId !== filters.agentId) ||
      (filters.modelKey && record.modelKey !== filters.modelKey) ||
      !recordHasUsageType(record, filters.usageType) ||
      !isWithinRange(record.occurredAt, range)
    ) {
      return false;
    }

    if (!query) {
      return true;
    }
    const searchable = [
      record.executionId,
      record.agentId,
      entities.agents.get(record.agentId)?.name,
      record.taskId,
      entities.taskTitles.get(record.taskId),
      record.projectId,
      entities.projects.get(record.projectId)?.name,
      record.modelLabel,
      record.provider,
      record.modelName,
    ]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase();
    return searchable.includes(query);
  });
}

function getUsageSummary(records: UsageRecord[]): UsageSummary {
  const tokenRows = records.filter((record) => record.totalTokens !== undefined);
  const inputRows = records.filter((record) => record.inputTokens !== undefined);
  const outputRows = records.filter((record) => record.outputTokens !== undefined);
  const costRows = records.filter((record) => record.estimatedCost !== undefined);
  const requestRows = records.filter((record) => record.modelRequests !== undefined);
  const sumField = (
    rows: UsageRecord[],
    getValue: (record: UsageRecord) => number | undefined,
  ) => rows.reduce((sum, record) => sum + (getValue(record) ?? 0), 0);
  const totalEstimatedCost = costRows.length
    ? sumField(costRows, (record) => record.estimatedCost)
    : undefined;

  return {
    ...(totalEstimatedCost !== undefined ? { totalEstimatedCost } : {}),
    costRecords: costRows.length,
    ...(tokenRows.length
      ? { totalTokens: sumField(tokenRows, (record) => record.totalTokens) }
      : {}),
    totalTokenRecords: tokenRows.length,
    ...(inputRows.length
      ? { inputTokens: sumField(inputRows, (record) => record.inputTokens) }
      : {}),
    inputTokenRecords: inputRows.length,
    ...(outputRows.length
      ? { outputTokens: sumField(outputRows, (record) => record.outputTokens) }
      : {}),
    outputTokenRecords: outputRows.length,
    ...(requestRows.length
      ? { modelRequests: sumField(requestRows, (record) => record.modelRequests) }
      : {}),
    requestRecords: requestRows.length,
    ...(totalEstimatedCost !== undefined && costRows.length
      ? { averageCostPerExecution: totalEstimatedCost / costRows.length }
      : {}),
  };
}

function getUsageTimeSeries(records: UsageRecord[]): UsageTimePoint[] {
  const byDate = new Map<string, UsageTimePoint>();
  const getPoint = (date: string) => {
    const point = byDate.get(date) ?? { date, label: formatUsageDate(date) };
    byDate.set(date, point);
    return point;
  };

  for (const record of records) {
    if (!record.occurredAt) {
      continue;
    }
    const date = new Date(record.occurredAt);
    if (Number.isNaN(date.getTime())) {
      continue;
    }
    const dateKey = date.toISOString().slice(0, 10);
    if (record.totalTokens !== undefined) {
      const point = getPoint(dateKey);
      point.totalTokens = (point.totalTokens ?? 0) + record.totalTokens;
    }
    if (record.inputTokens !== undefined || record.outputTokens !== undefined) {
      const point = getPoint(dateKey);
      if (record.inputTokens !== undefined) {
        point.inputTokens =
          (point.inputTokens ?? 0) + record.inputTokens;
      }
      if (record.outputTokens !== undefined) {
        point.outputTokens =
          (point.outputTokens ?? 0) + record.outputTokens;
      }
    }
    if (record.estimatedCost !== undefined) {
      const point = getPoint(dateKey);
      point.estimatedCost =
        (point.estimatedCost ?? 0) + record.estimatedCost;
    }
    if (record.modelRequests !== undefined) {
      const point = getPoint(dateKey);
      point.modelRequests =
        (point.modelRequests ?? 0) + record.modelRequests;
    }
  }

  return [...byDate.values()].sort((first, second) =>
    first.date.localeCompare(second.date),
  );
}

function sumAvailable(
  records: UsageRecord[],
  getValue: (record: UsageRecord) => number | undefined,
) {
  const values = records
    .map(getValue)
    .filter((value): value is number => value !== undefined);
  return values.length
    ? { value: values.reduce((sum, value) => sum + value, 0), count: values.length }
    : { value: undefined, count: 0 };
}

function getUsageBreakdownRows(
  records: UsageRecord[],
  kind: UsageBreakdownKind,
  entities: UsageEntityMaps,
): UsageBreakdownRow[] {
  const groups = new Map<string, UsageRecord[]>();
  for (const record of records) {
    const key =
      kind === "agent"
        ? record.agentId
        : kind === "project"
          ? record.projectId
          : record.modelKey;
    groups.set(key, [...(groups.get(key) ?? []), record]);
  }

  const totalCost = sumAvailable(records, (record) => record.estimatedCost).value;
  return [...groups.entries()].map(([id, group]) => {
    const agent = kind === "agent" ? entities.agents.get(id) : undefined;
    const project = kind === "project" ? entities.projects.get(id) : undefined;
    const label =
      kind === "agent"
        ? agent?.name ?? "Agent not found"
        : kind === "project"
          ? project?.name ?? "Project not found"
          : group[0].modelLabel;
    const totalTokens = sumAvailable(group, (record) => record.totalTokens);
    const inputTokens = sumAvailable(group, (record) => record.inputTokens);
    const outputTokens = sumAvailable(group, (record) => record.outputTokens);
    const estimatedCost = sumAvailable(group, (record) => record.estimatedCost);
    const requests = sumAvailable(group, (record) => record.modelRequests);

    return {
      id,
      label,
      ...(agent ? { href: `/agents/${agent.id}` } : {}),
      ...(project ? { href: `/projects/${project.id}` } : {}),
      ...(totalTokens.value !== undefined
        ? { totalTokens: totalTokens.value }
        : {}),
      ...(inputTokens.value !== undefined
        ? { inputTokens: inputTokens.value }
        : {}),
      ...(outputTokens.value !== undefined
        ? { outputTokens: outputTokens.value }
        : {}),
      ...(estimatedCost.value !== undefined
        ? { estimatedCost: estimatedCost.value }
        : {}),
      ...(requests.value !== undefined ? { requests: requests.value } : {}),
      ...(totalCost && totalCost > 0 && estimatedCost.value !== undefined
        ? { costShare: (estimatedCost.value / totalCost) * 100 }
        : {}),
      recordCount: group.length,
      tokenRecords: totalTokens.count,
      inputTokenRecords: inputTokens.count,
      outputTokenRecords: outputTokens.count,
      costRecords: estimatedCost.count,
      requestRecords: requests.count,
    };
  });
}

function getUsageModelOptions(records: UsageRecord[]) {
  return [
    ...new Map(
      records.map((record) => [
        record.modelKey,
        { value: record.modelKey, label: record.modelLabel },
      ]),
    ).values(),
  ].sort((first, second) => first.label.localeCompare(second.label));
}

function getUsageInsights(
  records: UsageRecord[],
  entities: UsageEntityMaps,
): UsageInsight[] {
  const insights: UsageInsight[] = [];
  const agentRows = getUsageBreakdownRows(records, "agent", entities);
  const projectRows = getUsageBreakdownRows(records, "project", entities);
  const modelRows = getUsageBreakdownRows(records, "model", entities);
  const highestAgent = [...agentRows]
    .filter((row) => row.estimatedCost !== undefined)
    .sort(
      (first, second) =>
        (second.estimatedCost ?? 0) - (first.estimatedCost ?? 0),
    )[0];
  const highestProject = [...projectRows]
    .filter((row) => row.estimatedCost !== undefined)
    .sort(
      (first, second) =>
        (second.estimatedCost ?? 0) - (first.estimatedCost ?? 0),
    )[0];
  const mostUsedModel = [...modelRows]
    .filter((row) => row.requests !== undefined && row.requests > 0)
    .sort((first, second) => (second.requests ?? 0) - (first.requests ?? 0))[0];

  insights.push(
    highestAgent
      ? {
          id: "highest-spending-agent",
          title: "Highest estimated cost by agent",
          value: highestAgent.label,
          detail: `${formatExecutionCost(highestAgent.estimatedCost)} across ${highestAgent.costRecords} execution estimate${highestAgent.costRecords === 1 ? "" : "s"}.`,
          tone: "info",
        }
      : {
          id: "highest-spending-agent-unavailable",
          title: "Highest estimated cost by agent",
          value: "Unavailable",
          detail: "No estimated cost is reported in this selection.",
          tone: "info",
        },
  );
  insights.push(
    highestProject
      ? {
          id: "highest-spending-project",
          title: "Highest estimated cost by project",
          value: highestProject.label,
          detail: `${formatExecutionCost(highestProject.estimatedCost)} across ${highestProject.costRecords} execution estimate${highestProject.costRecords === 1 ? "" : "s"}.`,
          tone: "info",
        }
      : {
          id: "highest-spending-project-unavailable",
          title: "Highest estimated cost by project",
          value: "Unavailable",
          detail: "No estimated cost is reported in this selection.",
          tone: "info",
        },
  );
  insights.push(
    mostUsedModel
      ? {
          id: "most-frequent-model",
          title: "Most frequently used model",
          value: mostUsedModel.label,
          detail: `${mostUsedModel.requests} model-response events in ${mostUsedModel.requestRecords} execution timeline${mostUsedModel.requestRecords === 1 ? "" : "s"}.`,
          tone: "info",
        }
      : {
          id: "most-frequent-model-unavailable",
          title: "Most frequently used model",
          value: "Unavailable",
          detail: "No model-response events are available in this selection.",
          tone: "info",
        },
  );

  const ratioRecords = records.filter(
    (record) =>
      record.inputTokens !== undefined && record.outputTokens !== undefined,
  );
  const inputTokens = ratioRecords.reduce(
    (sum, record) => sum + (record.inputTokens ?? 0),
    0,
  );
  const outputTokens = ratioRecords.reduce(
    (sum, record) => sum + (record.outputTokens ?? 0),
    0,
  );
  insights.push(
    ratioRecords.length && outputTokens > 0
      ? {
          id: "input-output-ratio",
          title: "Input/output token ratio",
          value: `${(inputTokens / outputTokens).toFixed(1)}:1`,
          detail: `Input to output tokens across ${ratioRecords.length} executions with both values reported.`,
          tone: "info",
        }
      : {
          id: "input-output-ratio-unavailable",
          title: "Input/output token ratio",
          value: "Unavailable",
          detail: "Both input and output token totals are needed to calculate this ratio.",
          tone: "info",
        },
  );

  insights.push(
    highestAgent?.costShare !== undefined
      ? {
          id: "cost-concentration",
          title: "Estimated cost concentration",
          value: `${highestAgent.costShare.toFixed(0)}%`,
          detail: `${highestAgent.label} share of known sample estimates; not a budget threshold or anomaly.`,
          tone: "info",
        }
      : {
          id: "cost-concentration-unavailable",
          title: "Estimated cost concentration",
          value: "Unavailable",
          detail: "A positive estimated cost total is required to calculate shares.",
          tone: "info",
        },
  );

  const costAndRequestRecords = records.filter(
    (record) =>
      record.estimatedCost !== undefined &&
      record.modelRequests !== undefined &&
      record.modelRequests > 0,
  );
  const costForRequests = costAndRequestRecords.reduce(
    (sum, record) => sum + (record.estimatedCost ?? 0),
    0,
  );
  const requestsForCost = costAndRequestRecords.reduce(
    (sum, record) => sum + (record.modelRequests ?? 0),
    0,
  );
  insights.push(
    requestsForCost
      ? {
          id: "average-cost-per-request",
          title: "Average estimated cost per request",
          value: formatExecutionCost(costForRequests / requestsForCost),
          detail: `From ${requestsForCost} model-response events across ${costAndRequestRecords.length} executions with both cost and request data.`,
          tone: "info",
        }
      : {
          id: "average-cost-per-request-unavailable",
          title: "Average estimated cost per request",
          value: "Unavailable",
          detail: "No execution has both an estimated cost and a reported model-response event.",
          tone: "info",
        },
  );
  return insights;
}

export {
  filterUsageRecords,
  formatTokenCount,
  formatUsageDate,
  formatUsageTimestamp,
  getUsageBreakdownRows,
  getUsageDateRange,
  getUsageInsights,
  getUsageModelOptions,
  getUsageSampleWindow,
  getUsageSummary,
  getUsageTimeSeries,
};
