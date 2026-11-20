import { ProjectFormPage } from "@/features/projects/project-form-page";

export default async function ProjectSettingsPage(
  props: PageProps<"/projects/[projectId]/settings">,
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
