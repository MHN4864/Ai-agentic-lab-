import { StatusBadge } from "@/components/ui/status-badge";
import type {
  ProjectPriority,
  ProjectStatus,
  ProjectWorkStatus,
} from "./types";
import {
  projectPriorityLabels,
  projectStatusLabels,
  workStatusLabels,
} from "./project-labels";

const projectStatusTones = {
  planning: "neutral",
  active: "operational",
  "on-hold": "attention",
  completed: "neutral",
} as const;

const projectPriorityTones = {
  low: "neutral",
  medium: "neutral",
  high: "attention",
  critical: "critical",
} as const;

const workStatusTones = {
  open: "neutral",
  "in-progress": "operational",
  "awaiting-review": "attention",
  blocked: "critical",
  completed: "operational",
} as const;

function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <StatusBadge tone={projectStatusTones[status]} category="Project status">
      {projectStatusLabels[status]}
    </StatusBadge>
  );
}

function ProjectPriorityBadge({
  priority,
  category = "Project priority",
}: {
  priority: ProjectPriority;
  category?: string;
}) {
  return (
    <StatusBadge
      tone={projectPriorityTones[priority]}
      category={category}
    >
      {projectPriorityLabels[priority]}
    </StatusBadge>
  );
}

function WorkStatusBadge({ status }: { status: ProjectWorkStatus }) {
  return (
    <StatusBadge tone={workStatusTones[status]} category="Work item status">
      {workStatusLabels[status]}
    </StatusBadge>
  );
}

export {
  ProjectPriorityBadge,
  ProjectStatusBadge,
  WorkStatusBadge,
};
