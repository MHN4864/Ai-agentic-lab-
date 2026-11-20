import {
  StatusBadge,
  type StatusTone,
} from "@/components/ui/status-badge";
import type { AgentExecutionState } from "./types";

const executionStatePresentation: Record<
  AgentExecutionState,
  { label: string; tone: StatusTone }
> = {
  running: { label: "Running", tone: "operational" },
  idle: { label: "Idle", tone: "neutral" },
  waiting: { label: "Waiting", tone: "attention" },
  blocked: { label: "Blocked", tone: "critical" },
  failed: { label: "Failed", tone: "critical" },
};

function AgentExecutionStateBadge({
  state,
}: {
  state: AgentExecutionState;
}) {
  const presentation = executionStatePresentation[state];

  return (
    <StatusBadge tone={presentation.tone} category="Execution state">
      {presentation.label}
    </StatusBadge>
  );
}

export { AgentExecutionStateBadge };
