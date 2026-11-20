"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatExecutionCost } from "@/features/executions/execution-utils";
import { formatTokenCount, formatUsageTimestamp } from "./usage-utils";
import type {
  UsageBreakdownKind,
  UsageBreakdownRow,
  UsageEntityMaps,
  UsageRecord,
} from "./types";

type BreakdownSortKey =
  | "label"
  | "totalTokens"
  | "inputTokens"
  | "outputTokens"
  | "estimatedCost"
  | "requests"
  | "costShare";

type SortState<Key extends string> = {
  key: Key;
  direction: "ascending" | "descending";
};

const breakdownTitles: Record<UsageBreakdownKind, string> = {
  agent: "By agent",
  project: "By project",
  model: "By model/provider",
};

const breakdownDescriptions: Record<UsageBreakdownKind, string> = {
  agent:
    "Token and cost totals include reported execution values only. Cost share is based on available estimates.",
  project:
    "Project totals use canonical project IDs; unknown costs are excluded from the known-estimate share.",
  model:
    "Requests count recorded model-response events. Token components and estimates remain unavailable when not reported.",
};

function SortIcon<Key extends string>({
  state,
  column,
}: {
  state: SortState<Key>;
  column: Key;
}) {
  if (state.key !== column) {
    return <ArrowUpDown className="size-3.5" aria-hidden="true" />;
  }
  return state.direction === "ascending" ? (
    <ArrowUp className="size-3.5" aria-hidden="true" />
  ) : (
    <ArrowDown className="size-3.5" aria-hidden="true" />
  );
}

function metricValue(
  value: number | undefined,
  samples: number,
  records: number,
  formatter: (value: number) => string,
) {
  if (value === undefined) {
    return (
      <span className="text-muted-foreground" title="No value was reported.">
        Not reported
      </span>
    );
  }
  return (
    <span
      className="tabular-nums"
      title={`Reported for ${samples} of ${records} records in this group.`}
    >
      {formatter(value)}
    </span>
  );
}

function getBreakdownSortValue(
  row: UsageBreakdownRow,
  key: BreakdownSortKey,
) {
  return key === "label" ? row.label : row[key];
}

function UsageBreakdownTable({
  kind,
  rows,
}: {
  kind: UsageBreakdownKind;
  rows: UsageBreakdownRow[];
}) {
  const [sort, setSort] = useState<SortState<BreakdownSortKey>>({
    key: "estimatedCost",
    direction: "descending",
  });
  const columns: { key: BreakdownSortKey; label: string }[] =
    kind === "model"
      ? [
          { key: "inputTokens", label: "Input tokens" },
          { key: "outputTokens", label: "Output tokens" },
          { key: "requests", label: "Requests" },
          { key: "estimatedCost", label: "Estimated cost" },
        ]
      : [
          { key: "totalTokens", label: "Total tokens" },
          { key: "estimatedCost", label: "Estimated cost" },
          { key: "requests", label: "Requests" },
          { key: "costShare", label: "Cost share" },
        ];
  const sortedRows = useMemo(
    () =>
      [...rows].sort((first, second) => {
        const firstValue = getBreakdownSortValue(first, sort.key);
        const secondValue = getBreakdownSortValue(second, sort.key);
        if (firstValue === undefined || secondValue === undefined) {
          if (firstValue === secondValue) {
            return first.label.localeCompare(second.label);
          }
          return firstValue === undefined ? 1 : -1;
        }
        const difference =
          typeof firstValue === "string" && typeof secondValue === "string"
            ? firstValue.localeCompare(secondValue)
            : Number(firstValue) - Number(secondValue);
        if (difference) {
          return sort.direction === "ascending" ? difference : -difference;
        }
        return first.label.localeCompare(second.label);
      }),
    [rows, sort],
  );

  function changeSort(key: BreakdownSortKey) {
    setSort((current) => ({
      key,
      direction:
        current.key === key && current.direction === "descending"
          ? "ascending"
          : "descending",
    }));
  }

  return (
    <Card className="min-w-0">
      <CardHeader>
        <div>
          <h3 className="text-card-title font-semibold">
            {breakdownTitles[kind]}
          </h3>
          <p className="text-metadata text-muted-foreground">
            {breakdownDescriptions[kind]}
          </p>
        </div>
      </CardHeader>
      <CardContent className="min-w-0 border-t border-border pt-3">
        {rows.length ? (
          <Table
            aria-label={`${breakdownTitles[kind]} usage breakdown`}
            className="min-w-[700px]"
          >
            <TableHeader>
              <TableRow>
                <TableHead
                  aria-sort={sort.key === "label" ? sort.direction : "none"}
                  className="min-w-48"
                >
                  <button
                    type="button"
                    onClick={() => changeSort("label")}
                    className="inline-flex items-center gap-1.5 whitespace-nowrap text-left hover:text-foreground"
                  >
                    {kind === "agent"
                      ? "Agent"
                      : kind === "project"
                        ? "Project"
                        : "Model/provider"}
                    <SortIcon state={sort} column="label" />
                  </button>
                </TableHead>
                {columns.map((column) => (
                  <TableHead
                    key={column.key}
                    aria-sort={
                      sort.key === column.key ? sort.direction : "none"
                    }
                    className="min-w-32"
                  >
                    <button
                      type="button"
                      onClick={() => changeSort(column.key)}
                      className="inline-flex items-center gap-1.5 whitespace-nowrap text-left hover:text-foreground"
                    >
                      {column.label}
                      <SortIcon state={sort} column={column.key} />
                    </button>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">
                    {row.href ? (
                      <Link
                        href={row.href}
                        className="text-primary hover:underline"
                      >
                        {row.label}
                      </Link>
                    ) : (
                      row.label
                    )}
                  </TableCell>
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      {column.key === "label" ? (
                        row.label
                      ) : column.key === "totalTokens" ? (
                        metricValue(
                          row.totalTokens,
                          row.tokenRecords,
                          row.recordCount,
                          formatTokenCount,
                        )
                      ) : column.key === "inputTokens" ? (
                        metricValue(
                          row.inputTokens,
                          row.inputTokenRecords,
                          row.recordCount,
                          formatTokenCount,
                        )
                      ) : column.key === "outputTokens" ? (
                        metricValue(
                          row.outputTokens,
                          row.outputTokenRecords,
                          row.recordCount,
                          formatTokenCount,
                        )
                      ) : column.key === "estimatedCost" ? (
                        metricValue(
                          row.estimatedCost,
                          row.costRecords,
                          row.recordCount,
                          formatExecutionCost,
                        )
                      ) : column.key === "requests" ? (
                        metricValue(
                          row.requests,
                          row.requestRecords,
                          row.recordCount,
                          formatTokenCount,
                        )
                      ) : row.costShare === undefined ? (
                        <span
                          className="text-muted-foreground"
                          title="No cost estimates are available to calculate a share."
                        >
                          Not reported
                        </span>
                      ) : (
                        `${row.costShare.toFixed(1)}%`
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState
            title="No matching usage records"
            description="Change the usage filters to see available breakdowns."
            className="min-h-36"
          />
        )}
      </CardContent>
    </Card>
  );
}

type RecordSortKey = "occurredAt" | "totalTokens" | "estimatedCost";

function UsageRecordsTable({
  records,
  entities,
}: {
  records: UsageRecord[];
  entities: UsageEntityMaps;
}) {
  const [sort, setSort] = useState<SortState<RecordSortKey>>({
    key: "occurredAt",
    direction: "descending",
  });
  const sortedRecords = useMemo(
    () =>
      [...records].sort((first, second) => {
        const firstValue = first[sort.key];
        const secondValue = second[sort.key];
        if (firstValue === undefined || secondValue === undefined) {
          if (firstValue === secondValue) {
            return first.executionId.localeCompare(second.executionId);
          }
          return firstValue === undefined ? 1 : -1;
        }
        const difference =
          typeof firstValue === "string" && typeof secondValue === "string"
            ? firstValue.localeCompare(secondValue)
            : Number(firstValue) - Number(secondValue);
        if (difference) {
          return sort.direction === "ascending" ? difference : -difference;
        }
        return first.executionId.localeCompare(second.executionId);
      }),
    [records, sort],
  );

  function changeSort(key: RecordSortKey) {
    setSort((current) => ({
      key,
      direction:
        current.key === key && current.direction === "descending"
          ? "ascending"
          : "descending",
    }));
  }

  const sortableColumns: { key: RecordSortKey; label: string }[] = [
    { key: "totalTokens", label: "Total tokens" },
    { key: "estimatedCost", label: "Estimated cost" },
    { key: "occurredAt", label: "Timestamp" },
  ];

  return (
    <Card className="min-w-0">
      <CardHeader>
        <div>
          <h2 className="text-card-title font-semibold">
            Execution-level usage
          </h2>
          <p className="text-metadata text-muted-foreground">
            Rows link to execution details. Token and cost columns preserve
            unavailable values rather than treating them as zero.
          </p>
        </div>
      </CardHeader>
      <CardContent className="min-w-0 border-t border-border pt-3">
        {records.length ? (
          <Table
            aria-label="Execution-level usage records"
            className="min-w-[1450px]"
          >
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-32">Execution</TableHead>
                <TableHead className="min-w-44">Agent</TableHead>
                <TableHead className="min-w-52">Task</TableHead>
                <TableHead className="min-w-48">Project</TableHead>
                <TableHead className="min-w-52">Model/provider</TableHead>
                <TableHead className="min-w-32">Input tokens</TableHead>
                <TableHead className="min-w-32">Output tokens</TableHead>
                {sortableColumns.map((column) => (
                  <TableHead
                    key={column.key}
                    aria-sort={
                      sort.key === column.key ? sort.direction : "none"
                    }
                    className="min-w-36"
                  >
                    <button
                      type="button"
                      onClick={() => changeSort(column.key)}
                      className="inline-flex items-center gap-1.5 whitespace-nowrap text-left hover:text-foreground"
                    >
                      {column.label}
                      <SortIcon state={sort} column={column.key} />
                    </button>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRecords.map((record) => {
                const agent = entities.agents.get(record.agentId);
                const taskTitle = entities.taskTitles.get(record.taskId);
                const project = entities.projects.get(record.projectId);
                return (
                  <TableRow key={record.executionId}>
                    <TableCell>
                      <Link
                        href={`/executions/${record.executionId}`}
                        className="font-mono font-medium text-primary hover:underline"
                      >
                        {record.executionId}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {agent ? (
                        <Link
                          href={`/agents/${agent.id}`}
                          className="text-primary hover:underline"
                        >
                          {agent.name}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">
                          Agent not found
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {taskTitle ? (
                        <Link
                          href={`/tasks/${record.taskId}`}
                          className="text-primary hover:underline"
                        >
                          <span className="mr-1 font-mono text-metadata">
                            {record.taskId}
                          </span>
                          {taskTitle}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">
                          Task not found
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {project ? (
                        <Link
                          href={`/projects/${project.id}`}
                          className="text-primary hover:underline"
                        >
                          {project.name}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">
                          Project not found
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{record.modelLabel}</TableCell>
                    <TableCell className="tabular-nums">
                      {formatTokenCount(record.inputTokens)}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatTokenCount(record.outputTokens)}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatTokenCount(record.totalTokens)}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatExecutionCost(record.estimatedCost)}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatUsageTimestamp(record.occurredAt)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <EmptyState
            title="No matching execution usage"
            description="No execution usage records match the current search and filters."
            className="min-h-36"
          />
        )}
      </CardContent>
    </Card>
  );
}

export { UsageBreakdownTable, UsageRecordsTable };
