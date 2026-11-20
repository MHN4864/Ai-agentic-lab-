import { ContentContainer } from "@/components/layout";
import { TaskFormPage } from "@/features/tasks/task-form-page";

export default async function EditTaskPage(
  props: PageProps<"/tasks/[taskId]/edit">,
) {
  const { taskId } = await props.params;

  return (
    <ContentContainer>
      <TaskFormPage mode="edit" taskId={taskId} />
    </ContentContainer>
  );
}
