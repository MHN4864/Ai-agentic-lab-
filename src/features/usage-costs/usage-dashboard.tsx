"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  Bot,
  CalendarDays,
  Coins,
  FilterX,
  Hash,
  Info,
  Search,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { agentDemoData } from "@/features/agents/demo-data";
import { formatExecutionCost } from "@/features/executions/execution-utils";
import { useProjects } from "@/features/projects/projects-context";
import { useTasks } from "@/features/tasks/tasks-context";
import {
  EstimatedCostChart,
  InputOutputTokensChart,
  ModelRequestsChart,
  TokenConsumptionChart,
} from "./usage-charts";
import { usageDemoData } from "./demo-data";
import { UsageInsights } from "./usage-insights";
import { UsageBreakdownTable, UsageRecordsTable } from "./usage-tables";
import {
  filterUsageRecords,
  formatTokenCount,
  formatUsageDate,
  getUsageBreakdownRows,
  getUsageDateRange,
  getUsageInsights,
  getUsageModelOptions,
  getUsageSampleWindow,
  getUsageSummary,
  getUsageTimeSeries,
} from "./usage-utils";
import type {
  UsageFilters,
  UsagePeriod,
  UsageTypeFilter,
} from "./types";

const periodOptions: { value: UsagePeriod; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "custom", label: "Custom demo range" },
];

const usageTypeOptions: { value: UsageTypeFilter; label: string }[] = [
  { value: "all", label: "All usage records" },
  { value: "tokens", label: "Token usage reported" },
  { value: "estimated-cost", label: "Estimated cost reported" },
  { value: "model-requests", label: "Model request events" },
];

function FilterSelect({
  id,
  label,
  value,
  onChange,
  options,
  allLabel,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  allLabel?: string;
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full min-w-0 rounded-md border border-input bg-surface px-3 text-control text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        {allLabel && <option value="">{allLabel}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function MetricCard({
  title,
  value,
  detail,
  icon: Icon,
}: {
  title: string;
  value: string;
  detail: string;
  icon: LucideIcon;
}) {
  return (
    <Card className="min-w-0 gap-0 py-0">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-body text-muted-foreground">{title}</p>
            <p className="mt-2 break-words text-2xl font-semibold tabular-nums">
              {value}
            </p>
          </div>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Icon className="size-4" aria-hidden="true" />
          </span>
        </div>
        <p className="mt-2 break-words text-metadata text-muted-foreground">
          {detail}
        </p>
      </CardContent>
    </Card>
  );
}

function UsageDashboard() {
  const { projects } = useProjects();
  const { tasks } = useTasks();
  const [period, setPeriod] = useState<UsagePeriod>("30d");
  const [projectId, setProjectId] = useState("");
  const [agentId, setAgentId] = useState("");
  const [modelKey, setModelKey] = useState("");
  const [usageType, setUsageType] = useState<UsageTypeFilter>("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [query, setQuery] = useState("");

  const entities = useMemo(
    () => ({
      agents: new Map(agentDemoData.map((agent) => [agent.id, agent])),
      projects: new Map(projects.map((project) => [project.id, project])),
      taskTitles: new Map(tasks.map((task) => [task.id, task.title])),
    }),
    [projects, tasks],
  );
  const filters = useMemo<UsageFilters>(
    () => ({
      period,
      projectId,
      agentId,
      modelKey,
      usageType,
      customStartDate,
      customEndDate,
      query,
    }),
    [
      agentId,
      customEndDate,
      customStartDate,
      modelKey,
      period,
      projectId,
      query,
      usageType,
    ],
  );
  const sampleWindow = useMemo(
    () => getUsageSampleWindow(usageDemoData),
    [],
  );
  const range = useMemo(
    () =>
      getUsageDateRange(
        period,
        sampleWindow,
        customStartDate,
        customEndDate,
      ),
    [customEndDate, customStartDate, period, sampleWindow],
  );
  const filteredRecords = useMemo(
    () => filterUsageRecords(usageDemoData, filters, range, entities),
    [entities, filters, range],
  );
  const summary = useMemo(
    () => getUsageSummary(filteredRecords),
    [filteredRecords],
  );
  const timeSeries = useMemo(
    () => getUsageTimeSeries(filteredRecords),
    [filteredRecords],
  );
  const agentBreakdown = useMemo(
    () => getUsageBreakdownRows(filteredRecords, "agent", entities),
    [entities, filteredRecords],
  );
  const projectBreakdown = useMemo(
    () => getUsageBreakdownRows(filteredRecords, "project", entities),
    [entities, filteredRecords],
  );
  const modelBreakdown = useMemo(
    () => getUsageBreakdownRows(filteredRecords, "model", entities),
    [entities, filteredRecords],
  );
  const insights = useMemo(
    () => getUsageInsights(filteredRecords, entities),
    [entities, filteredRecords],
  );
  const modelOptions = useMemo(
    () => getUsageModelOptions(usageDemoData),
    [],
  );

  function clearFilters() {
    setPeriod("30d");
    setProjectId("");
    setAgentId("");
    setModelKey("");
    setUsageType("all");
    setCustomStartDate("");
    setCustomEndDate("");
    setQuery("");
  }

  function changePeriod(value: string) {
    const nextPeriod = value as UsagePeriod;
    setPeriod(nextPeriod);
    if (nextPeriod === "custom" && sampleWindow) {
      setCustomStartDate(sampleWindow.startDate);
      setCustomEndDate(sampleWindow.endDate);
    }
  }

  const totalCostValue =
    summary.totalEstimatedCost === undefined
      ? "Unavailable"
      : formatExecutionCost(summary.totalEstimatedCost);
  const totalTokenValue = formatTokenCount(summary.totalTokens);
  const averageCostValue =
    summary.averageCostPerExecution === undefined
      ? "Unavailable"
      : formatExecutionCost(summary.averageCostPerExecution);
  const usageTypeDetail: Record<UsageTypeFilter, string> = {
    all: `${filteredRecords.length} execution records in the current selection`,
    tokens: `${summary.totalTokenRecords} records with reported total tokens; missing values excluded`,
    "estimated-cost": `${summary.costRecords} records with sample cost estimates; unknowns excluded`,
    "model-requests": `${summary.requestRecords} execution timelines with model-response event data`,
  };
  const tokenCoverageDetail = filteredRecords.length
    ? `${summary.totalTokenRecords} of ${filteredRecords.length} selected execution records report total tokens; this may be partial.`
    : "No matching execution records; token usage is unavailable.";
  const requestCoverageDetail = filteredRecords.length
    ? `${summary.requestRecords} of ${filteredRecords.length} selected execution timelines have event data; counts are not a provider billing meter.`
    : "No matching execution records; model request data is unavailable.";
  const costCoverageDetail = filteredRecords.length
    ? `${summary.costRecords} of ${filteredRecords.length} selected executions have an estimated cost; unavailable values are excluded.`
    : "No matching execution records; cost is unavailable.";
  const inputCoverageDetail = filteredRecords.length
    ? `${summary.inputTokenRecords} of ${filteredRecords.length} records report input tokens.`
    : "No matching execution records; input usage is unavailable.";
  const outputCoverageDetail = filteredRecords.length
    ? `${summary.outputTokenRecords} of ${filteredRecords.length} records report output tokens.`
    : "No matching execution records; output usage is unavailable.";
  const dateLabel = range
    ? `${formatUsageDate(range.startDate)} – ${formatUsageDate(range.endDate)} UTC`
    : "Date range unavailable";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usage & Costs"
        description="Understand reported token consumption, execution-level cost estimates, and model activity across your workforce."
      />

      <Alert variant="info">
        <Info aria-hidden="true" />
        <AlertDescription>
          Demonstration data only. Cost values are sample estimates from
          existing execution records, not provider invoices or live pricing.
          Missing usage and cost values remain unavailable; aggregate totals
          include only records with reported values. Date windows are anchored
          to the latest sample record, not to live telemetry.
        </AlertDescription>
      </Alert>

      <Card>
        <CardContent className="space-y-4 p-4">
          <div>
            <h2 className="text-card-title font-semibold">Usage filters</h2>
            <p className="text-metadata text-muted-foreground">
              Every filter scopes the overview, charts, breakdowns, insights,
              and execution table.
            </p>
          </div>
          <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-[repeat(5,minmax(9rem,1fr))_auto] xl:items-end">
            <FilterSelect
              id="usage-period"
              label="Time period"
              value={period}
              onChange={changePeriod}
              options={periodOptions}
            />
            <FilterSelect
              id="usage-project"
              label="Project"
              value={projectId}
              onChange={setProjectId}
              options={projects.map((project) => ({
                value: project.id,
                label: project.name,
              }))}
              allLabel="All projects"
            />
            <FilterSelect
              id="usage-agent"
              label="Agent"
              value={agentId}
              onChange={setAgentId}
              options={agentDemoData.map((agent) => ({
                value: agent.id,
                label: agent.name,
              }))}
              allLabel="All agents"
            />
            <FilterSelect
              id="usage-model"
              label="Model/provider"
              value={modelKey}
              onChange={setModelKey}
              options={modelOptions}
              allLabel="All models/providers"
            />
            <FilterSelect
              id="usage-type"
              label="Usage type"
              value={usageType}
              onChange={(value) => setUsageType(value as UsageTypeFilter)}
              options={usageTypeOptions}
            />
            <Button
              type="button"
              variant="outline"
              onClick={clearFilters}
              className="w-full sm:w-fit"
            >
              <FilterX aria-hidden="true" />
              Clear filters
            </Button>
          </div>

          <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <div className="min-w-0 space-y-1.5">
              <Label htmlFor="usage-search">Search records</Label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="usage-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Execution, agent, task, project, model..."
                  className="pl-9"
                />
              </div>
            </div>
            <p className="text-metadata text-muted-foreground sm:text-right">
              Usage type: {usageTypeDetail[usageType]}
            </p>
          </div>

          {period === "custom" && (
            <div className="grid min-w-0 gap-3 rounded-md border border-border bg-muted/40 p-3 sm:grid-cols-2">
              <div className="min-w-0 space-y-1.5">
                <Label htmlFor="usage-custom-start">Start date</Label>
                <Input
                  id="usage-custom-start"
                  type="date"
                  value={customStartDate || sampleWindow?.startDate || ""}
                  min={sampleWindow?.startDate}
                  max={sampleWindow?.endDate}
                  onChange={(event) => setCustomStartDate(event.target.value)}
                />
              </div>
              <div className="min-w-0 space-y-1.5">
                <Label htmlFor="usage-custom-end">End date</Label>
                <Input
                  id="usage-custom-end"
                  type="date"
                  value={customEndDate || sampleWindow?.endDate || ""}
                  min={sampleWindow?.startDate}
                  max={sampleWindow?.endDate}
                  onChange={(event) => setCustomEndDate(event.target.value)}
                />
              </div>
            </div>
          )}
          {period === "custom" && !range && (
            <p role="alert" className="text-body text-error">
              Choose a valid demo date range with the start on or before the end.
            </p>
          )}
          <p className="flex flex-wrap items-center gap-2 text-metadata text-muted-foreground">
            <CalendarDays className="size-3.5" aria-hidden="true" />
            Sample window: {dateLabel} · {filteredRecords.length} matching
            execution records
          </p>
        </CardContent>
      </Card>

      <section
        aria-label="Usage and cost overview"
        className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3"
      >
        <MetricCard
          title="Total estimated cost"
          value={totalCostValue}
          detail={costCoverageDetail}
          icon={Wallet}
        />
        <MetricCard
          title="Total tokens consumed"
          value={totalTokenValue}
          detail={tokenCoverageDetail}
          icon={Hash}
        />
        <MetricCard
          title="Input tokens"
          value={formatTokenCount(summary.inputTokens)}
          detail={inputCoverageDetail}
          icon={Activity}
        />
        <MetricCard
          title="Output tokens"
          value={formatTokenCount(summary.outputTokens)}
          detail={outputCoverageDetail}
          icon={Activity}
        />
        <MetricCard
          title="Model requests"
          value={formatTokenCount(summary.modelRequests)}
          detail={requestCoverageDetail}
          icon={Bot}
        />
        <MetricCard
          title="Average cost per execution"
          value={averageCostValue}
          detail={
            summary.costRecords
              ? `Mean of ${summary.costRecords} executions with a sample estimate; this is not a provider price.`
              : "Unavailable because no selected execution has a cost estimate."
          }
          icon={Coins}
        />
      </section>

      <section aria-labelledby="usage-trends-heading" className="space-y-4">
        <div>
          <h2
            id="usage-trends-heading"
            className="text-section-title font-semibold"
          >
            Usage trends
          </h2>
          <p className="text-body text-muted-foreground">
            Sparse sample dates are shown only when the corresponding usage
            metric is reported.
          </p>
        </div>
        <div className="grid min-w-0 gap-4 xl:grid-cols-2">
          <TokenConsumptionChart data={timeSeries} />
          <EstimatedCostChart data={timeSeries} />
          <InputOutputTokensChart data={timeSeries} />
          <ModelRequestsChart data={timeSeries} />
        </div>
      </section>

      <section aria-labelledby="usage-breakdowns-heading" className="space-y-4">
        <div>
          <h2
            id="usage-breakdowns-heading"
            className="text-section-title font-semibold"
          >
            Cost and usage breakdowns
          </h2>
          <p className="text-body text-muted-foreground">
            Estimated cost shares are calculated only from known sample
            estimates in the filtered records. Sort each table by its columns.
          </p>
        </div>
        <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
          <UsageBreakdownTable kind="agent" rows={agentBreakdown} />
          <UsageBreakdownTable kind="project" rows={projectBreakdown} />
          <div className="xl:col-span-2">
            <UsageBreakdownTable kind="model" rows={modelBreakdown} />
          </div>
        </div>
      </section>

      <UsageRecordsTable records={filteredRecords} entities={entities} />
      <UsageInsights insights={insights} />
    </div>
  );
}

export { UsageDashboard };
