import { VerifyAgentStep } from "@/features/agent-onboarding/verify-agent-step";
import { AgentWizardFrame } from "@/features/agent-onboarding/wizard-frame";

export default function VerifyAgentPage() {
  return (
    <AgentWizardFrame
      step={3}
      title="Review connection readiness"
      description="Review what this frontend demonstration can and cannot verify."
    >
      <VerifyAgentStep />
    </AgentWizardFrame>
  );
}
