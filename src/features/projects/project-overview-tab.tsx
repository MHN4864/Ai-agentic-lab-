"use client";

import Link from "next/link";
import {
  ArrowRight,
  CircleAlert,
  CircleCheck,
  ListTodo,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { agentDemoData } from "@/features/agents/demo-data";
import type { ReactNode } from "react";
import { useProjects } from "./projects-context";
import { ProjectPriorityBadge, ProjectStatusBadge } from "./project-badges";
import { ProjectActivityTimeline } from "./project-activity-timeline";
import {
  formatProjectDate,
  getProjectProgress,
  projectRequiresAttention,
  sortProjectActivity,
} from "./project-utils";
import type { ProjectRecord } from "./types";

function ProjectTaskSummaryCard({ project }: { project: ProjectRecord }) {
  const summary = project.taskSummary;

  return (
    <Card className="min-w-0">
      <CardHeader>
        <h2 className="text-card-title font-medium leading-snug">
          Task progress
        </h2>
        <p className="text-body text-muted-foreground">
          Demonstration counts only. Task creation and assignment are not
          available in this step.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <ProjectStatusBadge status={project.status} />
          <ProjectPriorityBadge priority={project.priority} />
        </div>
      </CardHeader>
      <CardContent>
        {summary ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <p className="text-body text-muted-foreground">
                {summary.completed} of {summary.total} tasks completed
              </p>
              <p className="text-xl font-semibold tabular-nums">
                {getProjectProgress(project)}%
              </p>
            </div>
            <Progress
              value={getProjectProgress(project) ?? 0}
              aria-label="Project task completion"
            />
            <dl className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
              <DetailField label="Open">{summary.open}</DetailField>
              <DetailField label="In progress">{summary.inProgress}</DetailField>
              <DetailField label="Awaiting review">
                {summary.awaitingReview}
              </DetailField>
              <DetailField label="Completed">{summary.completed}</DetailField>
              <DetailField label="Blocked">{summary.blocked}</DetailField>
              <DetailField label="Total">{summary.total}</DetailField>
            </dl>
          </div>
        ) : (
          <p className="text-body text-muted-foreground">
            A task summary has not been reported for this project.
          </p>
        )}
      </CardContent>
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

function WorkSummary({ project }: { project: ProjectRecord }) {
  const workCounts = project.workItems.reduce(
    (counts, item) => {
      counts.total += 1;
      counts[item.status] += 1;
      return counts;
    },
    {
      total: 0,
      open: 0,
      "in-progress": 0,
      "awaiting-review": 0,
      blocked: 0,
      completed: 0,
    },
  );

  return (
    <Card className="min-w-0">
      <CardHeader>
        <div className="flex min-w-0 items-center gap-2">
          <ListTodo className="size-4 text-muted-foreground" aria-hidden="true" />
          <h2 className="text-card-title font-medium leading-snug">
            Work summary
          </h2>
        </div>
        <p className="text-body text-muted-foreground">
          Illustrative work items only; no task workflow actions are available.
        </p>
      </CardHeader>
      <CardContent>
        {workCounts.total > 0 ? (
          <>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <DetailField label="Total">{workCounts.total}</DetailField>
              <DetailField label="In progress">
                {workCounts["in-progress"]}
              </DetailField>
              <DetailField label="Awaiting review">
                {workCounts["awaiting-review"]}
              </DetailField>
              <DetailField label="Blocked">{workCounts.blocked}</DetailField>
              <DetailField label="Completed">{workCounts.completed}</DetailField>
              <DetailField label="Open">{workCounts.open}</DetailField>
            </dl>
            <Link
              href={`/projects/${project.id}/work`}
              className="mt-4 inline-flex min-h-8 items-center gap-1.5 rounded-sm text-control font-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              View project work
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </>
        ) : (
          <p className="text-body text-muted-foreground">
            No illustrative work items are listed for this project.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function AgentSummary({ project }: { project: ProjectRecord }) {
  const agents = agentDemoData.filter((agent) =>
    project.agentIds.includes(agent.id),
  );

  return (
    <Card className="min-w-0">
      <CardHeader>
        <div className="flex min-w-0 items-center gap-2">
          <Users className="size-4 text-muted-foreground" aria-hidden="true" />
          <h2 className="text-card-title font-medium leading-snug">
            Agent involvement
          </h2>
        </div>
        <p className="text-body text-muted-foreground">
          {agents.length} existing agent{agents.length === 1 ? "" : "s"}{" "}
          associated with this sample project.
        </p>
      </CardHeader>
      <CardContent>
        {agents.length > 0 ? (
          <ul className="space-y-3">
            {agents.map((agent) => (
              <li key={agent.id} className="flex min-w-0 items-start gap-3">
                <Avatar className="size-8 shrink-0 border border-border">
                  <AvatarFallback>{agent.initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <Link
                    href={`/agents/${agent.id}`}
                    className="break-words text-body font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
                  >
                    {agent.name}
                  </Link>
                  <p className="text-metadata text-muted-foreground">
                    {agent.framework.name} · {agent.responsibility}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-body text-muted-foreground">
            No agents are associated with this project.
          </p>
        )}
        <Link
          href={`/projects/${project.id}/agents`}
          className="mt-4 inline-flex min-h-8 items-center gap-1.5 rounded-sm text-control font-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          View project agents
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </CardContent>
    </Card>
  );
}

function ProjectAttention({ project }: { project: ProjectRecord }) {
  const blockedItems = project.workItems.filter(
    (item) => item.status === "blocked",
  );
  const hasAttention =
    projectRequiresAttention(project) || blockedItems.length > 0;

  return (
    <Card className="min-w-0">
      <CardHeader>
        <div className="flex min-w-0 items-center gap-2">
          {hasAttention ? (
            <CircleAlert
              className="size-4 text-warning-foreground"
              aria-hidden="true"
            />
          ) : (
            <CircleCheck className="size-4 text-success" aria-hidden="true" />
          )}
          <h2 className="text-card-title font-medium leading-snug">
            Attention
          </h2>
        </div>
        <p className="text-body text-muted-foreground">
          Project-specific items from demonstration data.
        </p>
      </CardHeader>
      <CardContent>
        {hasAttention ? (
          <ul className="list-inside list-disc space-y-2 text-body">
            {project.status === "on-hold" && (
              <li>This project is currently on hold.</li>
            )}
            {project.taskSummary && project.taskSummary.blocked > 0 && (
              <li>
                {project.taskSummary.blocked} task
                {project.taskSummary.blocked === 1 ? " is" : "s are"} marked
                blocked in the sample summary.
              </li>
            )}
            {blockedItems.map((item) => (
              <li key={item.id}>{item.title} is marked blocked.</li>
            ))}
          </ul>
        ) : (
          <p className="text-body text-muted-foreground">
            No project-specific attention items are reported in this sample.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function ProjectOverviewTab({ projectId }: { projectId: string }) {
  const { projects } = useProjects();
  const project = projects.find((candidate) => candidate.id === projectId);

  if (!project) {
    return null;
  }

  const recentActivity = sortProjectActivity(project.activity).slice(0, 3);

  return (
    <section
      aria-label="Project overview"
      className="grid min-w-0 gap-4 xl:grid-cols-2"
    >
      <ProjectTaskSummaryCard project={project} />

      <Card className="min-w-0">
        <CardHeader>
          <h2 className="text-card-title font-medium leading-snug">
            Important dates
          </h2>
          <p className="text-body text-muted-foreground">
            Schedule information recorded for this project.
          </p>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            <DetailField label="Start date">
              {formatProjectDate(project.startDate)}
            </DetailField>
            <DetailField label="Target date">
              {formatProjectDate(project.targetDate)}
            </DetailField>
            <DetailField label="Owner">
              {project.owner ?? "Unassigned"}
            </DetailField>
            <DetailField label="Team">
              {project.team ?? "Not specified"}
            </DetailField>
          </dl>
        </CardContent>
      </Card>

      <Card className="min-w-0">
        <CardHeader>
          <h2 className="text-card-title font-medium leading-snug">
            Goals and success criteria
          </h2>
          <p className="text-body text-muted-foreground">
            The intended outcome for this project.
          </p>
        </CardHeader>
        <CardContent>
          {project.goals ? (
            <p className="whitespace-pre-wrap break-words text-body">
              {project.goals}
            </p>
          ) : (
            <p className="text-body text-muted-foreground">
              No goals or success criteria have been recorded.
            </p>
          )}
        </CardContent>
      </Card>

      <WorkSummary project={project} />
      <AgentSummary project={project} />
      <ProjectAttention project={project} />

      <Card className="min-w-0 xl:col-span-2">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-card-title font-medium leading-snug">
                Recent activity
              </h2>
              <p className="text-body text-muted-foreground">
                Demonstration events associated with this project.
              </p>
            </div>
            <Link
              href={`/projects/${project.id}/activity`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              View activity
              <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <ProjectActivityTimeline
            events={recentActivity}
            emptyMessage="No recent project activity has been reported."
          />
        </CardContent>
      </Card>

    </section>
  );
}

export { ProjectOverviewTab, ProjectTaskSummaryCard };
