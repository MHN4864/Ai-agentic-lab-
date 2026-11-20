import type { ProjectPriority } from "@/features/projects/types";

export type TaskStatus =
  | "backlog"
  | "ready"
  | "in-progress"
  | "waiting"
  | "blocked"
  | "in-review"
  | "completed"
  | "cancelled";

export type TaskType = "human" | "agent" | "collaborative";
export type TaskPriority = ProjectPriority;

export type TaskAssignee =
  | { type: "human"; memberId: string }
  | { type: "agent"; agentId: string };

export type TaskAssignment = {
  primaryAssignee: TaskAssignee | null;
  collaborators: TaskAssignee[];
};

export type TaskActivityActor =
  | { type: "human"; memberId: string }
  | { type: "agent"; agentId: string }
  | { type: "system"; label: string };

export type TaskAssignmentEventType =
  | "initial-assignment"
  | "reassignment"
  | "collaborator-added"
  | "collaborator-removed"
  | "unassignment";

export type TaskAssignmentHistoryEvent = {
  id: string;
  type: TaskAssignmentEventType;
  actor: TaskActivityActor;
  previousPrimaryAssignee: TaskAssignee | null;
  newPrimaryAssignee: TaskAssignee | null;
  collaborator?: TaskAssignee;
  occurredAt: string;
};

export type TaskActivityEvent = {
  id: string;
  type: "created" | "updated" | "status";
  actor: TaskActivityActor;
  summary: string;
  occurredAt: string;
};

export type TaskRecord = {
  id: string;
  title: string;
  description: string;
  projectId: string;
  status: TaskStatus;
  priority: TaskPriority;
  taskType: TaskType;
  assignment: TaskAssignment;
  assignmentHistory: TaskAssignmentHistoryEvent[];
  dueDate?: string;
  acceptanceCriteria: string;
  context: string;
  createdAt: string;
  updatedAt: string;
  activity: TaskActivityEvent[];
};

export type TaskFormValues = {
  title: string;
  description: string;
  projectId: string;
  status: TaskStatus;
  priority: TaskPriority;
  taskType: TaskType;
  primaryAssignee: TaskAssignee | null;
  dueDate: string;
  acceptanceCriteria: string;
  context: string;
};
