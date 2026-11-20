import { ProjectFormPage } from "@/features/projects/project-form-page";

export default async function EditProjectPage(
  props: PageProps<"/projects/[projectId]/edit">,
) {
  const { projectId } = await props.params;

  return (
    <ProjectFormPage
      key={projectId}
      mode="edit"
      projectId={projectId}
      embedded
    />
  );
}
