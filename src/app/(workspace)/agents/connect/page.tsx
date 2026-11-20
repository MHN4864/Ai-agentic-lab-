import { IdentifyAgentStep } from "@/features/agent-onboarding/identify-agent-step";
import { AgentWizardFrame } from "@/features/agent-onboarding/wizard-frame";

export default function IdentifyAgentPage() {
  return (
    <AgentWizardFrame
      step={1}
      title="Identify the agent"
      description="Start with the agent's basic details. Framework metadata is optional and never limits which agents can be prepared."
    >
      <IdentifyAgentStep />
    </AgentWizardFrame>
  );
}
