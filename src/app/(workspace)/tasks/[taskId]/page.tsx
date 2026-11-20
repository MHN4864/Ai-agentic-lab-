import { ContentContainer } from "@/components/layout";
import { TaskDetailsPage } from "@/features/tasks/task-details-page";

export default async function TaskPage(
  props: PageProps<"/tasks/[taskId]">,
) {
  const { taskId } = await props.params;

  return (
    <ContentContainer>
      <TaskDetailsPage taskId={taskId} />
    </ContentContainer>
  );
}
