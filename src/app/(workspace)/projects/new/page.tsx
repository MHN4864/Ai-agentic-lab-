import { ContentContainer } from "@/components/layout";
import { ProjectFormPage } from "@/features/projects/project-form-page";

export default function NewProjectPage() {
  return (
    <ContentContainer>
      <ProjectFormPage mode="create" />
    </ContentContainer>
  );
}
