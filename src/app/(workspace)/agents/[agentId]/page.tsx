import { notFound } from "next/navigation";
import { ContentContainer } from "@/components/layout";
import { AgentDetails } from "@/features/agents/agent-details";
import { agentDemoData } from "@/features/agents/demo-data";

export default async function AgentDetailsPage(
  props: PageProps<"/agents/[agentId]">,
) {
  const { agentId } = await props.params;
  const agent = agentDemoData.find((candidate) => candidate.id === agentId);

  if (!agent) {
    notFound();
  }

  return (
    <ContentContainer>
      <AgentDetails agent={agent} />
    </ContentContainer>
  );
}
