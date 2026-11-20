import { ContentContainer } from "@/components/layout";
import { TaskRegistry } from "@/features/tasks/task-registry";

export default function TasksPage() {
  return (
    <ContentContainer>
      <TaskRegistry />
    </ContentContainer>
  );
}
