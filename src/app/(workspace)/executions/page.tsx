import { ContentContainer } from "@/components/layout";
import { ExecutionRegistry } from "@/features/executions/execution-registry";

export default function ExecutionsPage() {
  return (
    <ContentContainer>
      <ExecutionRegistry />
    </ContentContainer>
  );
}
