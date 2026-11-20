import { ConfigureIntegrationStep } from "@/features/agent-onboarding/configure-integration-step";
import { AgentWizardFrame } from "@/features/agent-onboarding/wizard-frame";

export default function ConfigureAgentPage() {
  return (
    <AgentWizardFrame
      step={2}
      title="Configure integration details"
      description="Share any non-secret endpoint or environment context that may help guide a future connection setup."
    >
      <ConfigureIntegrationStep />
    </AgentWizardFrame>
  );
}
