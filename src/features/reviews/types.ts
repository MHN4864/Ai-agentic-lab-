import type { TaskAssignee } from "@/features/tasks/types";

export type ReviewStatus =
  | "not-submitted"
  | "awaiting-review"
  | "in-review"
  | "changes-requested"
  | "approved"
  | "rejected";

export type SubmittedReviewStatus = Exclude<ReviewStatus, "not-submitted">;

export type DeliverableType =
  | "text-summary"
  | "markdown"
  | "attachment-placeholder"
  | "structured-result";

export type ReviewDeliverable = {
  type: DeliverableType;
  title: string;
  content: string;
  fileName?: string;
};

export type ReviewHistoryEventType =
  | "submitted"
  | "review-started"
  | "approved"
  | "changes-requested"
  | "rejected";

export type ReviewHistoryEvent = {
  id: string;
  type: ReviewHistoryEventType;
  actor: TaskAssignee;
  occurredAt: string;
  feedback?: string;
};

export type ReviewRecord = {
  id: string;
  taskId: string;
  submitter: TaskAssignee;
  reviewerMemberId: string;
  deliverable: ReviewDeliverable;
  status: SubmittedReviewStatus;
  submittedAt: string;
  updatedAt: string;
  history: ReviewHistoryEvent[];
};

export type CreateReviewValues = {
  taskId: string;
  submitter: TaskAssignee;
  reviewerMemberId: string;
  deliverable: ReviewDeliverable;
};
