import { notFound } from "next/navigation";
import { ContentContainer } from "@/components/layout";
import { executionDemoData } from "@/features/executions/demo-data";
import { ExecutionDetails } from "@/features/executions/execution-details";

export default async function ExecutionPage(
  props: PageProps<"/executions/[executionId]">,
) {
  const { executionId } = await props.params;
  const execution = executionDemoData.find(
    (candidate) => candidate.id === executionId,
  );

  if (!execution) {
    notFound();
  }

  return (
    <ContentContainer>
      <ExecutionDetails execution={execution} />
    </ContentContainer>
  );
}
