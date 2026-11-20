import { ProjectWorkTab } from "@/features/projects/project-work-tab";

export default async function ProjectWorkPage(
  props: PageProps<"/projects/[projectId]/work">,
) {
  const { projectId } = await props.params;

  return <ProjectWorkTab projectId={projectId} />;
}
