import { ContentContainer } from "@/components/layout";
import { TaskFormPage } from "@/features/tasks/task-form-page";

export default function NewTaskPage() {
  return (
    <ContentContainer>
      <TaskFormPage mode="create" />
    </ContentContainer>
  );
}
