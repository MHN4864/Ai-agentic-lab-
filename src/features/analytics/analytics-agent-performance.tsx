"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatExecutionMilliseconds } from "@/features/executions/execution-utils";
import type { AgentPerformanceRow } from "./types";

type SortKey =
  | "executions"
  | "successfulExecutions"
  | "failedExecutions"
  | "successRate"
  | "averageDurationSeconds"
  | "completedTasks"
  | "activeDates";

type SortState = {
  key: SortKey;
  direction: "ascending" | "descending";
};

const columns: { key: SortKey; label: string; className?: string }[] = [
  { key: "executions", label: "Total executions" },
  { key: "successfulExecutions", label: "Successful" },
  { key: "failedExecutions", label: "Failed / timed out" },
  { key: "successRate", label: "Success rate" },
  { key: "averageDurationSeconds", label: "Avg. duration" },
  { key: "completedTasks", label: "Task completion contribution" },
  { key: "activeDates", label: "Activity level" },
];

function sortValue(row: AgentPerformanceRow, key: SortKey) {
  switch (key) {
    case "executions":
      return row.executions;
    case "successfulExecutions":
      return row.successfulExecutions;
    case "failedExecutions":
      return row.failedExecutions;
    case "successRate":
      return row.successRate;
    case "averageDurationSeconds":
      return row.averageDurationSeconds;
    case "completedTasks":
      return row.completedTasks;
    case "activeDates":
      return row.activeDates;
  }
}

function SortIcon({ state, keyValue }: { state: SortState; keyValue: SortKey }) {
  if (state.key !== keyValue) {
    return <ArrowUpDown className="size-3.5" aria-hidden="true" />;
  }
  return state.direction === "ascending" ? (
    <ArrowUp className="size-3.5" aria-hidden="true" />
  ) : (
    <ArrowDown className="size-3.5" aria-hidden="true" />
  );
}

function AgentPerformanceTable({
  rows,
}: {
  rows: AgentPerformanceRow[];
}) {
  const [sort, setSort] = useState<SortState>({
    key: "executions",
    direction: "descending",
  });

  const sortedRows = useMemo(
    () =>
      [...rows].sort((first, second) => {
        const firstValue = sortValue(first, sort.key);
        const secondValue = sortValue(second, sort.key);
        if (firstValue === undefined || secondValue === undefined) {
          if (firstValue === secondValue) {
            return first.agent.name.localeCompare(second.agent.name);
          }
          return firstValue === undefined ? 1 : -1;
        }

        const difference = firstValue - secondValue;
        if (difference) {
          return sort.direction === "ascending" ? difference : -difference;
        }
        return first.agent.name.localeCompare(second.agent.name);
      }),
    [rows, sort],
  );

  function changeSort(key: SortKey) {
    setSort((current) => ({
      key,
      direction:
        current.key === key && current.direction === "descending"
          ? "ascending"
          : "descending",
    }));
  }

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-card-title font-semibold">
          Agent performance comparison
        </h2>
        <p className="text-metadata text-muted-foreground">
          Execution volume is shown alongside outcomes and task contribution;
          it is not a quality score. Activity level counts distinct sample dates
          with executions, not capacity utilization.
        </p>
      </div>
      {rows.length ? (
        <Table
          aria-label="Agent performance comparison"
          className="min-w-[1180px]"
        >
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 z-10 min-w-56 bg-surface">
                Agent
              </TableHead>
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  aria-sort={
                    sort.key === column.key
                      ? sort.direction
                      : "none"
                  }
                  className="min-w-36"
                >
                  <button
                    type="button"
                    onClick={() => changeSort(column.key)}
                    className="inline-flex items-center gap-1.5 whitespace-nowrap text-left hover:text-foreground"
                    aria-label={`Sort by ${column.label}`}
                  >
                    {column.label}
                    <SortIcon state={sort} keyValue={column.key} />
                  </button>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedRows.map((row) => (
              <TableRow key={row.agent.id}>
                <TableCell className="sticky left-0 z-10 min-w-56 bg-surface">
                  <Link
                    href={`/agents/${row.agent.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {row.agent.name}
                  </Link>
                  <p className="mt-1 text-metadata text-muted-foreground">
                    {row.agent.responsibility}
                  </p>
                </TableCell>
                <TableCell className="tabular-nums">{row.executions}</TableCell>
                <TableCell className="tabular-nums">
                  {row.successfulExecutions}
                </TableCell>
                <TableCell className="tabular-nums">
                  {row.failedExecutions}
                </TableCell>
                <TableCell className="tabular-nums">
                  {row.successRate === undefined ? (
                    <span
                      className="text-muted-foreground"
                      title="No completed, failed, or timed-out execution outcomes are available."
                    >
                      Not reported
                    </span>
                  ) : (
                    `${row.successRate.toFixed(0)}%`
                  )}
                </TableCell>
                <TableCell className="tabular-nums">
                  {row.averageDurationSeconds === undefined ? (
                    <span
                      className="text-muted-foreground"
                      title="No ended execution has a reported duration."
                    >
                      Not reported
                    </span>
                  ) : (
                    <span
                      title={`Based on ${row.durationSamples} ended execution${row.durationSamples === 1 ? "" : "s"}`}
                    >
                      {formatExecutionMilliseconds(
                        row.averageDurationSeconds * 1000,
                      )}
                    </span>
                  )}
                </TableCell>
                <TableCell className="tabular-nums">
                  {row.completedTasks}
                  <span className="ml-1 text-metadata text-muted-foreground">
                    assigned / collaborated
                  </span>
                </TableCell>
                <TableCell className="tabular-nums">
                  {row.activeDates
                    ? `${row.activeDates} sample ${row.activeDates === 1 ? "date" : "dates"}`
                    : "No recorded activity"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <EmptyState
          title="No agents in this scope"
          description="Choose a different project or agent to compare the available records."
        />
      )}
    </div>
  );
}

export { AgentPerformanceTable };
