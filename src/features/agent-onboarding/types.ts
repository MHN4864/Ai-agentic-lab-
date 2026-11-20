export const frameworkChoices = [
  "OpenClaw",
  "Hermes",
  "LangGraph",
  "CrewAI",
  "Custom",
  "Other",
] as const;

export type AgentFrameworkChoice =
  | (typeof frameworkChoices)[number]
  | "";

export const deploymentChoices = [
  "Local",
  "Cloud",
  "VPS",
  "Container",
  "Other",
] as const;

export type AgentDeploymentChoice =
  | (typeof deploymentChoices)[number]
  | "";

export type AgentOnboardingConfig = {
  name: string;
  roleDescription: string;
  framework: AgentFrameworkChoice;
  otherFramework: string;
  model: string;
  provider: string;
  deployment: AgentDeploymentChoice;
  otherDeployment: string;
  environmentDetails: string;
  integrationEndpoint: string;
  integrationDetails: string;
  environmentNotes: string;
};
