export type AgentConnectivity = "connected" | "degraded" | "disconnected";

export type AgentExecutionState =
  | "running"
  | "idle"
  | "waiting"
  | "blocked"
  | "failed";

export type AgentAvailability = "available" | "busy" | "unavailable";

export type Agent = {
  id: string;
  name: string;
  responsibility: string;
  framework: string;
  connectivity: AgentConnectivity;
  executionState: AgentExecutionState;
  availability: AgentAvailability;
  currentTask?: string;
  lastSeen?: string;
};

export type WorkExecutionStatus =
  | "running"
  | "waiting"
  | "blocked"
  | "failed"
  | "completed";

export type Execution = {
  id: string;
  taskName: string;
  agentName: string;
  status: WorkExecutionStatus;
  startedAt: string;
  duration: string;
  progress?: number;
};

export type TaskStatus = "open" | "in-progress" | "awaiting-review" | "completed";

export type Task = {
  id: string;
  title: string;
  project: string;
  status: TaskStatus;
  completedAt?: string;
};

export type TaskSummary = {
  open: number;
  inProgress: number;
  awaitingReview: number;
  completedThisPeriod: number;
  recentlyCompleted: Task[];
};

export type ProjectStatus = "on-track" | "at-risk" | "completed";

export type Project = {
  id: string;
  name: string;
  status: ProjectStatus;
  progress: number;
  openTasks: number;
};

export type ReviewQueueItem = {
  taskId: string;
  title: string;
  project: string;
  submittedBy: string;
  submittedAt: string;
};

export type ActivityEventType =
  | "agent-connected"
  | "task-claimed"
  | "execution-started"
  | "execution-completed"
  | "deliverable-submitted"
  | "agent-error";

export type ActivityEvent = {
  id: string;
  type: ActivityEventType;
  summary: string;
  agent: string;
  subject: string;
  occurredAt: string;
  href: string;
};

export type UsageSummary = {
  period: string;
  estimatedTokens: number;
  estimatedCost: number;
};

export type OperationalAlert = {
  id: string;
  severity: "attention" | "critical";
  title: string;
  description: string;
  href: string;
};

export type OverviewDemoData = {
  agents: Agent[];
  executions: Execution[];
  tasks: TaskSummary;
  projects: Project[];
  reviewQueue: ReviewQueueItem[];
  activity: ActivityEvent[];
  usage: UsageSummary;
  alerts: OperationalAlert[];
};
