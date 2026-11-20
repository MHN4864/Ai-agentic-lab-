import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";
import { executionStatusLabels } from "./labels";
import type { ExecutionStatus } from "./types";

const executionStatusTones: Record<ExecutionStatus, StatusTone> = {
  queued: "attention",
  starting: "attention",
  running: "operational",
  waiting: "attention",
  completed: "operational",
  failed: "critical",
  cancelled: "neutral",
  "timed-out": "critical",
};

function ExecutionStatusBadge({ status }: { status: ExecutionStatus }) {
  return (
    <StatusBadge
      tone={executionStatusTones[status]}
      category="Execution status"
    >
      {executionStatusLabels[status]}
    </StatusBadge>
  );
}

export { ExecutionStatusBadge };
