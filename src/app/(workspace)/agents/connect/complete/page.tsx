import { CompleteAgentStep } from "@/features/agent-onboarding/complete-agent-step";
import { AgentWizardFrame } from "@/features/agent-onboarding/wizard-frame";

export default function CompleteAgentPage() {
  return (
    <AgentWizardFrame
      step={4}
      title="Setup demonstration complete"
      description="Review the configuration summary. No agent has been connected or registered."
    >
      <CompleteAgentStep />
    </AgentWizardFrame>
  );
}
