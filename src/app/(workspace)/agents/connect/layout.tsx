import type { ReactNode } from "react";
import { AgentOnboardingProvider } from "@/features/agent-onboarding/wizard-context";

export default function AgentConnectLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AgentOnboardingProvider>
      {children}
    </AgentOnboardingProvider>
  );
}
