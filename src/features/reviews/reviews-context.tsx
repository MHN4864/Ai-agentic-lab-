"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { agentDemoData } from "@/features/agents/demo-data";
import { useWorkforceDirectory } from "@/features/members/workforce-directory-context";
import type { WorkspaceMember } from "@/features/members/types";
import { useTasks } from "@/features/tasks/tasks-context";
import { reviewDemoData } from "./demo-data";
import type {
  CreateReviewValues,
  ReviewHistoryEvent,
  ReviewHistoryEventType,
  ReviewRecord,
} from "./types";

type ReviewDecision = Extract<
  ReviewHistoryEventType,
  "approved" | "changes-requested" | "rejected"
>;

type ReviewsContextValue = {
  reviews: ReviewRecord[];
  canSubmitForTask: (taskId: string) => boolean;
  createReview: (values: CreateReviewValues) => ReviewRecord | undefined;
  startReview: (reviewId: string) => ReviewRecord | undefined;
  decideReview: (
    reviewId: string,
    decision: ReviewDecision,
    feedback: string,
  ) => ReviewRecord | undefined;
};

const ReviewsContext = createContext<ReviewsContextValue | null>(null);

function getNextReviewNumber(reviews: ReviewRecord[]) {
  return (
    Math.max(
      1000,
      ...reviews.map((review) => Number(review.id.replace(/^REV-/, "")) || 0),
    ) + 1
  );
}

function isValidSubmitter(
  submitter: CreateReviewValues["submitter"],
  members: WorkspaceMember[],
) {
  return submitter.type === "human"
    ? members.some((member) => member.id === submitter.memberId)
    : agentDemoData.some((agent) => agent.id === submitter.agentId);
}

function isValidDeliverable(
  deliverable: CreateReviewValues["deliverable"],
) {
  if (!deliverable.title.trim()) {
    return false;
  }

  if (deliverable.type === "attachment-placeholder") {
    return Boolean(deliverable.fileName?.trim());
  }

  if (!deliverable.content.trim()) {
    return false;
  }

  if (deliverable.type !== "structured-result") {
    return true;
  }

  try {
    const value: unknown = JSON.parse(deliverable.content);
    return typeof value === "object" && value !== null;
  } catch {
    return false;
  }
}

function ReviewsProvider({ children }: { children: ReactNode }) {
  const { tasks, updateTaskFromReview } = useTasks();
  const { members } = useWorkforceDirectory();
  const [reviews, setReviews] = useState(reviewDemoData);
  const nextReviewNumber = useRef(getNextReviewNumber(reviewDemoData));

  const canSubmitForTask = useCallback(
    (taskId: string) => {
      const task = tasks.find((candidate) => candidate.id === taskId);
      if (!task || task.status === "completed" || task.status === "cancelled") {
        return false;
      }

      return !reviews.some(
        (review) =>
          review.taskId === taskId &&
          (review.status === "awaiting-review" ||
            review.status === "in-review"),
      );
    },
    [reviews, tasks],
  );

  const createReview = useCallback(
    (values: CreateReviewValues) => {
      const task = tasks.find((candidate) => candidate.id === values.taskId);
      const reviewer = members.find(
        (member) => member.id === values.reviewerMemberId,
      );
      const submitterIsReviewer =
        values.submitter.type === "human" &&
        values.submitter.memberId === values.reviewerMemberId;

      if (
        !task ||
        !reviewer ||
        submitterIsReviewer ||
        !isValidSubmitter(values.submitter, members) ||
        !isValidDeliverable(values.deliverable) ||
        !canSubmitForTask(values.taskId)
      ) {
        return undefined;
      }

      const submittedAt = new Date().toISOString();
      const id = `REV-${nextReviewNumber.current}`;
      const submittedEvent: ReviewHistoryEvent = {
        id: `${id}-E1`,
        type: "submitted",
        actor: values.submitter,
        occurredAt: submittedAt,
      };
      const review: ReviewRecord = {
        id,
        taskId: task.id,
        submitter: values.submitter,
        reviewerMemberId: reviewer.id,
        deliverable: values.deliverable,
        status: "awaiting-review",
        submittedAt,
        updatedAt: submittedAt,
        history: [submittedEvent],
      };

      const updatedTask = updateTaskFromReview(
        task.id,
        "in-review",
        "Deliverable submitted for human review",
      );
      if (!updatedTask) {
        return undefined;
      }

      nextReviewNumber.current += 1;
      setReviews((current) => [review, ...current]);
      return review;
    },
    [canSubmitForTask, members, tasks, updateTaskFromReview],
  );

  const startReview = useCallback(
    (reviewId: string) => {
      const existing = reviews.find((review) => review.id === reviewId);
      if (!existing || existing.status !== "awaiting-review") {
        return undefined;
      }

      const occurredAt = new Date().toISOString();
      const event: ReviewHistoryEvent = {
        id: `${reviewId}-E${existing.history.length + 1}`,
        type: "review-started",
        actor: { type: "human", memberId: existing.reviewerMemberId },
        occurredAt,
      };
      const updatedReview: ReviewRecord = {
        ...existing,
        status: "in-review",
        updatedAt: occurredAt,
        history: [...existing.history, event],
      };

      setReviews((current) =>
        current.map((review) =>
          review.id === reviewId ? updatedReview : review,
        ),
      );
      return updatedReview;
    },
    [reviews],
  );

  const decideReview = useCallback(
    (
      reviewId: string,
      decision: ReviewDecision,
      feedback: string,
    ) => {
      const existing = reviews.find((review) => review.id === reviewId);
      const normalizedFeedback = feedback.trim();
      if (
        !existing ||
        existing.status !== "in-review" ||
        ((decision === "changes-requested" || decision === "rejected") &&
          !normalizedFeedback)
      ) {
        return undefined;
      }

      const taskStatus =
        decision === "approved"
          ? "completed"
          : decision === "changes-requested" || decision === "rejected"
            ? "ready"
            : undefined;
      const taskSummary =
        decision === "approved"
          ? "Deliverable approved by a human reviewer; task marked Completed"
          : decision === "changes-requested"
            ? "Reviewer requested changes; task returned to Ready"
            : "Deliverable rejected by a human reviewer; task remains actionable";
      const updatedTask =
        taskStatus &&
        updateTaskFromReview(existing.taskId, taskStatus, taskSummary);
      if (!updatedTask) {
        return undefined;
      }

      const occurredAt = new Date().toISOString();
      const event: ReviewHistoryEvent = {
        id: `${reviewId}-E${existing.history.length + 1}`,
        type: decision,
        actor: { type: "human", memberId: existing.reviewerMemberId },
        occurredAt,
        ...(normalizedFeedback ? { feedback: normalizedFeedback } : {}),
      };
      const updatedReview: ReviewRecord = {
        ...existing,
        status: decision,
        updatedAt: occurredAt,
        history: [...existing.history, event],
      };

      setReviews((current) =>
        current.map((review) =>
          review.id === reviewId ? updatedReview : review,
        ),
      );
      return updatedReview;
    },
    [reviews, updateTaskFromReview],
  );

  const value = useMemo(
    () => ({
      reviews,
      canSubmitForTask,
      createReview,
      startReview,
      decideReview,
    }),
    [reviews, canSubmitForTask, createReview, startReview, decideReview],
  );

  return (
    <ReviewsContext.Provider value={value}>{children}</ReviewsContext.Provider>
  );
}

function useReviews() {
  const context = useContext(ReviewsContext);

  if (!context) {
    throw new Error("useReviews must be used within a ReviewsProvider.");
  }

  return context;
}

export { ReviewsProvider, useReviews };
export type { ReviewDecision };
