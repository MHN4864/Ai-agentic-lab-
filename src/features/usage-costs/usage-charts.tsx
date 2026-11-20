"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartNoAxesCombined } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { formatExecutionCost } from "@/features/executions/execution-utils";
import { formatTokenCount } from "./usage-utils";
import type { UsageTimePoint } from "./types";

type ChartValue = string | number | null;
type ChartRow = Record<string, ChartValue>;
type ChartColumn = { key: string; label: string };

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
  rows: ChartRow[];
  columns: ChartColumn[];
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
                <TableCell key={column.key}>
                  {row[column.key] ?? "Not reported"}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </details>
  );
}

function UsageChartPanel({
  title,
  description,
  caption,
  rows,
  columns,
  children,
}: {
  title: string;
  description: string;
  caption: string;
  rows: ChartRow[];
  columns: ChartColumn[];
  children: React.ReactNode;
}) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <div>
          <h3 className="text-card-title font-semibold">{title}</h3>
          <p className="text-metadata text-muted-foreground">{description}</p>
        </div>
      </CardHeader>
      <CardContent className="border-t border-border pt-4">
        {rows.length ? (
          <>
            <div className="h-[250px] min-w-0 sm:h-[280px]">{children}</div>
            <ChartDataTable caption={caption} rows={rows} columns={columns} />
          </>
        ) : (
          <EmptyState
            title="Usage data unavailable"
            description="No reported values match the current date and filter selection. Missing values are not interpreted as zero."
            icon={ChartNoAxesCombined}
            className="min-h-40 px-2 py-6"
          />
        )}
      </CardContent>
    </Card>
  );
}

function TokenConsumptionChart({ data }: { data: UsageTimePoint[] }) {
  const rows = data
    .flatMap((point) =>
      point.totalTokens === undefined
        ? []
        : [
            {
              date: point.date,
              label: point.label,
              totalTokens: point.totalTokens,
            },
          ],
    );
  return (
    <UsageChartPanel
      title="Token consumption over time"
      description="Reported total tokens by sample date. Dates without token records are omitted."
      caption="Reported tokens by date"
      rows={rows.map((point) => ({
        date: point.date,
        totalTokens: point.totalTokens,
      }))}
      columns={[
        { key: "date", label: "Sample date (UTC)" },
        { key: "totalTokens", label: "Reported tokens" },
      ]}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} accessibilityLayer margin={{ top: 8, right: 12, bottom: 4, left: -12 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={axisStyle} tickLine={false} axisLine={{ stroke: "var(--border)" }} />
          <YAxis
            allowDecimals={false}
            tick={axisStyle}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value: number) => new Intl.NumberFormat("en-US", { notation: "compact" }).format(value)}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value) => [formatTokenCount(Number(value)), "Reported tokens"]}
          />
          <Bar dataKey="totalTokens" name="Reported tokens" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </UsageChartPanel>
  );
}

function EstimatedCostChart({ data }: { data: UsageTimePoint[] }) {
  const rows = data
    .flatMap((point) =>
      point.estimatedCost === undefined
        ? []
        : [
            {
              date: point.date,
              label: point.label,
              estimatedCost: point.estimatedCost,
            },
          ],
    );
  return (
    <UsageChartPanel
      title="Estimated cost over time"
      description="Execution-provided sample estimates only; missing cost telemetry is omitted, not zero."
      caption="Estimated USD cost by date"
      rows={rows.map((point) => ({
        date: point.date,
        estimatedCost: formatExecutionCost(point.estimatedCost),
      }))}
      columns={[
        { key: "date", label: "Sample date (UTC)" },
        { key: "estimatedCost", label: "Estimated cost (USD)" },
      ]}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} accessibilityLayer margin={{ top: 8, right: 12, bottom: 4, left: -4 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={axisStyle} tickLine={false} axisLine={{ stroke: "var(--border)" }} />
          <YAxis
            tick={axisStyle}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value: number) => `$${Number(value).toFixed(2)}`}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value) => [formatExecutionCost(Number(value)), "Estimated cost"]}
          />
          <Line
            type="monotone"
            dataKey="estimatedCost"
            name="Estimated cost (USD)"
            stroke="var(--chart-3)"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </UsageChartPanel>
  );
}

function InputOutputTokensChart({ data }: { data: UsageTimePoint[] }) {
  const rows = data
    .filter(
      (point) =>
        point.inputTokens !== undefined || point.outputTokens !== undefined,
    )
    .map((point) => ({
      date: point.date,
      label: point.label,
      inputTokens: point.inputTokens ?? null,
      outputTokens: point.outputTokens ?? null,
    }));
  return (
    <UsageChartPanel
      title="Input vs. output tokens"
      description="Reported token components by sample date. An unreported component remains blank."
      caption="Reported input and output tokens by date"
      rows={rows.map((point) => ({
        date: point.date,
        inputTokens: point.inputTokens ?? "Not reported",
        outputTokens: point.outputTokens ?? "Not reported",
      }))}
      columns={[
        { key: "date", label: "Sample date (UTC)" },
        { key: "inputTokens", label: "Input tokens" },
        { key: "outputTokens", label: "Output tokens" },
      ]}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} accessibilityLayer margin={{ top: 8, right: 12, bottom: 4, left: -12 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={axisStyle} tickLine={false} axisLine={{ stroke: "var(--border)" }} />
          <YAxis
            allowDecimals={false}
            tick={axisStyle}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value: number) => new Intl.NumberFormat("en-US", { notation: "compact" }).format(value)}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value, name) => [
              formatTokenCount(Number(value)),
              name === "inputTokens" ? "Input tokens" : "Output tokens",
            ]}
          />
          <Bar dataKey="inputTokens" name="Input tokens" stackId="tokens" fill="var(--chart-1)" maxBarSize={40} />
          <Bar dataKey="outputTokens" name="Output tokens" stackId="tokens" fill="var(--chart-2)" maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </UsageChartPanel>
  );
}

function ModelRequestsChart({ data }: { data: UsageTimePoint[] }) {
  const rows = data
    .flatMap((point) =>
      point.modelRequests === undefined
        ? []
        : [
            {
              date: point.date,
              label: point.label,
              modelRequests: point.modelRequests,
            },
          ],
    );
  return (
    <UsageChartPanel
      title="Model request volume"
      description="Counts recorded model-response timeline events; this sample is not a provider billing meter."
      caption="Recorded model-response events by date"
      rows={rows.map((point) => ({
        date: point.date,
        modelRequests: point.modelRequests,
      }))}
      columns={[
        { key: "date", label: "Sample date (UTC)" },
        { key: "modelRequests", label: "Model-response events" },
      ]}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} accessibilityLayer margin={{ top: 8, right: 12, bottom: 4, left: -12 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={axisStyle} tickLine={false} axisLine={{ stroke: "var(--border)" }} />
          <YAxis allowDecimals={false} tick={axisStyle} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="modelRequests" name="Model-response events" fill="var(--chart-4)" radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </UsageChartPanel>
  );
}

export {
  EstimatedCostChart,
  InputOutputTokensChart,
  ModelRequestsChart,
  TokenConsumptionChart,
};
