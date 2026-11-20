import type {
  DeliverableType,
  ReviewHistoryEventType,
  ReviewStatus,
  SubmittedReviewStatus,
} from "./types";

const reviewStatusLabels: Record<ReviewStatus, string> = {
  "not-submitted": "Not Submitted",
  "awaiting-review": "Awaiting Review",
  "in-review": "In Review",
  "changes-requested": "Changes Requested",
  approved: "Approved",
  rejected: "Rejected",
};

const deliverableTypeLabels: Record<DeliverableType, string> = {
  "text-summary": "Text summary",
  markdown: "Markdown content",
  "attachment-placeholder": "File attachment placeholder",
  "structured-result": "Structured result",
};

const reviewEventLabels: Record<ReviewHistoryEventType, string> = {
  submitted: "Submitted",
  "review-started": "Review started",
  approved: "Approved",
  "changes-requested": "Changes requested",
  rejected: "Rejected",
};

const submittedReviewStatuses: SubmittedReviewStatus[] = [
  "awaiting-review",
  "in-review",
  "changes-requested",
  "approved",
  "rejected",
];

export {
  deliverableTypeLabels,
  reviewEventLabels,
  reviewStatusLabels,
  submittedReviewStatuses,
};
