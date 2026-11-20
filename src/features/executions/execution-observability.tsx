"use client";

import Link from "next/link";
import {
  Activity,
  CircleAlert,
  FileText,
  GitBranch,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ReviewStatusBadge } from "@/features/reviews/review-badges";
import { reviewStatusLabels } from "@/features/reviews/labels";
import type { ReviewRecord } from "@/features/reviews/types";
import {
  executionDiagnosticCategoryLabels,
  executionEventTypeLabels,
  executionSpanStatusLabels,
} from "./labels";
import {
  executionDurationSeconds,
  formatExecutionCost,
  formatExecutionDuration,
  formatExecutionMilliseconds,
  formatExecutionTimestamp,
  formatExecutionTokens,
  formatTokenCount,
} from "./execution-utils";
import type {
  ExecutionEvent,
  ExecutionObservability,
  ExecutionRecord,
  ExecutionSpan,
} from "./types";

const eventToneClasses: Record<ExecutionEvent["type"], string> = {
  queued: "bg-muted-foreground",
  started: "bg-primary",
  "agent-initialized": "bg-primary",
  "task-context-received": "bg-primary",
  "tool-invocation": "bg-primary",
  "tool-result": "bg-primary",
  "model-response": "bg-primary",
  waiting: "bg-warning",
  retry: "bg-warning",
  "output-generated": "bg-primary",
  completed: "bg-success",
  failed: "bg-error",
  cancelled: "bg-muted-foreground",
  "timed-out": "bg-error",
};

function metadataLabel(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]/g, " ")
    .replace(/^\w/, (letter) => letter.toLocaleUpperCase());
}

function EventMetadata({ event }: { event: ExecutionEvent }) {
  if (!event.metadata || Object.keys(event.metadata).length === 0) {
    return null;
  }

  return (
    <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
      {Object.entries(event.metadata).map(([key, value]) => (
        <div key={key} className="flex min-w-0 gap-1">
          <dt className="text-metadata text-muted-foreground">
            {metadataLabel(key)}:
          </dt>
          <dd className="break-all text-metadata text-foreground">
            {String(value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function ExecutionEventTimeline({
  events,
}: {
  events: ExecutionEvent[];
}) {
  const chronologicalEvents = [...events].sort(
    (first, second) =>
      new Date(first.occurredAt).getTime() -
      new Date(second.occurredAt).getTime(),
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Activity className="size-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-card-title font-semibold">
              Execution lifecycle
            </h2>
            <p className="text-metadata text-muted-foreground">
              Chronological event history · illustrative
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="border-t border-border pt-5">
        {chronologicalEvents.length ? (
          <ol aria-label="Execution event timeline" className="space-y-0">
            {chronologicalEvents.map((event, index) => (
              <li
                key={event.id}
                id={`execution-event-${event.id}`}
                className="relative grid grid-cols-[1.25rem_minmax(0,1fr)] gap-3 pb-5 last:pb-0"
              >
                {index < chronologicalEvents.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-0 left-[0.55rem] top-4 w-px bg-border"
                  />
                )}
                <span
                  aria-hidden="true"
                  className={`relative z-10 mt-1 size-2.5 rounded-full ring-4 ring-surface ${eventToneClasses[event.type]}`}
                />
                <div className="min-w-0">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <div className="min-w-0">
                      <p className="text-body font-medium">
                        {executionEventTypeLabels[event.type]}
                      </p>
                      <p className="mt-1 break-words text-body text-muted-foreground">
                        {event.description}
                      </p>
                    </div>
                    <time
                      dateTime={event.occurredAt}
                      className="shrink-0 text-metadata text-muted-foreground"
                    >
                      {formatExecutionTimestamp(event.occurredAt)}
                    </time>
                  </div>
                  {event.durationMs !== undefined && (
                    <p className="mt-1 text-metadata text-muted-foreground">
                      Duration: {formatExecutionMilliseconds(event.durationMs)}
                    </p>
                  )}
                  <EventMetadata event={event} />
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState
            title="No lifecycle events reported"
            description="This execution has no illustrative event history."
            icon={CircleAlert}
          />
        )}
      </CardContent>
    </Card>
  );
}

type FlattenedSpan = {
  span: ExecutionSpan;
  depth: number;
};

function flattenSpans(spans: ExecutionSpan[]) {
  const flattened: FlattenedSpan[] = [];

  function visit(span: ExecutionSpan, depth: number) {
    flattened.push({ span, depth });
    span.children?.forEach((child) => visit(child, depth + 1));
  }

  spans.forEach((span) => visit(span, 0));
  return flattened.sort(
    (first, second) =>
      first.span.startOffsetMs - second.span.startOffsetMs ||
      first.depth - second.depth,
  );
}

const spanStatusClasses: Record<ExecutionSpan["status"], string> = {
  completed: "border-success bg-success/20",
  running: "border-primary bg-primary/20",
  waiting: "border-warning bg-warning/20",
  failed: "border-error bg-error/20",
  cancelled: "border-muted-foreground bg-muted",
  "timed-out": "border-error bg-error/20",
  skipped: "border-muted-foreground bg-muted",
};

function spanWindowMs(execution: ExecutionRecord, spans: ExecutionSpan[]) {
  const longestExecution =
    (executionDurationSeconds(execution) ?? 0) * 1000;
  const longestSpan = flattenSpans(spans).reduce(
    (longest, { span }) =>
      Math.max(longest, span.startOffsetMs + (span.durationMs ?? 0)),
    0,
  );
  return Math.max(longestExecution, longestSpan, 1);
}

function ExecutionTrace({
  execution,
  spans,
}: {
  execution: ExecutionRecord;
  spans?: ExecutionSpan[];
}) {
  const rows = spans ? flattenSpans(spans) : [];
  const windowMs = spans ? spanWindowMs(execution, spans) : 1;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <GitBranch className="size-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-card-title font-semibold">Execution trace</h2>
            <p className="text-metadata text-muted-foreground">
              Static illustrative spans · relative to execution start
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="border-t border-border pt-5">
        {rows.length ? (
          <div className="space-y-4">
            {rows.map(({ span, depth }) => {
              const leftPercent = Math.min(
                100,
                (span.startOffsetMs / windowMs) * 100,
              );
              const requestedWidth = span.durationMs
                ? (span.durationMs / windowMs) * 100
                : 2;
              const widthPercent = Math.max(
                1.5,
                Math.min(100 - leftPercent, requestedWidth),
              );

              return (
                <div
                  key={span.id}
                  className="grid min-w-0 gap-2 sm:grid-cols-[minmax(10rem,0.8fr)_minmax(0,2fr)] sm:items-center"
                >
                  <div
                    className="min-w-0"
                    style={{ paddingInlineStart: `${depth * 16}px` }}
                  >
                    <p className="break-words text-body font-medium">
                      {span.name}
                    </p>
                    <p className="text-metadata text-muted-foreground">
                      {executionSpanStatusLabels[span.status]} · offset{" "}
                      {formatExecutionMilliseconds(span.startOffsetMs)}
                      {span.durationMs !== undefined &&
                        ` · ${formatExecutionMilliseconds(span.durationMs)}`}
                    </p>
                  </div>
                  <div
                    className="relative h-7 min-w-0 overflow-hidden rounded-md bg-muted"
                    aria-label={`${span.name}: ${executionSpanStatusLabels[span.status]}`}
                  >
                    <span
                      aria-hidden="true"
                      className={`absolute inset-y-1 rounded-sm border-l-2 ${spanStatusClasses[span.status]}`}
                      style={{
                        left: `${leftPercent}%`,
                        width: `${widthPercent}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
            <div className="flex justify-between border-t border-border pt-2 text-metadata text-muted-foreground">
              <span>0 ms</span>
              <span>
                {executionDurationSeconds(execution) === undefined
                  ? "Observed span window"
                  : formatExecutionDuration(execution)}
              </span>
            </div>
          </div>
        ) : (
          <EmptyState
            title="Trace spans unavailable"
            description="No illustrative span data is available for this execution."
            icon={GitBranch}
          />
        )}
      </CardContent>
    </Card>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="min-w-0 gap-0 py-0">
      <CardContent className="p-4">
        <p className="text-metadata text-muted-foreground">{label}</p>
        <p className="mt-2 break-words text-lg font-semibold tabular-nums">
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function ExecutionPerformanceMetrics({
  execution,
  observability,
}: {
  execution: ExecutionRecord;
  observability: ExecutionObservability;
}) {
  const metrics = observability.metrics;
  const usage = execution.tokenUsage;
  const hasMetrics =
    executionDurationSeconds(execution) !== undefined ||
    execution.estimatedCost !== undefined ||
    usage?.inputTokens !== undefined ||
    usage?.outputTokens !== undefined ||
    usage?.totalTokens !== undefined ||
    metrics?.modelLatencyMs !== undefined ||
    metrics?.toolExecutionMs !== undefined ||
    metrics?.retryCount !== undefined ||
    metrics?.toolCalls !== undefined;

  return (
    <section aria-labelledby="execution-metrics-heading" className="space-y-4">
      <div>
        <h2
          id="execution-metrics-heading"
          className="text-section-title font-semibold"
        >
          Performance and resources
        </h2>
        <p className="mt-1 text-body text-muted-foreground">
          Reported values are illustrative; unavailable telemetry is not treated
          as zero.
        </p>
      </div>
      {hasMetrics ? (
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard
            label="Total duration"
            value={formatExecutionDuration(execution)}
          />
          <MetricCard
            label="Model latency"
            value={formatExecutionMilliseconds(metrics?.modelLatencyMs)}
          />
          <MetricCard
            label="Tool execution time"
            value={formatExecutionMilliseconds(metrics?.toolExecutionMs)}
          />
          <MetricCard
            label="Input tokens"
            value={
              usage?.inputTokens === undefined
                ? "Not reported"
                : `${formatTokenCount(usage.inputTokens)} tokens`
            }
          />
          <MetricCard
            label="Output tokens"
            value={
              usage?.outputTokens === undefined
                ? "Not reported"
                : `${formatTokenCount(usage.outputTokens)} tokens`
            }
          />
          <MetricCard
            label="Total tokens"
            value={formatExecutionTokens(execution)}
          />
          <MetricCard
            label="Estimated cost"
            value={formatExecutionCost(execution.estimatedCost)}
          />
          <MetricCard
            label="Retry count"
            value={
              metrics?.retryCount === undefined
                ? "Not reported"
                : String(metrics.retryCount)
            }
          />
          <MetricCard
            label="Tool calls"
            value={
              metrics?.toolCalls === undefined
                ? "Not reported"
                : String(metrics.toolCalls)
            }
          />
        </div>
      ) : (
        <Card>
          <CardContent className="py-5">
            <EmptyState
              title="No performance metrics reported"
              description="This execution has no illustrative duration, token, latency, cost, or tool metrics."
              icon={CircleAlert}
            />
          </CardContent>
        </Card>
      )}
    </section>
  );
}

function ExecutionOutput({
  execution,
  output,
}: {
  execution: ExecutionRecord;
  output?: ExecutionObservability["output"];
}) {
  const preview =
    output?.kind === "structured" && output.structuredResult !== undefined
      ? JSON.stringify(output.structuredResult, null, 2)
      : output?.content;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <FileText className="size-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-card-title font-semibold">Execution output</h2>
            <p className="text-metadata text-muted-foreground">
              Illustrative result data only
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="border-t border-border pt-5">
        {output ? (
          <div className="space-y-4">
            <div>
              <p className="text-body font-medium">{output.summary}</p>
              {output.generatedAt && (
                <p className="mt-1 text-metadata text-muted-foreground">
                  Generated {formatExecutionTimestamp(output.generatedAt)} ·{" "}
                  {output.kind}
                </p>
              )}
            </div>
            {preview ? (
              <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-muted/40 p-4 font-mono text-secondary text-foreground">
                {preview}
              </pre>
            ) : (
              <EmptyState
                title="Output preview unavailable"
                description="The output record does not include preview content."
                icon={FileText}
              />
            )}
            {output.metadata && Object.keys(output.metadata).length > 0 && (
              <dl className="grid min-w-0 gap-3 sm:grid-cols-2">
                {Object.entries(output.metadata).map(([key, value]) => (
                  <div key={key} className="min-w-0">
                    <dt className="text-metadata text-muted-foreground">
                      {metadataLabel(key)}
                    </dt>
                    <dd className="break-words text-body">
                      {String(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        ) : (
          <EmptyState
            title={
              execution.status === "failed" ||
              execution.status === "timed-out"
                ? "No output produced"
                : "No output reported"
            }
            description={
              execution.status === "failed" ||
              execution.status === "timed-out"
                ? "This execution ended without a successful output record."
                : "No final response or deliverable summary is available for this execution."
            }
            icon={execution.status === "failed" ? CircleAlert : FileText}
          />
        )}
      </CardContent>
    </Card>
  );
}

function AssociatedReview({
  review,
}: {
  review?: ReviewRecord;
}) {
  if (!review) {
    return (
      <p className="text-body text-muted-foreground">
        No review record is associated with this execution&apos;s task.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-body font-medium">Associated task review</p>
        <p className="mt-1 text-metadata text-muted-foreground">
          Review {review.id} · {reviewStatusLabels[review.status]}
        </p>
      </div>
      <Link
        href={`/reviews/${review.id}`}
        className="inline-flex min-h-9 items-center rounded-md border border-border px-3 text-control font-medium text-primary hover:bg-accent"
      >
        <ReviewStatusBadge status={review.status} />
        <span className="sr-only">Open review {review.id}</span>
      </Link>
    </div>
  );
}

function ExecutionReviewLink({ review }: { review?: ReviewRecord }) {
  return (
    <Card>
      <CardContent className="p-4">
        <AssociatedReview review={review} />
      </CardContent>
    </Card>
  );
}

function ExecutionDiagnostics({
  execution,
  observability,
}: {
  execution: ExecutionRecord;
  observability: ExecutionObservability;
}) {
  const isFailure =
    execution.status === "failed" || execution.status === "timed-out";
  if (!isFailure && !observability.diagnostics) {
    return null;
  }

  const diagnostics = observability.diagnostics;
  const retryInfo = diagnostics?.retryInfo;
  const eventIsAvailable = diagnostics
    ? observability.events.some((event) => event.id === diagnostics.eventId)
    : false;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-error/10 text-error">
            <CircleAlert className="size-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-card-title font-semibold">Error diagnostics</h2>
            <p className="text-metadata text-muted-foreground">
              Demonstration information · no stack traces or credentials
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid min-w-0 gap-5 border-t border-border pt-5 md:grid-cols-2">
        <div className="space-y-4">
          <div>
            <p className="text-metadata text-muted-foreground">
              Failure category
            </p>
            <p className="mt-1 text-body font-medium">
              {diagnostics
                ? executionDiagnosticCategoryLabels[diagnostics.category]
                : "Not reported"}
            </p>
          </div>
          <div>
            <p className="text-metadata text-muted-foreground">Error summary</p>
            <p className="mt-1 break-words text-body">
              {execution.errorSummary ?? "Not reported"}
            </p>
          </div>
          <div>
            <p className="text-metadata text-muted-foreground">
              Relevant timeline event
            </p>
            {diagnostics && eventIsAvailable ? (
              <a
                href={`#execution-event-${diagnostics.eventId}`}
                className="mt-1 inline-flex text-body font-medium text-primary hover:underline"
              >
                View related event
              </a>
            ) : (
              <p className="mt-1 text-body">Not reported</p>
            )}
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-metadata text-muted-foreground">
              Retry information
            </p>
            {retryInfo ? (
              <div className="mt-1 space-y-1 text-body">
                <p>
                  Attempt {retryInfo.attempt}
                  {retryInfo.maxAttempts !== undefined &&
                    ` of ${retryInfo.maxAttempts}`}
                  {" · "}
                  {retryInfo.retryScheduled
                    ? "Retry scheduled in demo"
                    : "No further retry scheduled"}
                </p>
                <p className="text-muted-foreground">{retryInfo.note}</p>
              </div>
            ) : (
              <p className="mt-1 text-body">Not reported</p>
            )}
          </div>
          <div>
            <p className="text-metadata text-muted-foreground">
              Diagnostic metadata
            </p>
            {diagnostics?.metadata &&
            Object.keys(diagnostics.metadata).length > 0 ? (
              <dl className="mt-1 space-y-1">
                {Object.entries(diagnostics.metadata).map(([key, value]) => (
                  <div key={key} className="flex flex-wrap gap-1 text-body">
                    <dt className="text-muted-foreground">
                      {metadataLabel(key)}:
                    </dt>
                    <dd className="break-all">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-1 text-body">Not reported</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ExecutionObservabilitySections({
  execution,
  observability,
  review,
}: {
  execution: ExecutionRecord;
  observability: ExecutionObservability;
  review?: ReviewRecord;
}) {
  return (
    <div className="space-y-6">
      <ExecutionPerformanceMetrics
        execution={execution}
        observability={observability}
      />
      <ExecutionEventTimeline events={observability.events} />
      <ExecutionTrace execution={execution} spans={observability.spans} />
      <ExecutionOutput execution={execution} output={observability.output} />
      <ExecutionReviewLink review={review} />
      <ExecutionDiagnostics
        execution={execution}
        observability={observability}
      />
      <Alert variant="info">
        <CircleAlert aria-hidden="true" />
        <AlertDescription>
          Events, trace spans, performance metrics, output previews, review
          references, and diagnostics on this page are illustrative
          demonstration records. They are not collected from a live runtime.
        </AlertDescription>
      </Alert>
    </div>
  );
}

export { ExecutionObservabilitySections };
