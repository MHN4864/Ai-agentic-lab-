import { agentDemoData } from "@/features/agents/demo-data";
import type { WorkspaceMember } from "@/features/members/types";
import type {
  TaskActivityActor,
  TaskAssignee,
  TaskRecord,
} from "./types";

type TaskSortKey =
  | "title"
  | "project"
  | "status"
  | "priority"
  | "assignee"
  | "collaborators"
  | "taskType"
  | "dueDate"
  | "updatedAt";

const taskStatusOrder = [
  "backlog",
  "ready",
  "in-progress",
  "waiting",
  "blocked",
  "in-review",
  "completed",
  "cancelled",
] as const;

const taskPriorityOrder = ["low", "medium", "high", "critical"] as const;

function formatTaskDate(value?: string) {
  if (!value) {
    return "Not set";
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return "Not reported";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatTaskTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not reported";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(date);
}

function taskAssigneeLabel(
  assignee: TaskAssignee | null,
  members: WorkspaceMember[],
) {
  if (!assignee) {
    return "Unassigned";
  }

  if (assignee.type === "human") {
    return (
      members.find((member) => member.id === assignee.memberId)?.name ??
      "Member not available"
    );
  }

  return (
    agentDemoData.find((agent) => agent.id === assignee.agentId)?.name ??
    "Agent not available"
  );
}

function taskActivityActorLabel(
  actor: TaskActivityActor,
  members: WorkspaceMember[],
) {
  if (actor.type === "system") {
    return actor.label;
  }

  if (actor.type === "human") {
    return (
      members.find((member) => member.id === actor.memberId)?.name ??
      "Member not available"
    );
  }

  return (
    agentDemoData.find((agent) => agent.id === actor.agentId)?.name ??
    "Agent not available"
  );
}

function taskSortValue(
  task: TaskRecord,
  key: TaskSortKey,
  relatedNames: {
    projectName: string;
    assigneeName: string;
  },
) {
  switch (key) {
    case "title":
      return task.title;
    case "project":
      return relatedNames.projectName;
    case "status":
      return taskStatusOrder.indexOf(task.status);
    case "priority":
      return taskPriorityOrder.indexOf(task.priority);
    case "assignee":
      return relatedNames.assigneeName;
    case "collaborators":
      return task.assignment.collaborators.length;
    case "taskType":
      return task.taskType;
    case "dueDate":
      return task.dueDate ?? "";
    case "updatedAt":
      return task.updatedAt;
    default:
      return task.id;
  }
}

function compareTaskValues(first: string | number, second: string | number) {
  if (typeof first === "number" && typeof second === "number") {
    return first - second;
  }

  const firstText = String(first);
  const secondText = String(second);
  if (!firstText || !secondText) {
    return firstText ? -1 : secondText ? 1 : 0;
  }

  return new Intl.Collator("en", {
    numeric: true,
    sensitivity: "base",
  }).compare(firstText, secondText);
}

function sortTasks(
  first: TaskRecord,
  second: TaskRecord,
  key: TaskSortKey,
  direction: "asc" | "desc",
  getRelatedNames: (task: TaskRecord) => {
    projectName: string;
    assigneeName: string;
  },
) {
  const firstValue = taskSortValue(first, key, getRelatedNames(first));
  const secondValue = taskSortValue(second, key, getRelatedNames(second));
  const comparison = compareTaskValues(firstValue, secondValue);
  return comparison * (direction === "asc" ? 1 : -1);
}

export {
  compareTaskValues,
  formatTaskDate,
  formatTaskTimestamp,
  sortTasks,
  taskActivityActorLabel,
  taskAssigneeLabel,
};
export type { TaskSortKey };
