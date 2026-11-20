"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CircleAlert,
  ExternalLink,
  FileClock,
} from "lucide-react";
import { PageHeader } from "@/components/layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useProjects } from "@/features/projects/projects-context";
import { useTasks } from "@/features/tasks/tasks-context";
import { agentDemoData } from "@/features/agents/demo-data";
import { useReviews } from "@/features/reviews/reviews-context";
import { ExecutionObservabilitySections } from "./execution-observability";
import { executionObservabilityDemoData } from "./demo-data";
import { executionTriggerLabels } from "./labels";
import { ExecutionStatusBadge } from "./execution-status-badge";
import {
  formatExecutionCost,
  formatExecutionDuration,
  formatExecutionTimestamp,
  formatExecutionTokens,
  formatTokenCount,
} from "./execution-utils";
import type { ExecutionRecord } from "./types";

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 space-y-1">
      <p className="text-metadata text-muted-foreground">{label}</p>
      <p className="break-words text-body font-medium">{value}</p>
    </div>
  );
}

function ExecutionDetails({ execution }: { execution: ExecutionRecord }) {
  const { tasks } = useTasks();
  const { projects } = useProjects();
  const { reviews } = useReviews();
  const agent = agentDemoData.find((candidate) => candidate.id === execution.agentId);
  const task = tasks.find((candidate) => candidate.id === execution.taskId);
  const project = projects.find(
    (candidate) => candidate.id === execution.projectId,
  );
  const relatedReviews = reviews
    .filter((review) => review.taskId === execution.taskId)
    .sort(
      (first, second) =>
        new Date(second.submittedAt).getTime() -
        new Date(first.submittedAt).getTime(),
    );
  const review =
    relatedReviews.find((candidate) => candidate.id === execution.reviewId) ??
    relatedReviews[0];
  const observability =
    executionObservabilityDemoData[execution.id] ?? { events: [] };
  const modelName =
    execution.model?.name || execution.model?.provider
      ? [execution.model.name, execution.model.provider]
          .filter(Boolean)
          .join(" · ")
      : "Not reported";
  const usage = execution.tokenUsage;

  return (
    <div className="space-y-6">
      <PageHeader
        title={execution.id}
        description="Execution summary · illustrative demonstration data"
        actions={
          <Link
            href="/executions"
            className={buttonVariants({ variant: "outline" })}
          >
            <ArrowLeft aria-hidden="true" />
            Back to Executions
          </Link>
        }
      />

      <Alert variant="info">
        <CircleAlert aria-hidden="true" />
        <AlertDescription>
          Read-only summary. This execution record is illustrative and does not
          represent live runtime telemetry or provide execution controls.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <FileClock className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="text-card-title font-semibold">Execution summary</h2>
              <p className="text-metadata text-muted-foreground">
                Triggered by {executionTriggerLabels[execution.triggerType]}
              </p>
            </div>
          </div>
          <ExecutionStatusBadge status={execution.status} />
        </CardHeader>
        <CardContent className="grid min-w-0 gap-6 border-t border-border pt-5 md:grid-cols-2 xl:grid-cols-3">
          <section aria-labelledby="execution-related-heading" className="space-y-4">
            <h3 id="execution-related-heading" className="text-control font-semibold">
              Related records
            </h3>
            <div className="space-y-4">
              <div className="min-w-0 space-y-1">
                <p className="text-metadata text-muted-foreground">Agent</p>
                {agent ? (
                  <Link
                    href={`/agents/${agent.id}`}
                    className="inline-flex max-w-full items-center gap-1.5 break-words text-body font-medium text-primary hover:underline"
                  >
                    {agent.name}
                    <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
                  </Link>
                ) : (
                  <p className="text-body">Agent unavailable</p>
                )}
              </div>
              <div className="min-w-0 space-y-1">
                <p className="text-metadata text-muted-foreground">Task</p>
                {task ? (
                  <Link
                    href={`/tasks/${task.id}`}
                    className="inline-flex max-w-full items-center gap-1.5 break-words text-body font-medium text-primary hover:underline"
                  >
                    {task.title}
                    <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
                  </Link>
                ) : (
                  <p className="text-body">Task unavailable</p>
                )}
                <p className="font-mono text-metadata text-muted-foreground">
                  {execution.taskId}
                </p>
              </div>
              <div className="min-w-0 space-y-1">
                <p className="text-metadata text-muted-foreground">Project</p>
                {project ? (
                  <Link
                    href={`/projects/${project.id}`}
                    className="inline-flex max-w-full items-center gap-1.5 break-words text-body font-medium text-primary hover:underline"
                  >
                    {project.name}
                    <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
                  </Link>
                ) : (
                  <p className="text-body">Project unavailable</p>
                )}
              </div>
            </div>
          </section>

          <section aria-labelledby="execution-times-heading" className="space-y-4">
            <h3 id="execution-times-heading" className="text-control font-semibold">
              Timing
            </h3>
            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              <SummaryItem
                label="Queued at"
                value={formatExecutionTimestamp(execution.queuedAt)}
              />
              <SummaryItem
                label="Started at"
                value={
                  execution.startedAt
                    ? formatExecutionTimestamp(execution.startedAt)
                    : "Not started"
                }
              />
              <SummaryItem
                label="Ended at"
                value={formatExecutionTimestamp(execution.endedAt)}
              />
              <SummaryItem
                label="Duration"
                value={formatExecutionDuration(execution)}
              />
              <SummaryItem
                label="Last activity"
                value={formatExecutionTimestamp(execution.lastActivityAt)}
              />
              <SummaryItem
                label="Trigger type"
                value={executionTriggerLabels[execution.triggerType]}
              />
            </div>
          </section>

          <section aria-labelledby="execution-telemetry-heading" className="space-y-4">
            <h3 id="execution-telemetry-heading" className="text-control font-semibold">
              Reported telemetry
            </h3>
            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              <SummaryItem label="Model / provider" value={modelName} />
              <SummaryItem
                label="Token usage"
                value={formatExecutionTokens(execution)}
              />
              <SummaryItem
                label="Estimated cost"
                value={formatExecutionCost(execution.estimatedCost)}
              />
              <SummaryItem
                label="Input tokens"
                value={
                  usage?.inputTokens === undefined
                    ? "Not reported"
                    : formatTokenCount(usage.inputTokens)
                }
              />
              <SummaryItem
                label="Output tokens"
                value={
                  usage?.outputTokens === undefined
                    ? "Not reported"
                    : formatTokenCount(usage.outputTokens)
                }
              />
              <SummaryItem
                label="Total tokens"
                value={
                  usage?.totalTokens === undefined
                    ? "Not reported"
                    : formatTokenCount(usage.totalTokens)
                }
              />
            </div>
          </section>
        </CardContent>
      </Card>

      <ExecutionObservabilitySections
        execution={execution}
        observability={observability}
        review={review}
      />
    </div>
  );
}

function ExecutionNotFound() {
  return (
    <EmptyState
      title="Execution not found"
      description="This execution is not available in the current demonstration workspace."
      icon={CircleAlert}
      action={
        <Link
          href="/executions"
          className={buttonVariants({ variant: "outline" })}
        >
          <ArrowLeft aria-hidden="true" />
          Back to Executions
        </Link>
      }
    />
  );
}

export { ExecutionDetails, ExecutionNotFound };
