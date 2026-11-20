"use client";

import { Bot, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useWorkforceDirectory } from "@/features/members/workforce-directory-context";
import { agentDemoData } from "@/features/agents/demo-data";
import { formatTaskTimestamp } from "@/features/tasks/task-utils";
import { deliverableTypeLabels, reviewEventLabels } from "./labels";
import type {
  ReviewDeliverable,
  ReviewHistoryEvent,
  ReviewRecord,
} from "./types";

function reviewPersonName(
  person: ReviewHistoryEvent["actor"],
  members: ReturnType<typeof useWorkforceDirectory>["members"],
) {
  return person.type === "human"
    ? members.find((member) => member.id === person.memberId)?.name ??
        "Member not available"
    : agentDemoData.find((agent) => agent.id === person.agentId)?.name ??
        "Agent not available";
}

function ReviewPerson({
  person,
  role,
}: {
  person: ReviewHistoryEvent["actor"];
  role: string;
}) {
  const { members } = useWorkforceDirectory();
  const isHuman = person.type === "human";
  const member = isHuman
    ? members.find((candidate) => candidate.id === person.memberId)
    : undefined;
  const agent = person.type === "agent"
    ? agentDemoData.find((candidate) => candidate.id === person.agentId)
    : undefined;
  const name = isHuman
    ? member?.name ?? "Member not available"
    : agent?.name ?? "Agent not available";
  const Icon = isHuman ? UserRound : Bot;

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <Icon
        className="size-4 shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
      <span className="min-w-0 break-words font-medium">{name}</span>
      <Badge variant="outline">{role}</Badge>
      <Badge variant="secondary">{isHuman ? "Human" : "Agent"}</Badge>
    </div>
  );
}

function ReviewHistoryTimeline({ review }: { review: ReviewRecord }) {
  const { members } = useWorkforceDirectory();
  const events = [...review.history].sort(
    (first, second) =>
      new Date(second.occurredAt).getTime() -
      new Date(first.occurredAt).getTime(),
  );

  return (
    <ol aria-label="Review submission and decision history" className="space-y-0">
      {events.map((event) => (
        <li
          key={event.id}
          className="relative flex gap-3 border-l border-border pb-5 pl-5 last:border-l-transparent last:pb-0"
        >
          <span className="absolute -left-1.25 top-1 size-2 rounded-full border border-background bg-primary" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{reviewEventLabels[event.type]}</Badge>
              <span className="text-metadata text-muted-foreground">
                {reviewPersonName(event.actor, members)}
              </span>
              <time
                dateTime={event.occurredAt}
                className="text-metadata text-muted-foreground"
              >
                {formatTaskTimestamp(event.occurredAt)}
              </time>
            </div>
            {event.feedback && (
              <p className="whitespace-pre-wrap text-body text-muted-foreground">
                {event.feedback}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

function ReviewDeliverableView({
  deliverable,
}: {
  deliverable: ReviewDeliverable;
}) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
          <h2 className="text-card-title font-medium leading-snug">
            {deliverable.title}
          </h2>
          <Badge variant="outline">{deliverableTypeLabels[deliverable.type]}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {deliverable.type === "attachment-placeholder" ? (
          <div className="space-y-2 rounded-md border border-dashed border-border p-4">
            <p className="break-all font-mono text-control">
              {deliverable.fileName || "Unnamed demonstration attachment"}
            </p>
            <p className="text-body text-muted-foreground">
              {deliverable.content || "No attachment description provided."}
            </p>
            <p className="text-metadata text-muted-foreground">
              Placeholder only. No file was uploaded or stored.
            </p>
          </div>
        ) : (
          <pre
            className={`overflow-x-auto whitespace-pre-wrap break-words rounded-md bg-muted/50 p-4 text-body ${
              deliverable.type === "structured-result"
                ? "font-mono text-metadata"
                : "font-sans"
            }`}
          >
            {deliverable.content}
          </pre>
        )}
      </CardContent>
    </Card>
  );
}

export {
  ReviewDeliverableView,
  ReviewHistoryTimeline,
  ReviewPerson,
  reviewPersonName,
};
