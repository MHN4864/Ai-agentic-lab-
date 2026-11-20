import { StatusBadge } from "@/components/ui/status-badge";
import { reviewStatusLabels } from "./labels";
import type { ReviewStatus } from "./types";

const reviewStatusTones = {
  "not-submitted": "neutral",
  "awaiting-review": "attention",
  "in-review": "attention",
  "changes-requested": "attention",
  approved: "operational",
  rejected: "critical",
} as const;

function ReviewStatusBadge({ status }: { status: ReviewStatus }) {
  return (
    <StatusBadge tone={reviewStatusTones[status]} category="Review status">
      {reviewStatusLabels[status]}
    </StatusBadge>
  );
}

export { ReviewStatusBadge };
