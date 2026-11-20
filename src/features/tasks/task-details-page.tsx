"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CircleAlert,
  CircleCheck,
  Clock3,
} from "lucide-react";
import { PageHeader } from "@/components/layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  ConnectionStatusBadge,
  StatusBadge,
} from "@/components/ui/status-badge";
import { agentDemoData } from "@/features/agents/demo-data";
import { useWorkforceDirectory } from "@/features/members/workforce-directory-context";
import { TaskDeliverableSection } from "@/features/reviews/task-deliverable-section";
import { useProjects } from "@/features/projects/projects-context";
import {
  ProjectPriorityBadge,
} from "@/features/projects/project-badges";
import { projectStatusLabels } from "@/features/projects/project-labels";
import { useTasks } from "./tasks-context";
import {
  AgentOperationalInfo,
  TaskAssigneeIdentity,
} from "./task-assignment-components";
import { assigneeKey } from "./task-assignment-utils";
import { TaskStatusBadge, TaskTypeBadge } from "./task-badges";
import {
  formatTaskDate,
  formatTaskTimestamp,
  taskActivityActorLabel,
  taskAssigneeLabel,
} from "./task-utils";
import type {
  TaskActivityEvent,
  TaskAssignmentHistoryEvent,
  TaskRecord,
} from "./types";

function TaskActivityTimeline({ task }: { task: TaskRecord }) {
  const events = [...task.activity].sort(
    (first, second) =>
      new Date(second.occurredAt).getTime() -
      new Date(first.occurredAt).getTime(),
  );

  return (
    <ol aria-label="Task activity timeline" className="space-y-0">
      {events.map((event) => (
        <TaskActivityItem key={event.id} event={event} />
      ))}
    </ol>
  );
}

function TaskActivityItem({ event }: { event: TaskActivityEvent }) {
  const { members } = useWorkforceDirectory();
  const typeLabel =
    event.type === "created"
      ? "Created"
      : event.type === "status"
        ? "Status"
        : "Updated";

  return (
    <li className="relative flex gap-3 border-l border-border pb-5 pl-5 last:border-l-transparent last:pb-0">
      <span className="absolute -left-1.25 top-1 size-2 rounded-full border border-background bg-primary" />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{typeLabel}</Badge>
          <span className="text-metadata text-muted-foreground">
            {taskActivityActorLabel(event.actor, members)}
          </span>
          <time
            dateTime={event.occurredAt}
            className="text-metadata text-muted-foreground"
          >
            {formatTaskTimestamp(event.occurredAt)}
          </time>
        </div>
        <p className="text-body">{event.summary}</p>
      </div>
    </li>
  );
}

function TaskAssignmentHistory({ task }: { task: TaskRecord }) {
  const events = [...task.assignmentHistory].sort(
    (first, second) =>
      new Date(second.occurredAt).getTime() -
      new Date(first.occurredAt).getTime(),
  );

  if (!events.length) {
    return (
      <p className="text-body text-muted-foreground">
        No assignment changes have been recorded.
      </p>
    );
  }

  return (
    <ol aria-label="Assignment history" className="space-y-0">
      {events.map((event) => (
        <TaskAssignmentHistoryItem key={event.id} event={event} />
      ))}
    </ol>
  );
}

function TaskAssignmentHistoryItem({
  event,
}: {
  event: TaskAssignmentHistoryEvent;
}) {
  const { members } = useWorkforceDirectory();
  const title =
    event.type === "initial-assignment"
      ? "Initial assignment"
      : event.type === "reassignment"
        ? "Reassignment"
        : event.type === "collaborator-added"
          ? "Collaborator added"
          : event.type === "collaborator-removed"
            ? "Collaborator removed"
            : "Unassignment";

  return (
    <li className="relative flex gap-3 border-l border-border pb-5 pl-5 last:border-l-transparent last:pb-0">
      <span className="absolute -left-1.25 top-1 size-2 rounded-full border border-background bg-primary" />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{title}</Badge>
          <span className="text-metadata text-muted-foreground">
            {taskActivityActorLabel(event.actor, members)}
          </span>
          <time
            dateTime={event.occurredAt}
            className="text-metadata text-muted-foreground"
          >
            {formatTaskTimestamp(event.occurredAt)}
          </time>
        </div>
        {event.type === "collaborator-added" ||
        event.type === "collaborator-removed" ? (
          <div className="space-y-0.5 text-body">
            <p>
              Collaborator:{" "}
              {event.collaborator
                ? taskAssigneeLabel(event.collaborator, members)
                : "Not reported"}
            </p>
            <p className="text-muted-foreground">
              Primary assignee:{" "}
              {taskAssigneeLabel(event.newPrimaryAssignee, members)}
            </p>
          </div>
        ) : (
          <p className="text-body">
            {"Previous: "}
            {taskAssigneeLabel(event.previousPrimaryAssignee, members)}
            {" "}
            <span className="text-muted-foreground">to</span>
            {" New: "}
            {taskAssigneeLabel(event.newPrimaryAssignee, members)}
          </p>
        )}
      </div>
    </li>
  );
}

function TaskAssignmentSection({ task }: { task: TaskRecord }) {
  const primaryAssignee = task.assignment.primaryAssignee;
  const primaryAgent =
    primaryAssignee?.type === "agent"
      ? agentDemoData.find(
          (agent) => agent.id === primaryAssignee.agentId,
        )
      : undefined;

  return (
    <Card className="min-w-0">
      <CardHeader>
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-card-title font-medium leading-snug">
              Assignment
            </h2>
            <p className="text-body text-muted-foreground">
              Designated ownership only. Assignment does not mean accepted or
              started.
            </p>
          </div>
          <Link
            href={`/tasks/${task.id}/assignment`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Edit Assignment
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <section
          aria-labelledby="task-primary-assignee-title"
          className="space-y-2"
        >
          <h3
            id="task-primary-assignee-title"
            className="text-control font-medium"
          >
            Primary assignee
          </h3>
          {primaryAgent ? (
            <AgentOperationalInfo agent={primaryAgent} role="Primary assignee" />
          ) : (
            <TaskAssigneeIdentity
              assignee={task.assignment.primaryAssignee}
              role="Primary assignee"
            />
          )}
        </section>

        <section
          aria-labelledby="task-collaborators-title"
          className="space-y-2"
        >
          <div className="flex flex-wrap items-center gap-2">
            <h3
              id="task-collaborators-title"
              className="text-control font-medium"
            >
              Collaborators
            </h3>
            <Badge variant="outline">
              {task.assignment.collaborators.length}
            </Badge>
          </div>
          {task.assignment.collaborators.length ? (
            <ul className="space-y-3">
              {task.assignment.collaborators.map((collaborator) => {
                const collaboratorAgent =
                  collaborator.type === "agent"
                    ? agentDemoData.find(
                        (agent) => agent.id === collaborator.agentId,
                      )
                    : undefined;
                return (
                  <li key={assigneeKey(collaborator)}>
                    {collaboratorAgent ? (
                      <AgentOperationalInfo
                        agent={collaboratorAgent}
                        role="Collaborator"
                      />
                    ) : (
                      <TaskAssigneeIdentity
                        assignee={collaborator}
                        role="Collaborator"
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-body text-muted-foreground">
              {task.taskType === "collaborative"
                ? "No collaborators added."
                : "Collaborators are available on collaborative tasks."}
            </p>
          )}
        </section>

        <section
          aria-labelledby="task-assignment-history-title"
          className="space-y-3 border-t border-border pt-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3
              id="task-assignment-history-title"
              className="text-control font-medium"
            >
              Assignment history
            </h3>
            <Badge variant="outline">Demonstration data</Badge>
          </div>
          <TaskAssignmentHistory task={task} />
        </section>
      </CardContent>
    </Card>
  );
}

function TaskNotFound() {
  return (
    <EmptyState
      title="Task not found"
      description="This task is not part of the current demonstration workspace."
      icon={CircleAlert}
      action={
        <Link href="/tasks" className={buttonVariants({ variant: "outline" })}>
          <ArrowLeft aria-hidden="true" />
          Back to Tasks
        </Link>
      }
    />
  );
}

function TaskDetailsPage({ taskId }: { taskId: string }) {
  const { tasks } = useTasks();
  const { projects } = useProjects();
  const task = tasks.find((candidate) => candidate.id === taskId);

  if (!task) {
    return <TaskNotFound />;
  }

  const project = projects.find(
    (candidate) => candidate.id === task.projectId,
  );
  const primaryAssignee = task.assignment.primaryAssignee;
  const assignedAgent =
    primaryAssignee?.type === "agent"
      ? agentDemoData.find(
          (agent) => agent.id === primaryAssignee.agentId,
        )
      : undefined;
  const isAssigned = Boolean(primaryAssignee);
  const isProjectActive = project?.status === "active";
  const agentIsConnected = assignedAgent?.connectivity === "connected";
  const blockers: string[] = [];

  if (!isAssigned) {
    blockers.push("Assign a human or agent before execution is considered.");
  }

  if (!project) {
    blockers.push("The related project is not available.");
  } else if (!isProjectActive) {
    blockers.push("The related project is not Active.");
  }

  if (primaryAssignee?.type === "agent") {
    if (!assignedAgent) {
      blockers.push("The assigned agent record is not available.");
    } else if (!agentIsConnected) {
      blockers.push(
        `The assigned agent is ${assignedAgent.connectivity}; a connected state is not reported.`,
      );
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={task.title}
        description={`Task ${task.id}`}
        actions={
          <>
            <Link
              href="/tasks"
              className={buttonVariants({ variant: "outline" })}
            >
              <ArrowLeft aria-hidden="true" />
              Back to Tasks
            </Link>
            <Link
              href={`/tasks/${task.id}/edit`}
              className={buttonVariants()}
            >
              Edit Task
            </Link>
          </>
        }
      />

      <Alert variant="info">
        <CircleAlert aria-hidden="true" />
        <AlertDescription>
          Demonstration task. Details and readiness indicators are illustrative;
          assignment updates are demonstration-only and do not start agent
          execution.
        </AlertDescription>
      </Alert>

      <div className="flex flex-wrap items-center gap-2">
        <TaskStatusBadge status={task.status} />
        <ProjectPriorityBadge
          priority={task.priority}
          category="Task priority"
        />
        <TaskTypeBadge taskType={task.taskType} />
        <span className="font-mono text-metadata text-muted-foreground">
          {task.id}
        </span>
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(18rem,1fr)]">
        <div className="min-w-0 space-y-4">
          <Card className="min-w-0">
            <CardHeader>
              <h2 className="text-card-title font-medium leading-snug">
                Task information
              </h2>
            </CardHeader>
            <CardContent className="space-y-5">
              <section aria-labelledby="task-description-title">
                <h3
                  id="task-description-title"
                  className="text-control font-medium"
                >
                  Description
                </h3>
                <p className="mt-1 whitespace-pre-wrap text-body text-muted-foreground">
                  {task.description || "No description provided."}
                </p>
              </section>

              <section aria-labelledby="task-acceptance-title">
                <h3
                  id="task-acceptance-title"
                  className="text-control font-medium"
                >
                  Acceptance criteria
                </h3>
                <p className="mt-1 whitespace-pre-wrap text-body text-muted-foreground">
                  {task.acceptanceCriteria || "Not provided."}
                </p>
              </section>

              <section aria-labelledby="task-context-title">
                <h3
                  id="task-context-title"
                  className="text-control font-medium"
                >
                  Additional context
                </h3>
                <p className="mt-1 whitespace-pre-wrap text-body text-muted-foreground">
                  {task.context || "Not provided."}
                </p>
              </section>
            </CardContent>
          </Card>

          <TaskDeliverableSection key={task.id} task={task} />

          <TaskAssignmentSection task={task} />

          <Card className="min-w-0">
            <CardHeader>
              <h2 className="text-card-title font-medium leading-snug">
                Execution readiness
              </h2>
              <p className="text-body text-muted-foreground">
                Informational only. This does not start or validate an
                execution.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-border p-3">
                  <p className="text-metadata text-muted-foreground">
                    Assignment
                  </p>
                  <div className="mt-2">
                    <StatusBadge
                      tone={isAssigned ? "operational" : "attention"}
                      category="Assignment"
                    >
                      {isAssigned ? "Assigned" : "Unassigned"}
                    </StatusBadge>
                  </div>
                </div>
                <div className="rounded-md border border-border p-3">
                  <p className="text-metadata text-muted-foreground">
                    Project active
                  </p>
                  <div className="mt-2">
                    {project ? (
                      <StatusBadge
                        tone={isProjectActive ? "operational" : "attention"}
                        category="Project active"
                      >
                        {isProjectActive ? "Yes" : "No"}
                      </StatusBadge>
                    ) : (
                      <StatusBadge tone="critical" category="Project">
                        Not available
                      </StatusBadge>
                    )}
                  </div>
                  {project && (
                    <p className="mt-1 text-metadata text-muted-foreground">
                      Status: {projectStatusLabels[project.status]}
                    </p>
                  )}
                </div>
                {primaryAssignee?.type === "agent" && (
                  <div className="rounded-md border border-border p-3 sm:col-span-2">
                    <p className="text-metadata text-muted-foreground">
                      Agent connectivity
                    </p>
                    <div className="mt-2">
                      {assignedAgent ? (
                        <ConnectionStatusBadge
                          status={assignedAgent.connectivity}
                        />
                      ) : (
                        <StatusBadge
                          tone="critical"
                          category="Agent connectivity"
                        >
                          Not available
                        </StatusBadge>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div
                className="rounded-md border border-border bg-muted/30 p-3"
                aria-live="polite"
              >
                <div className="flex items-start gap-2">
                  {blockers.length ? (
                    <CircleAlert
                      className="mt-0.5 size-4 shrink-0 text-warning-foreground"
                      aria-hidden="true"
                    />
                  ) : (
                    <CircleCheck
                      className="mt-0.5 size-4 shrink-0 text-success"
                      aria-hidden="true"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-control font-medium">
                      {blockers.length
                        ? "Potential readiness blockers"
                        : "No obvious configuration blockers"}
                    </p>
                    {blockers.length ? (
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-body text-muted-foreground">
                        {blockers.map((blocker) => (
                          <li key={blocker}>{blocker}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1 text-body text-muted-foreground">
                        Assignment and project information are present. This
                        does not indicate that the task is executable.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="min-w-0 space-y-4">
          <Card className="min-w-0">
            <CardHeader>
              <h2 className="text-card-title font-medium leading-snug">
                Task summary
              </h2>
            </CardHeader>
            <CardContent className="space-y-4 text-body">
              <div>
                <p className="text-metadata text-muted-foreground">Project</p>
                {project ? (
                  <Link
                    href={`/projects/${project.id}`}
                    className="mt-1 inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
                  >
                    {project.name}
                  </Link>
                ) : (
                  <p className="mt-1 text-muted-foreground">
                    Project not available
                  </p>
                )}
              </div>
              <div>
                <p className="text-metadata text-muted-foreground">Due date</p>
                <p className="mt-1">{formatTaskDate(task.dueDate)}</p>
              </div>
              <div className="grid gap-3 border-t border-border pt-3 sm:grid-cols-2 xl:grid-cols-1">
                <div>
                  <p className="text-metadata text-muted-foreground">Created</p>
                  <p className="mt-1">{formatTaskTimestamp(task.createdAt)}</p>
                </div>
                <div>
                  <p className="text-metadata text-muted-foreground">
                    Last updated
                  </p>
                  <p className="mt-1">{formatTaskTimestamp(task.updatedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="min-w-0">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock3
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <h2 className="text-card-title font-medium leading-snug">
                  Activity
                </h2>
              </div>
            </CardHeader>
            <CardContent>
              {task.activity.length ? (
                <TaskActivityTimeline task={task} />
              ) : (
                <p className="text-body text-muted-foreground">
                  No activity has been reported for this task.
                </p>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

export { TaskDetailsPage };
