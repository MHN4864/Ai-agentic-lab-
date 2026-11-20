"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import type { AgentOnboardingConfig } from "./types";

const initialConfig: AgentOnboardingConfig = {
  name: "",
  roleDescription: "",
  framework: "",
  otherFramework: "",
  model: "",
  provider: "",
  deployment: "",
  otherDeployment: "",
  environmentDetails: "",
  integrationEndpoint: "",
  integrationDetails: "",
  environmentNotes: "",
};

type AgentOnboardingContextValue = {
  config: AgentOnboardingConfig;
  updateConfig: (updates: Partial<AgentOnboardingConfig>) => void;
  resetConfig: () => void;
};

const AgentOnboardingContext =
  createContext<AgentOnboardingContextValue | null>(null);

function AgentOnboardingProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState(initialConfig);

  function updateConfig(updates: Partial<AgentOnboardingConfig>) {
    setConfig((current) => ({ ...current, ...updates }));
  }

  function resetConfig() {
    setConfig(initialConfig);
  }

  return (
    <AgentOnboardingContext.Provider
      value={{ config, updateConfig, resetConfig }}
    >
      {children}
    </AgentOnboardingContext.Provider>
  );
}

function useAgentOnboarding() {
  const context = useContext(AgentOnboardingContext);

  if (!context) {
    throw new Error(
      "useAgentOnboarding must be used within AgentOnboardingProvider.",
    );
  }

  return context;
}

export { AgentOnboardingProvider, useAgentOnboarding };
