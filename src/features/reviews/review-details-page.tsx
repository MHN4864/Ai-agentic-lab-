"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CircleAlert,
  MessageSquareText,
  UserCheck,
} from "lucide-react";
import { PageHeader } from "@/components/layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ProjectPriorityBadge } from "@/features/projects/project-badges";
import { useProjects } from "@/features/projects/projects-context";
import { useWorkforceDirectory } from "@/features/members/workforce-directory-context";
import { TaskStatusBadge } from "@/features/tasks/task-badges";
import { taskAssigneeLabel, formatTaskTimestamp } from "@/features/tasks/task-utils";
import { useTasks } from "@/features/tasks/tasks-context";
import { useReviews, type ReviewDecision } from "./reviews-context";
import { ReviewStatusBadge } from "./review-badges";
import {
  ReviewDeliverableView,
  ReviewHistoryTimeline,
  ReviewPerson,
} from "./review-components";
import { reviewStatusLabels } from "./labels";
import type { ReviewRecord } from "./types";

function ReviewNotFound() {
  return (
    <EmptyState
      title="Review not found"
      description="This review is not available in the current demonstration workspace."
      icon={CircleAlert}
      action={
        <Link href="/reviews" className={buttonVariants({ variant: "outline" })}>
          <ArrowLeft aria-hidden="true" />
          Back to Reviews
        </Link>
      }
    />
  );
}

function ReviewDecisionActions({
  review,
  feedback,
  onFeedbackChange,
  onStart,
  onDecision,
}: {
  review: ReviewRecord;
  feedback: string;
  onFeedbackChange: (value: string) => void;
  onStart: () => void;
  onDecision: (decision: ReviewDecision) => void;
}) {
  if (review.status === "awaiting-review") {
    return (
      <div className="space-y-3">
        <p className="text-body text-muted-foreground">
          The assigned human reviewer can start this review.
        </p>
        <Button type="button" onClick={onStart}>
          <UserCheck aria-hidden="true" />
          Start Review
        </Button>
      </div>
    );
  }

  if (review.status !== "in-review") {
    return (
      <p className="text-body text-muted-foreground">
        This submission has a recorded {reviewStatusLabels[review.status].toLowerCase()} outcome.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor={`review-feedback-${review.id}`}>
          Reviewer comments
        </Label>
        <Textarea
          id={`review-feedback-${review.id}`}
          value={feedback}
          onChange={(event) => onFeedbackChange(event.target.value)}
          rows={4}
          placeholder="Add feedback for the submitter"
        />
        <p className="text-metadata text-muted-foreground">
          Comments are required to request changes or reject. Approval comments
          are optional.
        </p>
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
        <Button
          type="button"
          variant="destructive"
          onClick={() => onDecision("rejected")}
        >
          Reject
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => onDecision("changes-requested")}
        >
          Request Changes
        </Button>
        <Button type="button" onClick={() => onDecision("approved")}>
          Approve
        </Button>
      </div>
    </div>
  );
}

function ReviewDetailsPage({ reviewId }: { reviewId: string }) {
  const { reviews, startReview, decideReview } = useReviews();
  const { tasks } = useTasks();
  const { projects } = useProjects();
  const { members } = useWorkforceDirectory();
  const [actionError, setActionError] = useState("");
  const [feedback, setFeedback] = useState("");
  const review = reviews.find((candidate) => candidate.id === reviewId);

  if (!review) {
    return <ReviewNotFound />;
  }
  const currentReview = review;

  const task = tasks.find((candidate) => candidate.id === review.taskId);
  const project = task
    ? projects.find((candidate) => candidate.id === task.projectId)
    : undefined;
  const reviewer = {
    type: "human" as const,
    memberId: review.reviewerMemberId,
  };
  const previousReviews = reviews
    .filter(
      (candidate) =>
        candidate.taskId === review.taskId &&
        candidate.id !== review.id,
    )
    .sort(
      (first, second) =>
        new Date(second.submittedAt).getTime() -
        new Date(first.submittedAt).getTime(),
    );
  const previousFeedback = previousReviews.flatMap((previousReview) =>
    previousReview.history
      .filter((event) => event.feedback)
      .map((event) => ({
        review: previousReview,
        event,
      })),
  );

  if (!task) {
    return <ReviewNotFound />;
  }

  function handleStart() {
    const updatedReview = startReview(currentReview.id);
    if (!updatedReview) {
      setActionError("This review is no longer waiting to be started.");
    } else {
      setActionError("");
    }
  }

  function handleDecision(decision: ReviewDecision) {
    if (
      (decision === "changes-requested" || decision === "rejected") &&
      !feedback.trim()
    ) {
      setActionError(
        decision === "rejected"
          ? "Add a reason before rejecting this deliverable."
          : "Add feedback describing the requested changes.",
      );
      return;
    }

    const updatedReview = decideReview(
      currentReview.id,
      decision,
      feedback,
    );
    if (!updatedReview) {
      setActionError(
        "This decision could not be recorded. Confirm the review is in progress and include required feedback.",
      );
    } else {
      setActionError("");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Deliverable review"
        description={`${review.id} · ${review.deliverable.title}`}
        actions={
          <Link
            href="/reviews"
            className={buttonVariants({ variant: "outline" })}
          >
            <ArrowLeft aria-hidden="true" />
            Back to Reviews
          </Link>
        }
      />

      <Alert variant="info">
        <CircleAlert aria-hidden="true" />
        <AlertDescription>
          Human review is a frontend demonstration. Actions are attributed to
          the designated reviewer; no authorization or agent execution is
          enforced.
        </AlertDescription>
      </Alert>

      <div className="flex flex-wrap items-center gap-2">
        <ReviewStatusBadge status={review.status} />
        <TaskStatusBadge status={task.status} />
        <ProjectPriorityBadge
          priority={task.priority}
          category="Task priority"
        />
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(18rem,1fr)]">
        <div className="min-w-0 space-y-4">
          <Card className="min-w-0">
            <CardHeader>
              <h2 className="text-card-title font-medium leading-snug">
                Review context
              </h2>
            </CardHeader>
            <CardContent className="grid min-w-0 gap-4 sm:grid-cols-2">
              <div className="min-w-0">
                <p className="text-metadata text-muted-foreground">Task</p>
                <Link
                  href={`/tasks/${task.id}`}
                  className="mt-1 inline-flex font-medium text-primary underline-offset-4 hover:underline"
                >
                  {task.title}
                </Link>
                <p className="mt-1 font-mono text-metadata text-muted-foreground">
                  {task.id}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-metadata text-muted-foreground">Project</p>
                {project ? (
                  <Link
                    href={`/projects/${project.id}`}
                    className="mt-1 inline-flex font-medium text-primary underline-offset-4 hover:underline"
                  >
                    {project.name}
                  </Link>
                ) : (
                  <p className="mt-1 text-body text-muted-foreground">
                    Project not available
                  </p>
                )}
              </div>
              <div className="min-w-0">
                <p className="mb-1 text-metadata text-muted-foreground">
                  Submitted by
                </p>
                <ReviewPerson person={review.submitter} role="Submitter" />
              </div>
              <div className="min-w-0">
                <p className="mb-1 text-metadata text-muted-foreground">
                  Reviewer responsible
                </p>
                <ReviewPerson person={reviewer} role="Human reviewer" />
              </div>
              <div>
                <p className="text-metadata text-muted-foreground">
                  Submitted
                </p>
                <p className="mt-1 text-body">
                  {formatTaskTimestamp(review.submittedAt)}
                </p>
              </div>
              <div>
                <p className="text-metadata text-muted-foreground">
                  Current task status
                </p>
                <p className="mt-1 text-body">
                  Task status is tracked separately from this review outcome.
                </p>
              </div>
            </CardContent>
          </Card>

          <ReviewDeliverableView deliverable={review.deliverable} />

          <Card className="min-w-0">
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <MessageSquareText
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <h2 className="text-card-title font-medium leading-snug">
                  Previous feedback
                </h2>
              </div>
            </CardHeader>
            <CardContent>
              {previousFeedback.length ? (
                <ul className="space-y-3">
                  {previousFeedback.map(({ review: previousReview, event }) => (
                    <li
                      key={event.id}
                      className="space-y-2 rounded-md border border-border p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Link
                          href={`/reviews/${previousReview.id}`}
                          className="font-medium text-primary underline-offset-4 hover:underline"
                        >
                          {previousReview.id} ·{" "}
                          {previousReview.deliverable.title}
                        </Link>
                        <time className="text-metadata text-muted-foreground">
                          {formatTaskTimestamp(event.occurredAt)}
                        </time>
                      </div>
                      <p className="whitespace-pre-wrap text-body text-muted-foreground">
                        {event.feedback}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-body text-muted-foreground">
                  No feedback from previous submissions is recorded for this
                  task.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="min-w-0 space-y-4">
          <Card className="min-w-0">
            <CardHeader>
              <h2 className="text-card-title font-medium leading-snug">
                Review responsibility
              </h2>
              <p className="text-body text-muted-foreground">
                Only a human member is designated as reviewer in this demo.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ReviewPerson person={reviewer} role="Reviewer" />
              {task.assignment.primaryAssignee && (
                <div className="space-y-1">
                  <p className="text-metadata text-muted-foreground">
                    Current task assignee
                  </p>
                  <p className="text-body">
                    {taskAssigneeLabel(task.assignment.primaryAssignee, members)}
                  </p>
                </div>
              )}
              <p className="text-metadata text-muted-foreground">
                The reviewer is separate from the submitter. The interface does
                not enforce real permissions.
              </p>
            </CardContent>
          </Card>

          <Card className="min-w-0">
            <CardHeader>
              <h2 className="text-card-title font-medium leading-snug">
                Review decision
              </h2>
              <p className="text-body text-muted-foreground">
                Review outcome and task status remain separate records.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {actionError && (
                <Alert variant="destructive">
                  <CircleAlert aria-hidden="true" />
                  <AlertDescription>{actionError}</AlertDescription>
                </Alert>
              )}
              <ReviewDecisionActions
                review={review}
                feedback={feedback}
                onFeedbackChange={(value) => {
                  setFeedback(value);
                  setActionError("");
                }}
                onStart={handleStart}
                onDecision={handleDecision}
              />
              {review.status === "approved" && (
                <Alert variant="success">
                  <AlertDescription>
                    This deliverable was approved by a human reviewer. The task
                    is marked Completed; approval remains visible as a separate
                    review outcome.
                  </AlertDescription>
                </Alert>
              )}
              {(review.status === "changes-requested" ||
                review.status === "rejected") && (
                <Alert variant="warning">
                  <AlertDescription>
                    {review.status === "rejected"
                      ? "This submission was rejected. The task remains actionable and was not cancelled or marked failed."
                      : "Changes were requested. The task was returned to Ready for more work."}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card className="min-w-0">
            <CardHeader>
              <h2 className="text-card-title font-medium leading-snug">
                Submission history
              </h2>
              <p className="text-body text-muted-foreground">
                Status changes and human decisions are shown chronologically.
              </p>
            </CardHeader>
            <CardContent>
              <ReviewHistoryTimeline review={review} />
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

export { ReviewDetailsPage };
