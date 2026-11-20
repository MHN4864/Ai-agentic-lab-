import type { TaskStatus, TaskType } from "./types";

const taskStatusLabels: Record<TaskStatus, string> = {
  backlog: "Backlog",
  ready: "Ready",
  "in-progress": "In Progress",
  waiting: "Waiting",
  blocked: "Blocked",
  "in-review": "In Review",
  completed: "Completed",
  cancelled: "Cancelled",
};

const taskTypeLabels: Record<TaskType, string> = {
  human: "Human",
  agent: "Agent",
  collaborative: "Collaborative",
};

export { taskStatusLabels, taskTypeLabels };
