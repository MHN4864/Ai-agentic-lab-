"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CircleAlert,
  Plus,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Label } from "@/components/ui/label";
import { agentDemoData } from "@/features/agents/demo-data";
import { useWorkforceDirectory } from "@/features/members/workforce-directory-context";
import { useProjects } from "@/features/projects/projects-context";
import { useTasks } from "./tasks-context";
import { AgentOperationalInfo, TaskAssigneeIdentity } from "./task-assignment-components";
import { assigneeKey, sameAssignee } from "./task-assignment-utils";
import {
  ProjectPriorityBadge,
  ProjectStatusBadge,
} from "@/features/projects/project-badges";
import { TaskStatusBadge, TaskTypeBadge } from "./task-badges";
import type { TaskAssignee } from "./types";

function assigneeValue(assignee: TaskAssignee | null) {
  return assignee ? assigneeKey(assignee) : "";
}

function parseAssigneeValue(
  value: string,
  memberIds: string[],
): TaskAssignee | null | undefined {
  if (!value) {
    return null;
  }

  if (value.startsWith("human:")) {
    const memberId = value.slice("human:".length);
    return memberIds.includes(memberId)
      ? { type: "human", memberId }
      : undefined;
  }

  if (value.startsWith("agent:")) {
    const agentId = value.slice("agent:".length);
    return agentDemoData.some((agent) => agent.id === agentId)
      ? { type: "agent", agentId }
      : undefined;
  }

  return undefined;
}

function getAssigneeLabel(
  assignee: TaskAssignee,
  members: ReturnType<typeof useWorkforceDirectory>["members"],
) {
  return assignee.type === "human"
    ? members.find((member) => member.id === assignee.memberId)?.name ??
        "Member not available"
    : agentDemoData.find((agent) => agent.id === assignee.agentId)?.name ??
        "Agent not available";
}

function assignmentOptions(
  includeType: boolean,
  members: ReturnType<typeof useWorkforceDirectory>["members"],
) {
  return [
    ...members.map(
      (member) =>
        [
          `human:${member.id}`,
          includeType ? `${member.name} (Human)` : member.name,
        ] as [string, string],
    ),
    ...agentDemoData.map(
      (agent) =>
        [
          `agent:${agent.id}`,
          includeType ? `${agent.name} (Agent)` : agent.name,
        ] as [string, string],
    ),
  ].sort((first, second) => first[1].localeCompare(second[1]));
}

function AssignmentNotFound() {
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

function TaskAssignmentPage({ taskId }: { taskId: string }) {
  const router = useRouter();
  const { tasks, updateTaskAssignment } = useTasks();
  const { projects } = useProjects();
  const { members } = useWorkforceDirectory();
  const task = tasks.find((candidate) => candidate.id === taskId);
  const [primaryAssignee, setPrimaryAssignee] = useState<TaskAssignee | null>(
    () => task?.assignment.primaryAssignee ?? null,
  );
  const [collaborators, setCollaborators] = useState<TaskAssignee[]>(
    () => task?.assignment.collaborators ?? [],
  );
  const [pendingCollaborator, setPendingCollaborator] = useState("");
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  if (!task) {
    return <AssignmentNotFound />;
  }
  const currentTask = task;

  const project = projects.find(
    (candidate) => candidate.id === currentTask.projectId,
  );
  const allOptions = assignmentOptions(true, members);
  const primaryOptions =
    currentTask.taskType === "human"
      ? allOptions.filter(([value]) => value.startsWith("human:"))
      : currentTask.taskType === "agent"
        ? allOptions.filter(([value]) => value.startsWith("agent:"))
        : allOptions;
  const collaboratorOptions =
    currentTask.taskType === "collaborative"
      ? allOptions.filter(([value]) => {
          const assignee = parseAssigneeValue(
            value,
            members.map((member) => member.id),
          );
          return (
            assignee !== undefined &&
            assignee !== null &&
            !sameAssignee(assignee, primaryAssignee) &&
            !collaborators.some((collaborator) =>
              sameAssignee(collaborator, assignee),
            )
          );
        })
      : [];
  const pendingAssignee = parseAssigneeValue(
    pendingCollaborator,
    members.map((member) => member.id),
  );
  const pendingAgent =
    pendingAssignee?.type === "agent"
      ? agentDemoData.find((agent) => agent.id === pendingAssignee.agentId)
      : undefined;
  const primaryAgent =
    primaryAssignee?.type === "agent"
      ? agentDemoData.find((agent) => agent.id === primaryAssignee.agentId)
      : undefined;

  function handlePrimaryChange(value: string) {
    const nextAssignee = parseAssigneeValue(
      value,
      members.map((member) => member.id),
    );
    if (nextAssignee === undefined) {
      setFormError("Select an available human or agent.");
      return;
    }

    setPrimaryAssignee(nextAssignee);
    setPendingCollaborator("");
    setCollaborators((current) =>
      nextAssignee
        ? current.filter(
            (collaborator) => !sameAssignee(collaborator, nextAssignee),
          )
        : [],
    );
    setNotice(
      !nextAssignee && collaborators.length
        ? "Returning this task to unassigned will also remove its collaborators."
        : "",
    );
    setFormError("");
  }

  function handleAddCollaborator() {
    if (!pendingAssignee || pendingAssignee === null) {
      setFormError("Choose an available collaborator first.");
      return;
    }

    if (
      sameAssignee(pendingAssignee, primaryAssignee) ||
      collaborators.some((collaborator) =>
        sameAssignee(collaborator, pendingAssignee),
      )
    ) {
      setFormError("Each person or agent can only appear once.");
      return;
    }

    setCollaborators((current) => [...current, pendingAssignee]);
    setPendingCollaborator("");
    setFormError("");
  }

  function removeCollaborator(assignee: TaskAssignee) {
    setCollaborators((current) =>
      current.filter((collaborator) => !sameAssignee(collaborator, assignee)),
    );
    setNotice("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) {
      return;
    }

    if (collaborators.length && !primaryAssignee) {
      setFormError("Assign a primary assignee before adding collaborators.");
      return;
    }

    if (
      currentTask.taskType !== "collaborative" &&
      collaborators.length
    ) {
      setFormError("Only collaborative tasks can have collaborators.");
      return;
    }

    setIsSaving(true);
    const updatedTask = updateTaskAssignment(currentTask.id, {
      primaryAssignee,
      collaborators,
    });

    if (!updatedTask) {
      setIsSaving(false);
      setFormError(
        "An assignee is no longer available or the assignment is invalid. Review your selections and try again.",
      );
      return;
    }

    router.push(`/tasks/${currentTask.id}`);
  }

  return (
    <div className="space-y-6">
      <Link
        href={`/tasks/${currentTask.id}`}
        className="inline-flex min-h-8 items-center gap-2 rounded-sm text-control font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to task
      </Link>

      <PageHeader
        title="Manage assignment"
        description={`${currentTask.title} · ${currentTask.id}`}
      />

      <Alert variant="info">
        <CircleAlert aria-hidden="true" />
        <AlertDescription>
          Assignment designates ownership only. It does not mean an agent
          accepted or started work. These changes are demonstration-only and
          remain in workspace memory.
        </AlertDescription>
      </Alert>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(18rem,1fr)]">
        <Card className="min-w-0">
          <CardHeader>
            <h2 className="text-card-title font-medium leading-snug">
              Assignment
            </h2>
            <p className="text-body text-muted-foreground">
              Select a primary owner. Collaborators are available only for
              collaborative tasks.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {formError && (
                <Alert variant="destructive">
                  <CircleAlert aria-hidden="true" />
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}
              {notice && (
                <Alert variant="warning">
                  <CircleAlert aria-hidden="true" />
                  <AlertDescription>{notice}</AlertDescription>
                </Alert>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <TaskStatusBadge status={currentTask.status} />
                <ProjectPriorityBadge
                  priority={currentTask.priority}
                  category="Task priority"
                />
                <TaskTypeBadge taskType={currentTask.taskType} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="task-primary-assignee">
                  Primary assignee
                </Label>
                <select
                  id="task-primary-assignee"
                  value={assigneeValue(primaryAssignee)}
                  onChange={(event) => handlePrimaryChange(event.target.value)}
                  className="h-9 w-full min-w-0 rounded-md border border-input bg-surface px-3 text-control text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                >
                  <option value="">Unassigned</option>
                  {primaryOptions.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <p className="text-metadata text-muted-foreground">
                  {currentTask.taskType === "human"
                    ? "This task is designated for a human assignee."
                    : currentTask.taskType === "agent"
                      ? "This task is designated for an individual agent."
                      : "A human or agent can be the primary owner of this collaborative task."}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-control font-medium">
                    Current primary assignee
                  </h3>
                  {primaryAssignee && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handlePrimaryChange("")}
                    >
                      Remove assignee
                    </Button>
                  )}
                </div>
                {primaryAssignee?.type === "agent" && primaryAgent ? (
                  <AgentOperationalInfo
                    agent={primaryAgent}
                    role="Primary assignee"
                  />
                ) : (
                  <TaskAssigneeIdentity
                    assignee={primaryAssignee}
                    role="Primary assignee"
                  />
                )}
              </div>

              {currentTask.taskType === "collaborative" ? (
                <section
                  aria-labelledby="task-collaborators-title"
                  className="space-y-3 border-t border-border pt-5"
                >
                  <div>
                    <h3
                      id="task-collaborators-title"
                      className="text-control font-medium"
                    >
                      Collaborators
                    </h3>
                    <p className="mt-1 text-metadata text-muted-foreground">
                      Collaborators support the task alongside its primary
                      assignee. They are not automatically assigned or started.
                    </p>
                  </div>

                  {primaryAssignee ? (
                    <div className="space-y-3">
                      <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                        <div className="min-w-0 space-y-1.5">
                          <Label htmlFor="task-pending-collaborator">
                            Add collaborator
                          </Label>
                          <select
                            id="task-pending-collaborator"
                            value={pendingCollaborator}
                            onChange={(event) => {
                              setPendingCollaborator(event.target.value);
                              setFormError("");
                            }}
                            className="h-9 w-full min-w-0 rounded-md border border-input bg-surface px-3 text-control text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                          >
                            <option value="">Select a member or agent</option>
                            {collaboratorOptions.map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleAddCollaborator}
                          disabled={!pendingCollaborator}
                          className="w-full sm:w-fit"
                        >
                          <Plus aria-hidden="true" />
                          Add collaborator
                        </Button>
                      </div>

                      {pendingAssignee?.type === "agent" && pendingAgent && (
                        <AgentOperationalInfo
                          agent={pendingAgent}
                          role="Potential collaborator"
                        />
                      )}
                      {pendingAssignee?.type === "human" && (
                        <TaskAssigneeIdentity
                          assignee={pendingAssignee}
                          role="Potential collaborator"
                        />
                      )}

                      {collaborators.length ? (
                        <ul className="space-y-3">
                          {collaborators.map((collaborator) => {
                            const collaboratorAgent =
                              collaborator.type === "agent"
                                ? agentDemoData.find(
                                    (agent) => agent.id === collaborator.agentId,
                                  )
                                : undefined;

                            return (
                              <li
                                key={assigneeKey(collaborator)}
                                className="flex min-w-0 flex-wrap items-start gap-2"
                              >
                                <div className="min-w-0 flex-1">
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
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label={`Remove ${getAssigneeLabel(collaborator, members)} as collaborator`}
                                  onClick={() =>
                                    removeCollaborator(collaborator)
                                  }
                                >
                                  <X aria-hidden="true" />
                                </Button>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <p className="rounded-md border border-dashed border-border px-3 py-4 text-body text-muted-foreground">
                          No collaborators added.
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="rounded-md border border-dashed border-border px-3 py-4 text-body text-muted-foreground">
                      Set a primary assignee before adding collaborators.
                    </p>
                  )}
                </section>
              ) : (
                <p className="border-t border-border pt-4 text-body text-muted-foreground">
                  This is a {currentTask.taskType} task. Change its task type to
                  Collaborative in Edit Task to add collaborators.
                </p>
              )}

              <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
                <Link
                  href={`/tasks/${currentTask.id}`}
                  className={buttonVariants({ variant: "outline" })}
                >
                  Cancel
                </Link>
                <Button type="submit" disabled={isSaving}>
                  Save assignment
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <aside className="min-w-0 space-y-4">
          <Card className="min-w-0">
            <CardHeader>
              <h2 className="text-card-title font-medium leading-snug">
                Task context
              </h2>
            </CardHeader>
            <CardContent className="space-y-4 text-body">
              <div>
                <p className="text-metadata text-muted-foreground">Task</p>
                <p className="mt-1 font-medium">{currentTask.title}</p>
                <p className="text-metadata text-muted-foreground">
                  {currentTask.id}
                </p>
              </div>
              <div>
                <p className="text-metadata text-muted-foreground">Project</p>
                {project ? (
                  <Link
                    href={`/projects/${project.id}`}
                    className="mt-1 inline-flex font-medium text-primary underline-offset-4 hover:underline"
                  >
                    {project.name}
                  </Link>
                ) : (
                  <p className="mt-1 text-muted-foreground">
                    Project not available
                  </p>
                )}
                {project && (
                  <div className="mt-2">
                    <ProjectStatusBadge status={project.status} />
                  </div>
                )}
              </div>
              {currentTask.taskType === "collaborative" && (
                <div className="border-t border-border pt-3">
                  <p className="text-metadata text-muted-foreground">
                    Collaboration roles
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="outline">One primary assignee</Badge>
                    <Badge variant="outline">Optional collaborators</Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Alert variant="warning">
            <CircleAlert aria-hidden="true" />
            <AlertDescription>
              Assignment, agent acceptance, execution, and task completion are
              separate concepts. This page only records designated ownership.
            </AlertDescription>
          </Alert>
        </aside>
      </div>
    </div>
  );
}

export { TaskAssignmentPage };
