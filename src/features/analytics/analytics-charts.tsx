"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartNoAxesCombined } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  DistributionPoint,
  ExecutionTimePoint,
  ProjectWorkload,
  TaskCompletionPoint,
  TaskStatusCount,
} from "./types";

type DataRow = Record<string, string | number>;
type DataColumn = {
  key: string;
  label: string;
};

const axisStyle = {
  fill: "var(--muted-foreground)",
  fontSize: 11,
};

const tooltipStyle = {
  backgroundColor: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  color: "var(--foreground)",
};

function ChartDataTable({
  caption,
  rows,
  columns,
}: {
  caption: string;
  rows: DataRow[];
  columns: DataColumn[];
}) {
  return (
    <details className="mt-3 border-t border-border pt-3">
      <summary className="cursor-pointer text-metadata font-medium text-primary">
        View chart data as a table
      </summary>
      <Table className="mt-2 min-w-80">
        <TableCaption>{caption}</TableCaption>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key}>{column.label}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={`${caption}-${index}`}>
              {columns.map((column) => (
                <TableCell key={column.key}>{row[column.key]}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </details>
  );
}

function ChartPanel({
  title,
  description,
  children,
  dataCaption,
  dataRows,
  columns,
  hasData,
  emptyDescription,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  dataCaption: string;
  dataRows: DataRow[];
  columns: DataColumn[];
  hasData: boolean;
  emptyDescription: string;
}) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <div>
          <h2 className="text-card-title font-semibold">{title}</h2>
          <p className="text-metadata text-muted-foreground">{description}</p>
        </div>
      </CardHeader>
      <CardContent className="border-t border-border pt-4">
        {hasData ? (
          <>
            <div className="h-[250px] min-w-0 sm:h-[280px]">
              {children}
            </div>
            <ChartDataTable
              caption={dataCaption}
              rows={dataRows}
              columns={columns}
            />
          </>
        ) : (
          <EmptyState
            title="Not enough sample data"
            description={emptyDescription}
            icon={ChartNoAxesCombined}
            className="min-h-40 px-2 py-6"
          />
        )}
      </CardContent>
    </Card>
  );
}

function ExecutionVolumeChart({
  data,
}: {
  data: ExecutionTimePoint[];
}) {
  const rows = data.map((point) => ({
    date: point.date,
    executions: point.total,
  }));
  return (
    <ChartPanel
      title="Execution volume over time"
      description="Only dates with reported execution records are plotted; unobserved gaps are not represented as zero."
      dataCaption="Execution volume by sample date"
      dataRows={rows}
      columns={[
        { key: "date", label: "Sample date (UTC)" },
        { key: "executions", label: "Executions" },
      ]}
      hasData={data.length > 0}
      emptyDescription="No execution records fall within the selected filters and date range."
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          accessibilityLayer
          margin={{ top: 8, right: 12, bottom: 4, left: -16 }}
        >
          <CartesianGrid
            stroke="var(--border)"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={axisStyle}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
          />
          <YAxis
            allowDecimals={false}
            tick={axisStyle}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar
            dataKey="total"
            name="Executions"
            fill="var(--chart-1)"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}

function ExecutionOutcomeTrendChart({
  data,
}: {
  data: ExecutionTimePoint[];
}) {
  const rows = data.map((point) => ({
    date: point.date,
    completed: point.completed,
    failedOrTimedOut: point.failed,
  }));
  return (
    <ChartPanel
      title="Successful vs. failed outcomes"
      description="Completed runs are success; failed and timed-out runs are failures. Cancelled and non-terminal runs are excluded."
      dataCaption="Execution outcomes by sample date"
      dataRows={rows}
      columns={[
        { key: "date", label: "Sample date (UTC)" },
        { key: "completed", label: "Completed" },
        { key: "failedOrTimedOut", label: "Failed or timed out" },
      ]}
      hasData={data.some((point) => point.completed + point.failed > 0)}
      emptyDescription="No completed, failed, or timed-out execution outcomes are available for this selection."
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          accessibilityLayer
          margin={{ top: 8, right: 12, bottom: 4, left: -16 }}
        >
          <CartesianGrid
            stroke="var(--border)"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={axisStyle}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
          />
          <YAxis
            allowDecimals={false}
            tick={axisStyle}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ color: "var(--muted-foreground)", fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey="completed"
            name="Completed"
            stroke="var(--chart-2)"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="failed"
            name="Failed or timed out"
            stroke="var(--chart-5)"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}

function ExecutionStatusChart({
  data,
  hasRecords,
}: {
  data: DistributionPoint[];
  hasRecords: boolean;
}) {
  const rows = data.map((point) => ({
    status: point.label,
    executions: point.count,
  }));
  return (
    <ChartPanel
      title="Execution status distribution"
      description="Current statuses of execution records in the selected sample."
      dataCaption="Execution counts by status"
      dataRows={rows}
      columns={[
        { key: "status", label: "Status" },
        { key: "executions", label: "Executions" },
      ]}
      hasData={hasRecords}
      emptyDescription="No execution records fall within the selected filters and date range."
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          accessibilityLayer
          margin={{ top: 4, right: 16, bottom: 4, left: 8 }}
        >
          <CartesianGrid
            stroke="var(--border)"
            strokeDasharray="3 3"
            horizontal={false}
          />
          <XAxis
            type="number"
            allowDecimals={false}
            tick={axisStyle}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={100}
            tick={axisStyle}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar
            dataKey="count"
            name="Executions"
            fill="var(--chart-1)"
            radius={[0, 4, 4, 0]}
            maxBarSize={18}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}

function ExecutionDurationChart({
  data,
}: {
  data: ExecutionTimePoint[];
}) {
  const rows = data.flatMap((point) =>
    point.averageDurationMinutes === undefined
      ? []
      : [
          {
            date: point.date,
            averageDurationMinutes: Number(
              point.averageDurationMinutes.toFixed(1),
            ),
          },
        ],
  );
  return (
    <ChartPanel
      title="Average execution duration"
      description="Ended executions with reported durations only; values are minutes and sparse dates are intentional."
      dataCaption="Average ended-execution duration by sample date"
      dataRows={rows}
      columns={[
        { key: "date", label: "Sample date (UTC)" },
        { key: "averageDurationMinutes", label: "Average duration (min)" },
      ]}
      hasData={rows.length > 0}
      emptyDescription="No ended execution has a reported duration in this selection."
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          accessibilityLayer
          margin={{ top: 8, right: 12, bottom: 4, left: -8 }}
        >
          <CartesianGrid
            stroke="var(--border)"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={axisStyle}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
          />
          <YAxis
            tick={axisStyle}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value: number) => `${Math.round(value)}m`}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value) => [
              `${Number(value).toFixed(1)} min`,
              "Average duration",
            ]}
          />
          <Line
            type="monotone"
            dataKey="averageDurationMinutes"
            name="Average duration"
            stroke="var(--chart-3)"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}

function TaskCompletionChart({
  data,
}: {
  data: TaskCompletionPoint[];
}) {
  const rows = data.map((point) => ({
    date: point.date,
    completedTasks: point.completed,
  }));
  return (
    <ChartPanel
      title="Tasks completed over time"
      description="Uses recorded task status-history events, not execution completion."
      dataCaption="Task completion events by sample date"
      dataRows={rows}
      columns={[
        { key: "date", label: "Sample date (UTC)" },
        { key: "completedTasks", label: "Completed tasks" },
      ]}
      hasData={data.length > 0}
      emptyDescription="No task completion events with timestamps fall within this selection."
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          accessibilityLayer
          margin={{ top: 8, right: 12, bottom: 4, left: -16 }}
        >
          <CartesianGrid
            stroke="var(--border)"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={axisStyle}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
          />
          <YAxis
            allowDecimals={false}
            tick={axisStyle}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar
            dataKey="completed"
            name="Completed tasks"
            fill="var(--chart-2)"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}

function TaskStatusChart({
  data,
  hasTasks,
}: {
  data: TaskStatusCount[];
  hasTasks: boolean;
}) {
  const labels = {
    backlog: "Backlog",
    ready: "Ready",
    "in-progress": "In Progress",
    waiting: "Waiting",
    blocked: "Blocked",
    "in-review": "In Review",
    completed: "Completed",
    cancelled: "Cancelled",
  } as const;
  const rows = data.map((point) => ({
    status: labels[point.status],
    tasks: point.count,
  }));
  return (
    <ChartPanel
      title="Task status distribution"
      description="Current task snapshot; this view is independent of execution status and time-period selection."
      dataCaption="Current task counts by status"
      dataRows={rows}
      columns={[
        { key: "status", label: "Task status" },
        { key: "tasks", label: "Tasks" },
      ]}
      hasData={hasTasks}
      emptyDescription="No tasks match the selected project and agent filters."
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rows}
          layout="vertical"
          accessibilityLayer
          margin={{ top: 4, right: 16, bottom: 4, left: 8 }}
        >
          <CartesianGrid
            stroke="var(--border)"
            strokeDasharray="3 3"
            horizontal={false}
          />
          <XAxis
            type="number"
            allowDecimals={false}
            tick={axisStyle}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
          />
          <YAxis
            type="category"
            dataKey="status"
            width={100}
            tick={axisStyle}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar
            dataKey="tasks"
            name="Tasks"
            fill="var(--chart-4)"
            radius={[0, 4, 4, 0]}
            maxBarSize={18}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}

function ProjectWorkloadChart({
  data,
}: {
  data: ProjectWorkload[];
}) {
  const rows = data.map((workload) => ({
    project: workload.project.name,
    open: workload.open,
    completed: workload.completed,
    cancelled: workload.cancelled,
  }));
  return (
    <ChartPanel
      title="Current workload by project"
      description="Task statuses from the current snapshot; cancelled tasks are separate from open and completed work."
      dataCaption="Current task workload by project"
      dataRows={rows}
      columns={[
        { key: "project", label: "Project" },
        { key: "open", label: "Open tasks" },
        { key: "completed", label: "Completed tasks" },
        { key: "cancelled", label: "Cancelled tasks" },
      ]}
      hasData={data.length > 0}
      emptyDescription="No projects match the selected filter."
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rows}
          layout="vertical"
          accessibilityLayer
          margin={{ top: 4, right: 16, bottom: 4, left: 8 }}
        >
          <CartesianGrid
            stroke="var(--border)"
            strokeDasharray="3 3"
            horizontal={false}
          />
          <XAxis
            type="number"
            allowDecimals={false}
            tick={axisStyle}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
          />
          <YAxis
            type="category"
            dataKey="project"
            width={140}
            tick={axisStyle}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ color: "var(--muted-foreground)", fontSize: 12 }} />
          <Bar
            dataKey="open"
            name="Open"
            stackId="tasks"
            fill="var(--chart-1)"
            maxBarSize={22}
          />
          <Bar
            dataKey="completed"
            name="Completed"
            stackId="tasks"
            fill="var(--chart-2)"
            maxBarSize={22}
          />
          <Bar
            dataKey="cancelled"
            name="Cancelled"
            stackId="tasks"
            fill="var(--chart-5)"
            radius={[0, 4, 4, 0]}
            maxBarSize={22}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}

export {
  ExecutionDurationChart,
  ExecutionOutcomeTrendChart,
  ExecutionStatusChart,
  ExecutionVolumeChart,
  ProjectWorkloadChart,
  TaskCompletionChart,
  TaskStatusChart,
};
