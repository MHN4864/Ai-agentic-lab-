import type {
  ProjectPriority,
  ProjectStatus,
  ProjectWorkStatus,
} from "./types";

const projectStatusLabels: Record<ProjectStatus, string> = {
  planning: "Planning",
  active: "Active",
  "on-hold": "On Hold",
  completed: "Completed",
};

const projectPriorityLabels: Record<ProjectPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

const workStatusLabels: Record<ProjectWorkStatus, string> = {
  open: "Open",
  "in-progress": "In progress",
  "awaiting-review": "Awaiting review",
  blocked: "Blocked",
  completed: "Completed",
};

export {
  projectPriorityLabels,
  projectStatusLabels,
  workStatusLabels,
};
