"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bot, CircleAlert, UserRound } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { agentDemoData } from "@/features/agents/demo-data";
import { useWorkforceDirectory } from "@/features/members/workforce-directory-context";
import { ReviewStatusBadge } from "./review-badges";
import { ReviewPerson } from "./review-components";
import {
  deliverableTypeLabels,
  reviewStatusLabels,
} from "./labels";
import { useReviews } from "./reviews-context";
import type {
  DeliverableType,
  ReviewDeliverable,
  ReviewRecord,
} from "./types";
import type { TaskAssignee, TaskRecord } from "@/features/tasks/types";
import { formatTaskTimestamp } from "@/features/tasks/task-utils";

function assigneeValue(assignee: TaskAssignee) {
  return assignee.type === "human"
    ? `human:${assignee.memberId}`
    : `agent:${assignee.agentId}`;
}

function parseAssignee(
  value: string,
  memberIds: string[],
): TaskAssignee | undefined {
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

function initialSubmitter(
  task: TaskRecord,
  members: ReturnType<typeof useWorkforceDirectory>["members"],
): TaskAssignee {
  if (task.assignment.primaryAssignee) {
    return task.assignment.primaryAssignee;
  }

  const member =
    members.find((candidate) => candidate.id === "member-maya-chen") ??
    members[0];
  return member
    ? { type: "human", memberId: member.id }
    : { type: "human", memberId: "" };
}

function reviewerOptions(
  submitter: TaskAssignee,
  members: ReturnType<typeof useWorkforceDirectory>["members"],
) {
  return members.filter(
    (member) =>
      submitter.type !== "human" || member.id !== submitter.memberId,
  );
}

function isDeliverableType(value: string): value is DeliverableType {
  return Object.prototype.hasOwnProperty.call(deliverableTypeLabels, value);
}

function latestReviewForTask(
  reviews: ReviewRecord[],
  taskId: string,
) {
  return reviews
    .filter((review) => review.taskId === taskId)
    .sort(
      (first, second) =>
        new Date(second.submittedAt).getTime() -
        new Date(first.submittedAt).getTime(),
    );
}

function TaskDeliverableSection({ task }: { task: TaskRecord }) {
  const router = useRouter();
  const { members } = useWorkforceDirectory();
  const { reviews, canSubmitForTask, createReview } = useReviews();
  const taskReviews = latestReviewForTask(reviews, task.id);
  const latestReview = taskReviews[0];
  const initialAssignee = initialSubmitter(task, members);
  const initialReviewer = reviewerOptions(initialAssignee, members)[0]?.id ?? "";
  const [submitter, setSubmitter] = useState<TaskAssignee>(initialAssignee);
  const [reviewerMemberId, setReviewerMemberId] =
    useState(initialReviewer);
  const [deliverableType, setDeliverableType] =
    useState<DeliverableType>("text-summary");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canSubmit = canSubmitForTask(task.id);

  function handleSubmitterChange(value: string) {
    const nextSubmitter = parseAssignee(
      value,
      members.map((member) => member.id),
    );
    if (!nextSubmitter) {
      setError("Choose an available human or agent submitter.");
      return;
    }

    setSubmitter(nextSubmitter);
    const allowedReviewers = reviewerOptions(nextSubmitter, members);
    if (!allowedReviewers.some((member) => member.id === reviewerMemberId)) {
      setReviewerMemberId(allowedReviewers[0]?.id ?? "");
    }
    setError("");
  }

  function getDeliverable(): ReviewDeliverable {
    return {
      type: deliverableType,
      title: title.trim(),
      content: content.trim(),
      ...(deliverableType === "attachment-placeholder"
        ? { fileName: fileName.trim() }
        : {}),
    };
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    const deliverable = getDeliverable();
    if (!deliverable.title) {
      setError("Enter a title for this deliverable.");
      return;
    }
    if (
      deliverable.type === "attachment-placeholder" &&
      !deliverable.fileName
    ) {
      setError("Enter a filename for the attachment placeholder.");
      return;
    }
    if (
      deliverable.type !== "attachment-placeholder" &&
      !deliverable.content
    ) {
      setError("Add content before submitting this deliverable.");
      return;
    }
    if (deliverable.type === "structured-result") {
      try {
        const parsed: unknown = JSON.parse(deliverable.content);
        if (typeof parsed !== "object" || parsed === null) {
          setError("Enter a JSON object or array for the structured result.");
          return;
        }
      } catch {
        setError("Enter valid JSON for the structured result.");
        return;
      }
    }
    if (
      submitter.type === "human" &&
      submitter.memberId === reviewerMemberId
    ) {
      setError("Choose a reviewer different from the human submitter.");
      return;
    }
    if (!reviewerMemberId) {
      setError("Choose a human reviewer for this submission.");
      return;
    }

    setIsSubmitting(true);
    const review = createReview({
      taskId: task.id,
      submitter,
      reviewerMemberId,
      deliverable,
    });

    if (!review) {
      setIsSubmitting(false);
      setError(
        "This task cannot accept a submission right now. Check its current review and task status.",
      );
      return;
    }

    router.push(`/reviews/${review.id}`);
  }

  const blockedReason =
    task.status === "completed" || task.status === "cancelled"
      ? `This task is ${task.status}; reopen it before submitting another deliverable.`
      : latestReview &&
          (latestReview.status === "awaiting-review" ||
            latestReview.status === "in-review")
        ? "Resolve the active review before submitting another version."
        : "";

  return (
    <Card className="min-w-0">
      <CardHeader>
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-card-title font-medium leading-snug">
              Deliverables
            </h2>
            <p className="text-body text-muted-foreground">
              Submission, review approval, and task completion are represented
              as separate outcomes.
            </p>
          </div>
          <ReviewStatusBadge
            status={latestReview?.status ?? "not-submitted"}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <Alert variant="info">
          <CircleAlert aria-hidden="true" />
          <AlertDescription>
            Deliverables, reviewer assignment, and decisions are demonstration
            data kept in workspace memory. No file is uploaded or stored.
          </AlertDescription>
        </Alert>

        {latestReview && (
          <div className="space-y-3 rounded-md border border-border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-control font-medium">Latest submission</p>
              <Badge variant="outline">
                {reviewStatusLabels[latestReview.status]}
              </Badge>
            </div>
            <p className="font-medium">{latestReview.deliverable.title}</p>
            <p className="text-metadata text-muted-foreground">
              {deliverableTypeLabels[latestReview.deliverable.type]} ·{" "}
              {formatTaskTimestamp(latestReview.submittedAt)}
            </p>
            <div className="grid min-w-0 gap-3 md:grid-cols-2">
              <div>
                <p className="mb-1 text-metadata text-muted-foreground">
                  Submitted by
                </p>
                <ReviewPerson
                  person={latestReview.submitter}
                  role="Submitter"
                />
              </div>
              <div>
                <p className="mb-1 text-metadata text-muted-foreground">
                  Reviewer responsible
                </p>
                <ReviewPerson
                  person={{
                    type: "human",
                    memberId: latestReview.reviewerMemberId,
                  }}
                  role="Reviewer"
                />
              </div>
            </div>
            <Link
              href={`/reviews/${latestReview.id}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Open review {latestReview.id}
            </Link>
          </div>
        )}

        {taskReviews.length > 1 && (
          <section aria-labelledby="task-submission-history-title">
            <h3
              id="task-submission-history-title"
              className="mb-2 text-control font-medium"
            >
              Submission history
            </h3>
            <ul className="space-y-2">
              {taskReviews.slice(1).map((review) => (
                <li
                  key={review.id}
                  className="flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3"
                >
                  <div className="min-w-0">
                    <p className="break-words font-medium">
                      {review.deliverable.title}
                    </p>
                    <p className="text-metadata text-muted-foreground">
                      {review.id} · {formatTaskTimestamp(review.submittedAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <ReviewStatusBadge status={review.status} />
                    <Link
                      href={`/reviews/${review.id}`}
                      className={buttonVariants({
                        variant: "ghost",
                        size: "sm",
                      })}
                    >
                      View
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {canSubmit ? (
          <form onSubmit={handleSubmit} className="space-y-4 border-t border-border pt-5">
            <div>
              <h3 className="text-control font-medium">
                Submit a demonstration deliverable
              </h3>
              <p className="mt-1 text-metadata text-muted-foreground">
                A human reviewer must be different from a human submitter.
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <CircleAlert aria-hidden="true" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid min-w-0 gap-4 md:grid-cols-2">
              <div className="min-w-0 space-y-1.5">
                <Label htmlFor={`deliverable-submitter-${task.id}`}>
                  Submitted by
                </Label>
                <select
                  id={`deliverable-submitter-${task.id}`}
                  value={assigneeValue(submitter)}
                  onChange={(event) => handleSubmitterChange(event.target.value)}
                  className="h-9 w-full min-w-0 rounded-md border border-input bg-surface px-3 text-control text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                >
                  <optgroup label="Humans">
                    {members.map((member) => (
                      <option
                        key={member.id}
                        value={`human:${member.id}`}
                      >
                        {member.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Agents">
                    {agentDemoData.map((agent) => (
                      <option key={agent.id} value={`agent:${agent.id}`}>
                        {agent.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div className="min-w-0 space-y-1.5">
                <Label htmlFor={`deliverable-reviewer-${task.id}`}>
                  Human reviewer
                </Label>
                <select
                  id={`deliverable-reviewer-${task.id}`}
                  value={reviewerMemberId}
                  onChange={(event) => {
                    setReviewerMemberId(event.target.value);
                    setError("");
                  }}
                  className="h-9 w-full min-w-0 rounded-md border border-input bg-surface px-3 text-control text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                >
                  {reviewerOptions(submitter, members).map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid min-w-0 gap-4 md:grid-cols-2">
              <div className="min-w-0 space-y-1.5">
                <Label htmlFor={`deliverable-type-${task.id}`}>
                  Deliverable type
                </Label>
                <select
                  id={`deliverable-type-${task.id}`}
                  value={deliverableType}
                  onChange={(event) => {
                    if (isDeliverableType(event.target.value)) {
                      setDeliverableType(event.target.value);
                    }
                    setError("");
                  }}
                  className="h-9 w-full min-w-0 rounded-md border border-input bg-surface px-3 text-control text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                >
                  {Object.entries(deliverableTypeLabels).map(
                    ([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ),
                  )}
                </select>
              </div>
              <div className="min-w-0 space-y-1.5">
                <Label htmlFor={`deliverable-title-${task.id}`}>
                  Deliverable title
                </Label>
                <Input
                  id={`deliverable-title-${task.id}`}
                  value={title}
                  onChange={(event) => {
                    setTitle(event.target.value);
                    setError("");
                  }}
                  placeholder="Summary of the submitted work"
                />
              </div>
            </div>

            {deliverableType === "attachment-placeholder" && (
              <div className="space-y-1.5">
                <Label htmlFor={`deliverable-file-name-${task.id}`}>
                  Filename placeholder
                </Label>
                <Input
                  id={`deliverable-file-name-${task.id}`}
                  value={fileName}
                  onChange={(event) => {
                    setFileName(event.target.value);
                    setError("");
                  }}
                  placeholder="example-report.pdf"
                />
                <p className="text-metadata text-muted-foreground">
                  Demonstration only; this does not select or upload a file.
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor={`deliverable-content-${task.id}`}>
                {deliverableType === "structured-result"
                  ? "Structured content (JSON)"
                  : deliverableType === "attachment-placeholder"
                    ? "Attachment description (optional)"
                    : deliverableType === "markdown"
                      ? "Markdown content"
                      : "Summary"}
              </Label>
              <Textarea
                id={`deliverable-content-${task.id}`}
                value={content}
                onChange={(event) => {
                  setContent(event.target.value);
                  setError("");
                }}
                rows={5}
                placeholder={
                  deliverableType === "structured-result"
                    ? '{ "result": "example" }'
                    : "Enter demonstration deliverable content"
                }
              />
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="submit" disabled={isSubmitting}>
                <UserRound aria-hidden="true" />
                Submit for human review
              </Button>
            </div>
          </form>
        ) : (
          <Alert variant="warning">
            <Bot aria-hidden="true" />
            <AlertDescription>
              {blockedReason ||
                "This task already has an active submission. Review it before submitting another version."}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

export { TaskDeliverableSection };
