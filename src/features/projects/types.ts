export type ProjectStatus = "planning" | "active" | "on-hold" | "completed";

export type ProjectPriority = "low" | "medium" | "high" | "critical";

export type ProjectTaskSummary = {
  total: number;
  open: number;
  inProgress: number;
  awaitingReview: number;
  completed: number;
  blocked: number;
};

export type ProjectActivityEvent = {
  id: string;
  type: "created" | "updated" | "status" | "milestone";
  description: string;
  actor: string;
  actorType: "human" | "agent" | "system";
  occurredAt: string;
};

export type ProjectWorkStatus =
  | "open"
  | "in-progress"
  | "awaiting-review"
  | "blocked"
  | "completed";

export type ProjectWorkAssignee =
  | { type: "agent"; agentId: string }
  | { type: "human"; name: string };

export type ProjectWorkItem = {
  id: string;
  title: string;
  description: string;
  status: ProjectWorkStatus;
  priority: ProjectPriority;
  assignee: ProjectWorkAssignee;
  dueDate: string;
};

export type ProjectRecord = {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  owner?: string;
  team?: string;
  startDate?: string;
  targetDate?: string;
  goals?: string;
  agentIds: string[];
  taskSummary: ProjectTaskSummary | null;
  workItems: ProjectWorkItem[];
  activity: ProjectActivityEvent[];
};

export type ProjectFormValues = {
  name: string;
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  owner: string;
  team: string;
  startDate: string;
  targetDate: string;
  goals: string;
};
