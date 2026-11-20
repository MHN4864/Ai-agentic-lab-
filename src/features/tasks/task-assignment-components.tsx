"use client";

import { Bot, UserRound } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  AvailabilityStatusBadge,
  ConnectionStatusBadge,
  StatusBadge,
} from "@/components/ui/status-badge";
import { agentDemoData } from "@/features/agents/demo-data";
import { AgentExecutionStateBadge } from "@/features/agents/agent-execution-state-badge";
import { useWorkforceDirectory } from "@/features/members/workforce-directory-context";
import type { WorkforceAgent } from "@/features/agents/types";
import type { TaskAssignee } from "./types";

function AgentOperationalInfo({
  agent,
  role,
}: {
  agent: WorkforceAgent;
  role: string;
}) {
  const mayNotStartImmediately =
    agent.connectivity !== "connected" ||
    agent.availability !== "available";

  return (
    <div className="min-w-0 space-y-3 rounded-md border border-border p-3">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <Bot
            className="mt-0.5 size-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="break-words font-medium text-foreground">
              {agent.name}
            </p>
            <p className="mt-0.5 text-metadata text-muted-foreground">
              {agent.responsibility}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline">{role}</Badge>
          <Badge variant="secondary">Agent</Badge>
        </div>
      </div>

      <p className="text-metadata text-muted-foreground">
        Framework: <span className="text-foreground">{agent.framework.name}</span>
      </p>

      <div
        role="group"
        aria-label={`${agent.name} operational states`}
        className="flex flex-wrap gap-2"
      >
        <ConnectionStatusBadge status={agent.connectivity} />
        <AgentExecutionStateBadge state={agent.executionState} />
        <AvailabilityStatusBadge status={agent.availability} />
      </div>

      {mayNotStartImmediately ? (
        <Alert variant="warning">
          <AlertDescription>
            This agent may not be able to start additional work immediately.
            Assignment remains allowed and does not mean the agent accepted or
            started this task.
          </AlertDescription>
        </Alert>
      ) : (
        <p className="text-metadata text-muted-foreground">
          Assignment designates ownership only; it does not mean the agent
          accepted or started this task.
        </p>
      )}
    </div>
  );
}

function TaskAssigneeIdentity({
  assignee,
  role,
}: {
  assignee: TaskAssignee | null;
  role: string;
}) {
  const { members } = useWorkforceDirectory();
  if (!assignee) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge tone="attention" category={role}>
          Unassigned
        </StatusBadge>
      </div>
    );
  }

  if (assignee.type === "human") {
    const member = members.find(
      (candidate) => candidate.id === assignee.memberId,
    );

    return (
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <UserRound
          className="size-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
        <span className="min-w-0 break-words font-medium">
          {member?.name ?? "Member not available"}
        </span>
        <Badge variant="outline">{role}</Badge>
        <Badge variant="secondary">Human</Badge>
        {member?.team && (
          <span className="text-metadata text-muted-foreground">
            {member.team}
          </span>
        )}
      </div>
    );
  }

  const agent = agentDemoData.find(
    (candidate) => candidate.id === assignee.agentId,
  );

  return agent ? (
    <AgentOperationalInfo agent={agent} role={role} />
  ) : (
    <div className="flex flex-wrap items-center gap-2">
      <Bot
        className="size-4 shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
      <span className="font-medium">Agent not available</span>
      <Badge variant="outline">{role}</Badge>
      <Badge variant="secondary">Agent</Badge>
    </div>
  );
}

export { AgentOperationalInfo, TaskAssigneeIdentity };
