import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  AvailabilityStatusBadge,
  ConnectionStatusBadge,
} from "@/components/ui/status-badge";
import { agentDemoData } from "@/features/agents/demo-data";
import { AgentExecutionStateBadge } from "@/features/agents/agent-execution-state-badge";
import type { WorkforceAgent } from "@/features/agents/types";
import type { ProjectRecord } from "./types";

function ProjectAgentList({ project }: { project: ProjectRecord }) {
  const agents = agentDemoData.filter((agent) =>
    project.agentIds.includes(agent.id),
  );

  return (
    <Card className="min-w-0">
      <CardHeader>
        <h2 className="text-card-title font-medium leading-snug">
          Agents involved
        </h2>
        <p className="text-body text-muted-foreground">
          Existing workspace agents associated with this sample project.
          Connectivity, execution state, and availability are independent.
        </p>
      </CardHeader>
      <CardContent>
        {agents.length > 0 ? (
          <ul className="divide-y divide-border">
            {agents.map((agent) => (
              <AgentListItem key={agent.id} agent={agent} />
            ))}
          </ul>
        ) : (
          <p className="text-body text-muted-foreground">
            No agents are associated with this project in the demonstration.
            Agent assignment is not available in this step.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function AgentListItem({ agent }: { agent: WorkforceAgent }) {
  return (
    <li className="flex min-w-0 flex-col gap-3 py-4 first:pt-0 last:pb-0 xl:flex-row xl:items-start xl:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <Avatar className="size-9 shrink-0 border border-border">
          <AvatarFallback>{agent.initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <Link
            href={`/agents/${agent.id}`}
            className="break-words font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
          >
            {agent.name}
          </Link>
          <p className="mt-0.5 break-words text-body text-muted-foreground">
            {agent.responsibility}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline">
              {agent.framework.name}
              {agent.framework.version ? ` · ${agent.framework.version}` : ""}
            </Badge>
            {agent.model?.name || agent.model?.provider ? (
              <Badge variant="secondary">
                {agent.model.name ?? "Model not reported"}
                {agent.model.provider ? ` · ${agent.model.provider}` : ""}
              </Badge>
            ) : (
              <span className="text-metadata text-muted-foreground">
                Model/provider not reported
              </span>
            )}
          </div>
          <p className="mt-2 break-words text-metadata text-muted-foreground">
            Current task: {agent.currentTask ?? "Not reported"}
          </p>
        </div>
      </div>
      <div
        className="flex min-w-0 flex-wrap gap-2 xl:max-w-[50%] xl:justify-end"
        aria-label={`${agent.name} operational states`}
      >
        <ConnectionStatusBadge status={agent.connectivity} />
        <AgentExecutionStateBadge state={agent.executionState} />
        <AvailabilityStatusBadge status={agent.availability} />
      </div>
    </li>
  );
}

export { ProjectAgentList };
