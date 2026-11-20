export type AgentConnectivity = "connected" | "disconnected" | "degraded";

export type AgentExecutionState =
  | "running"
  | "idle"
  | "waiting"
  | "blocked"
  | "failed";

export type AgentAvailability = "available" | "busy" | "unavailable";

export type AgentFramework = {
  name: string;
  version?: string;
};

export type AgentModel = {
  name?: string;
  provider?: string;
};

export type AgentDeployment = {
  environment?: string;
  location?: string;
  ownership: "customer-managed";
};

export type CapabilityReport = {
  status: "reported" | "unverified" | "not-reported";
  capabilities: string[];
  supportedOperations: string[];
  tools?: string[];
};

export type AgentIntegrationMetadata = {
  name?: string;
  version?: string;
  connectionMethod?: string;
  details?: string[];
};

export type AgentActivityEvent = {
  id: string;
  type: "connectivity" | "execution" | "warning" | "error";
  summary: string;
  occurredAt: string;
};

export type AgentExecution = {
  id: string;
  taskName: string;
  status: "running" | "waiting" | "failed" | "completed";
  duration?: string;
};

export type AgentUsage = {
  period?: string;
  estimatedTokens?: number;
  estimatedCost?: number;
};

export type AgentPermissions = {
  status: "reported" | "not-reported";
  overview: string;
  grantedCapabilities: string[];
  restrictedOperations: string[];
};

export type WorkforceAgent = {
  id: string;
  name: string;
  initials: string;
  responsibility: string;
  framework: AgentFramework;
  model?: AgentModel;
  deployment: AgentDeployment;
  connectivity: AgentConnectivity;
  executionState: AgentExecutionState;
  availability: AgentAvailability;
  currentTask?: string;
  lastHeartbeat?: string;
  registeredAt?: string;
  capabilityReport: CapabilityReport;
  integrationMetadata?: AgentIntegrationMetadata;
  activity: AgentActivityEvent[];
  executions: AgentExecution[];
  usage?: AgentUsage;
  permissions: AgentPermissions;
};
