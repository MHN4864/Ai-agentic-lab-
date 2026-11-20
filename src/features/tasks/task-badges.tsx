import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { taskStatusLabels, taskTypeLabels } from "./labels";
import type { TaskStatus, TaskType } from "./types";

const taskStatusTones = {
  backlog: "neutral",
  ready: "operational",
  "in-progress": "operational",
  waiting: "attention",
  blocked: "critical",
  "in-review": "attention",
  completed: "operational",
  cancelled: "neutral",
} as const;

function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return (
    <StatusBadge tone={taskStatusTones[status]} category="Task status">
      {taskStatusLabels[status]}
    </StatusBadge>
  );
}

function TaskTypeBadge({ taskType }: { taskType: TaskType }) {
  return <Badge variant="outline">{taskTypeLabels[taskType]}</Badge>;
}

function AssigneeTypeBadge({ type }: { type: "human" | "agent" }) {
  return (
    <Badge variant="secondary" className="font-normal">
      {type === "human" ? "Human" : "Agent"}
    </Badge>
  );
}

export { AssigneeTypeBadge, TaskStatusBadge, TaskTypeBadge };
