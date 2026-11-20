import { ContentContainer } from "@/components/layout";
import { TaskAssignmentPage } from "@/features/tasks/task-assignment-page";

export default async function AssignmentPage(
  props: PageProps<"/tasks/[taskId]/assignment">,
) {
  const { taskId } = await props.params;

  return (
    <ContentContainer>
      <TaskAssignmentPage taskId={taskId} />
    </ContentContainer>
  );
}
