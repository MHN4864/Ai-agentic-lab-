import Link from "next/link";
import type { ReactNode } from "react";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  CircleAlert,
  Clock3,
  Plug,
  ShieldCheck,
} from "lucide-react";
import { PageHeader } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AvailabilityStatusBadge,
  ConnectionStatusBadge,
  ExecutionStatusBadge,
  StatusBadge,
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
import { AgentExecutionStateBadge } from "./agent-execution-state-badge";
import type { AgentActivityEvent, WorkforceAgent } from "./types";

function DetailPanel({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && (
          <p className="text-body text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function DetailField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-metadata text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words text-body text-foreground">{children}</dd>
    </div>
  );
}

function NotReported() {
  return <span className="text-muted-foreground">Not reported</span>;
}

function AgentActivity({ event }: { event: AgentActivityEvent }) {
  const presentation = {
    connectivity: { icon: Plug, tone: "text-info" },
    execution: { icon: Activity, tone: "text-primary" },
    warning: { icon: CircleAlert, tone: "text-warning-foreground" },
    error: { icon: AlertCircle, tone: "text-error" },
  }[event.type];
  const Icon = presentation.icon;

  return (
    <li className="flex min-w-0 items-start gap-3">
      <span
        className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted ${presentation.tone}`}
      >
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="break-words text-body">{event.summary}</p>
        <p className="mt-0.5 flex items-center gap-1.5 text-metadata text-muted-foreground">
          <Clock3 className="size-3.5" aria-hidden="true" />
          {event.occurredAt}
        </p>
      </div>
    </li>
  );
}

function formatTokens(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function AgentDetails({ agent }: { agent: WorkforceAgent }) {
  const currentTask =
    agent.currentTask ??
    (agent.executionState === "idle" ? "No current task" : undefined);

  return (
    <div className="space-y-6">
      <Link
        href="/agents"
        className="inline-flex min-h-8 items-center gap-2 rounded-sm text-control font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to Agents
      </Link>

      <PageHeader
        title={agent.name}
        description={agent.responsibility}
        actions={<AgentActionsMenu agentName={agent.name} />}
      />

      <div
        className="flex flex-wrap items-center gap-2"
        aria-label="Agent operational status"
      >
        <Badge variant="outline">
          {agent.framework.name}
          {agent.framework.version ? ` · ${agent.framework.version}` : ""}
        </Badge>
        <ConnectionStatusBadge status={agent.connectivity} />
        <AgentExecutionStateBadge state={agent.executionState} />
        <AvailabilityStatusBadge status={agent.availability} />
      </div>

      <section
        aria-label="Agent details"
        className="grid min-w-0 gap-4 xl:grid-cols-2"
      >
        <DetailPanel
          title="Operational overview"
          description="Current operational signals are shown as separate dimensions."
        >
          <dl className="grid min-w-0 gap-x-6 gap-y-4 sm:grid-cols-2">
            <DetailField label="Connectivity">
              <ConnectionStatusBadge status={agent.connectivity} />
            </DetailField>
            <DetailField label="Last heartbeat">
              {agent.lastHeartbeat ?? <NotReported />}
            </DetailField>
            <DetailField label="Execution state">
              <AgentExecutionStateBadge state={agent.executionState} />
            </DetailField>
            <DetailField label="Current execution">
              {currentTask ?? <NotReported />}
            </DetailField>
            <DetailField label="Availability">
              <AvailabilityStatusBadge status={agent.availability} />
            </DetailField>
            <DetailField label="Deployment environment">
              {agent.deployment.environment ?? <NotReported />}
            </DetailField>
            <DetailField label="Deployment location">
              {agent.deployment.location ?? <NotReported />}
            </DetailField>
            <DetailField label="Model / provider">
              {agent.model ? (
                <>
                  {agent.model.name ?? "Model not reported"}
                  {agent.model.provider
                    ? ` · ${agent.model.provider}`
                    : ""}
                </>
              ) : (
                <NotReported />
              )}
            </DetailField>
            <DetailField label="Registered">
              {agent.registeredAt ?? <NotReported />}
            </DetailField>
            <DetailField label="Agent ownership">
              Customer-managed infrastructure
            </DetailField>
          </dl>
        </DetailPanel>

        <DetailPanel
          title="Capabilities"
          description="Reported capabilities are metadata and are not inferred from framework identity."
        >
          <div className="space-y-4">
            {agent.capabilityReport.status === "not-reported" ? (
              <p className="rounded-md border border-border bg-muted/40 p-3 text-body text-muted-foreground">
                Capabilities have not been reported by this agent integration.
              </p>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-body font-medium">Capability report</span>
                  <StatusBadge
                    tone={
                      agent.capabilityReport.status === "reported"
                        ? "operational"
                        : "attention"
                    }
                    category="Capability verification"
                  >
                    {agent.capabilityReport.status === "reported"
                      ? "Reported"
                      : "Unverified"}
                  </StatusBadge>
                </div>
                {agent.capabilityReport.status === "unverified" && (
                  <p className="text-body text-muted-foreground">
                    These capabilities are reported in the sample data but have
                    not been independently verified.
                  </p>
                )}
              </>
            )}

            <CapabilityList
              label="Supported capabilities"
              items={agent.capabilityReport.capabilities}
              unavailable={agent.capabilityReport.status === "not-reported"}
            />
            <CapabilityList
              label="Supported operations"
              items={agent.capabilityReport.supportedOperations}
              unavailable={agent.capabilityReport.status === "not-reported"}
            />
            <CapabilityList
              label="Available tools"
              items={agent.capabilityReport.tools}
              unavailable={!agent.capabilityReport.tools}
            />

            <div className="border-t border-border pt-4">
              <h3 className="text-body font-medium">Integration metadata</h3>
              {agent.integrationMetadata ? (
                <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                  <DetailField label="Integration">
                    {agent.integrationMetadata.name ?? <NotReported />}
                  </DetailField>
                  <DetailField label="Version">
                    {agent.integrationMetadata.version ?? <NotReported />}
                  </DetailField>
                  <DetailField label="Connection method">
                    {agent.integrationMetadata.connectionMethod ?? (
                      <NotReported />
                    )}
                  </DetailField>
                  <DetailField label="Additional details">
                    {agent.integrationMetadata.details?.join(", ") ?? (
                      <NotReported />
                    )}
                  </DetailField>
                </dl>
              ) : (
                <p className="mt-2 text-body text-muted-foreground">
                  Integration metadata has not been reported.
                </p>
              )}
            </div>
          </div>
        </DetailPanel>

        <DetailPanel
          title="Recent activity"
          description="Sample connection, execution, warning, and error events."
        >
          {agent.activity.length > 0 ? (
            <ul className="space-y-4">
              {agent.activity.map((event) => (
                <AgentActivity key={event.id} event={event} />
              ))}
            </ul>
          ) : (
            <p className="text-body text-muted-foreground">
              No activity has been reported.
            </p>
          )}
        </DetailPanel>

        <DetailPanel
          title="Recent executions"
          description="Demonstration execution history for this agent."
        >
          {agent.executions.length > 0 ? (
            <>
              <Table
                aria-label={`Recent executions for ${agent.name}`}
                className="min-w-[560px]"
              >
                <TableHeader>
                  <TableRow>
                    <TableHead>Execution</TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agent.executions.map((execution) => (
                    <TableRow key={execution.id}>
                      <TableCell className="whitespace-nowrap font-medium">
                        {execution.id}
                      </TableCell>
                      <TableCell className="min-w-40">
                        {execution.taskName}
                      </TableCell>
                      <TableCell>
                        <ExecutionStatusBadge status={execution.status} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {execution.duration ?? <NotReported />}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          ) : (
            <p className="text-body text-muted-foreground">
              No executions have been reported for this agent.
            </p>
          )}
          <Link
            href="/executions"
            className="mt-4 inline-flex min-h-8 items-center rounded-sm text-control font-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            View all executions
          </Link>
        </DetailPanel>

        <DetailPanel
          title="Usage"
          description="Estimated sample telemetry; provider-reported actual usage is not connected."
        >
          {agent.usage ? (
            <>
              <p className="mb-4 text-metadata text-muted-foreground">
                Estimated · {agent.usage.period ?? "Period not reported"}
              </p>
              <dl className="grid gap-4 sm:grid-cols-2">
                <DetailField label="Estimated token usage">
                  {agent.usage.estimatedTokens === undefined ? (
                    <NotReported />
                  ) : (
                    `${formatTokens(agent.usage.estimatedTokens)} tokens`
                  )}
                </DetailField>
                <DetailField label="Estimated cost">
                  {agent.usage.estimatedCost === undefined ? (
                    <NotReported />
                  ) : (
                    `$${agent.usage.estimatedCost.toFixed(2)}`
                  )}
                </DetailField>
              </dl>
            </>
          ) : (
            <p className="text-body text-muted-foreground">
              Usage telemetry has not been reported. This is not equivalent to
              zero usage.
            </p>
          )}
        </DetailPanel>

        <DetailPanel
          title="Permissions"
          description="High-level demonstration metadata only. No credentials or secrets are displayed."
        >
          <div className="flex items-start gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <ShieldCheck className="size-4" aria-hidden="true" />
            </span>
            <p className="text-body">{agent.permissions.overview}</p>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <CapabilityList
              label="Granted capabilities"
              items={agent.permissions.grantedCapabilities}
              unavailable={agent.permissions.status === "not-reported"}
            />
            <CapabilityList
              label="Restricted operations"
              items={agent.permissions.restrictedOperations}
              unavailable={agent.permissions.status === "not-reported"}
            />
          </div>
        </DetailPanel>
      </section>
    </div>
  );
}

function CapabilityList({
  label,
  items,
  unavailable = false,
}: {
  label: string;
  items?: string[];
  unavailable?: boolean;
}) {
  return (
    <div className="min-w-0">
      <h3 className="text-metadata font-medium text-muted-foreground">{label}</h3>
      {unavailable ? (
        <p className="mt-1 text-body text-muted-foreground">Not reported</p>
      ) : items && items.length > 0 ? (
        <ul className="mt-2 flex flex-wrap gap-2">
          {items.map((item) => (
            <li key={item}>
              <Badge variant="secondary">{item}</Badge>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-body text-muted-foreground">None listed</p>
      )}
    </div>
  );
}

export { AgentDetails };
