import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusTone = "operational" | "attention" | "critical" | "neutral";

type StatusBadgeProps = {
  children: ReactNode;
  tone: StatusTone;
  className?: string;
  category?: string;
};

const toneStyles: Record<StatusTone, string> = {
  operational: "bg-success/10 text-success",
  attention: "bg-warning/15 text-warning-foreground",
  critical: "bg-error/10 text-error",
  neutral: "bg-muted text-muted-foreground",
};

function StatusBadge({ children, tone, className, category }: StatusBadgeProps) {
  const label = typeof children === "string" ? children : undefined;

  return (
    <Badge
      variant="secondary"
      aria-label={category && label ? `${category}: ${label}` : undefined}
      className={cn(
        "h-6 gap-1.5 rounded-md border-0 px-2 text-metadata font-medium",
        toneStyles[tone],
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          tone === "operational" && "bg-success",
          tone === "attention" && "bg-warning",
          tone === "critical" && "bg-error",
          tone === "neutral" && "bg-muted-foreground",
        )}
      />
      {children}
    </Badge>
  );
}

const connectionStatusTones = {
  connected: "operational",
  degraded: "attention",
  disconnected: "critical",
  "not-configured": "neutral",
} as const satisfies Record<string, StatusTone>;

type ConnectionStatus = keyof typeof connectionStatusTones;

function ConnectionStatusBadge({ status }: { status: ConnectionStatus }) {
  const labels: Record<ConnectionStatus, string> = {
    connected: "Connected",
    degraded: "Degraded",
    disconnected: "Disconnected",
    "not-configured": "Not configured",
  };

  return (
    <StatusBadge tone={connectionStatusTones[status]} category="Connection">
      {labels[status]}
    </StatusBadge>
  );
}

const executionStatusTones = {
  running: "operational",
  completed: "operational",
  waiting: "attention",
  pending: "attention",
  "needs-review": "attention",
  failed: "critical",
  blocked: "critical",
  rejected: "critical",
} as const satisfies Record<string, StatusTone>;

type ExecutionStatus = keyof typeof executionStatusTones;

function ExecutionStatusBadge({ status }: { status: ExecutionStatus }) {
  const labels: Record<ExecutionStatus, string> = {
    running: "Running",
    completed: "Completed",
    waiting: "Waiting",
    pending: "Pending",
    "needs-review": "Needs review",
    failed: "Failed",
    blocked: "Blocked",
    rejected: "Rejected",
  };

  return (
    <StatusBadge tone={executionStatusTones[status]} category="Execution">
      {labels[status]}
    </StatusBadge>
  );
}

const availabilityStatusTones = {
  available: "operational",
  busy: "attention",
  unavailable: "neutral",
  active: "operational",
  idle: "neutral",
  draft: "neutral",
  archived: "neutral",
} as const satisfies Record<string, StatusTone>;

type AvailabilityStatus = keyof typeof availabilityStatusTones;

function AvailabilityStatusBadge({ status }: { status: AvailabilityStatus }) {
  const labels: Record<AvailabilityStatus, string> = {
    available: "Available",
    busy: "Busy",
    unavailable: "Unavailable",
    active: "Active",
    idle: "Idle",
    draft: "Draft",
    archived: "Archived",
  };

  return (
    <StatusBadge tone={availabilityStatusTones[status]} category="Availability">
      {labels[status]}
    </StatusBadge>
  );
}

export {
  AvailabilityStatusBadge,
  ConnectionStatusBadge,
  ExecutionStatusBadge,
  StatusBadge,
};
export type {
  AvailabilityStatus,
  ConnectionStatus,
  ExecutionStatus,
  StatusBadgeProps,
  StatusTone,
};
