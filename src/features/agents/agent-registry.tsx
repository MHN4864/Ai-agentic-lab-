"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  Bot,
  CircleAlert,
  FilterX,
  Plus,
  Search,
  Users,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AvailabilityStatusBadge,
  ConnectionStatusBadge,
} from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AgentActionsMenu } from "./agent-actions-menu";
import { agentDemoData } from "./demo-data";
import { AgentExecutionStateBadge } from "./agent-execution-state-badge";
import type { WorkforceAgent } from "./types";

function MetricCard({
  title,
  value,
  supportingText,
  icon: Icon,
}: {
  title: string;
  value: number;
  supportingText: string;
  icon: LucideIcon;
}) {
  return (
    <Card className="min-w-0 gap-0 py-0">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-body text-muted-foreground">{title}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
          </div>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Icon className="size-4" aria-hidden="true" />
          </span>
        </div>
        <p className="mt-2 text-metadata text-muted-foreground">
          {supportingText}
        </p>
      </CardContent>
    </Card>
  );
}

function matchesAgent(agent: WorkforceAgent, query: string) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  return (
    !normalizedQuery ||
    agent.name.toLocaleLowerCase().includes(normalizedQuery) ||
    agent.responsibility.toLocaleLowerCase().includes(normalizedQuery)
  );
}

function AgentRegistry() {
  const [query, setQuery] = useState("");
  const [connectivity, setConnectivity] = useState("");
  const [executionState, setExecutionState] = useState("");
  const [framework, setFramework] = useState("");

  const filteredAgents = agentDemoData.filter(
    (agent) =>
      matchesAgent(agent, query) &&
      (!connectivity || agent.connectivity === connectivity) &&
      (!executionState || agent.executionState === executionState) &&
      (!framework || agent.framework.name === framework),
  );
  const activeFilters = Boolean(query || connectivity || executionState || framework);
  const connectedCount = agentDemoData.filter(
    (agent) => agent.connectivity === "connected",
  ).length;
  const attentionCount = agentDemoData.filter(
    (agent) =>
      agent.connectivity !== "connected" ||
      agent.executionState === "blocked" ||
      agent.executionState === "failed",
  ).length;
  const executingCount = agentDemoData.filter(
    (agent) => agent.executionState === "running",
  ).length;
  const frameworks = [...new Set(agentDemoData.map((agent) => agent.framework.name))];

  function clearFilters() {
    setQuery("");
    setConnectivity("");
    setExecutionState("");
    setFramework("");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agents"
        description="Manage and monitor the AI agents connected to your organization."
        actions={
          <Link href="/agents/connect" className={buttonVariants()}>
            <Plus aria-hidden="true" />
            Connect Agent
          </Link>
        }
      />

      <Alert variant="info">
        <CircleAlert aria-hidden="true" />
        <AlertDescription>
          Demonstration data only. Agents shown here are sample records; no
          agents are connected to or controlled by this preview.
        </AlertDescription>
      </Alert>

      <section aria-label="Agent summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total agents"
          value={agentDemoData.length}
          supportingText="Sample agents in this workspace"
          icon={Users}
        />
        <MetricCard
          title="Connected agents"
          value={connectedCount}
          supportingText="Connection state from sample data"
          icon={Bot}
        />
        <MetricCard
          title="Require attention"
          value={attentionCount}
          supportingText="Connectivity or execution exceptions in sample data"
          icon={CircleAlert}
        />
        <MetricCard
          title="Currently executing"
          value={executingCount}
          supportingText="Sample agents reporting a running task"
          icon={Activity}
        />
      </section>

      <Card className="min-w-0">
        <CardHeader>
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <CardTitle>Agent registry</CardTitle>
              <p className="mt-1 text-body text-muted-foreground">
                Connectivity, execution state, and availability are independent
                signals.
              </p>
            </div>
            <Badge variant="outline">
              {filteredAgents.length} of {agentDemoData.length} agents
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(14rem,1.5fr)_repeat(3,minmax(10rem,1fr))_auto] xl:items-end">
            <div className="min-w-0 space-y-1.5">
              <Label htmlFor="agent-search">Search agents</Label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="agent-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Name or role"
                  className="pl-9"
                />
              </div>
            </div>
            <FilterSelect
              id="connectivity-filter"
              label="Connectivity"
              value={connectivity}
              onChange={setConnectivity}
              options={[
                ["connected", "Connected"],
                ["degraded", "Degraded"],
                ["disconnected", "Disconnected"],
              ]}
              allLabel="All connectivity"
            />
            <FilterSelect
              id="execution-filter"
              label="Execution state"
              value={executionState}
              onChange={setExecutionState}
              options={[
                ["running", "Running"],
                ["idle", "Idle"],
                ["waiting", "Waiting"],
                ["blocked", "Blocked"],
                ["failed", "Failed"],
              ]}
              allLabel="All execution states"
            />
            <FilterSelect
              id="framework-filter"
              label="Framework"
              value={framework}
              onChange={setFramework}
              options={frameworks.map((name) => [name, name])}
              allLabel="All frameworks"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearFilters}
              disabled={!activeFilters}
              className="w-full sm:w-fit"
            >
              <FilterX aria-hidden="true" />
              Clear filters
            </Button>
          </div>

          {filteredAgents.length > 0 ? (
            <Table
              aria-label="Agent registry"
              className="min-w-[1180px]"
            >
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Framework</TableHead>
                  <TableHead>Model / provider</TableHead>
                  <TableHead>Connectivity</TableHead>
                  <TableHead>Execution state</TableHead>
                  <TableHead>Availability</TableHead>
                  <TableHead>Current task</TableHead>
                  <TableHead>Last heartbeat</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAgents.map((agent) => (
                  <TableRow key={agent.id}>
                    <TableCell className="min-w-52">
                      <Link
                        href={`/agents/${agent.id}`}
                        className="group flex min-w-0 items-center gap-2.5 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                      >
                        <Avatar className="size-8 border border-border">
                          <AvatarFallback>{agent.initials}</AvatarFallback>
                        </Avatar>
                        <span className="min-w-0">
                          <span className="block break-words font-medium text-foreground group-hover:text-primary">
                            {agent.name}
                          </span>
                          <span className="block text-metadata text-muted-foreground">
                            View details
                          </span>
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className="min-w-44 max-w-56">
                      <span className="line-clamp-2">{agent.responsibility}</span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {agent.framework.name}
                    </TableCell>
                    <TableCell className="min-w-40">
                      {agent.model?.name ? (
                        <>
                          <span className="block">{agent.model.name}</span>
                          {agent.model.provider && (
                            <span className="block text-metadata text-muted-foreground">
                              {agent.model.provider}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-muted-foreground">Not reported</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <ConnectionStatusBadge status={agent.connectivity} />
                    </TableCell>
                    <TableCell>
                      <AgentExecutionStateBadge state={agent.executionState} />
                    </TableCell>
                    <TableCell>
                      <AvailabilityStatusBadge status={agent.availability} />
                    </TableCell>
                    <TableCell className="min-w-48 max-w-64">
                      {agent.currentTask ? (
                        <Link
                          href="/tasks"
                          className="line-clamp-2 text-foreground underline-offset-4 hover:text-primary hover:underline"
                        >
                          {agent.currentTask}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">None reported</span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {agent.lastHeartbeat ?? (
                        <span className="text-muted-foreground">Not reported</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <AgentActionsMenu agentName={agent.name} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              title="No agents match these filters"
              description="Try a different search or clear the selected filters."
              icon={Bot}
              action={
                <Button type="button" variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

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
  options: string[][];
  allLabel: string;
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
        <option value="">{allLabel}</option>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </div>
  );
}

export { AgentRegistry };
