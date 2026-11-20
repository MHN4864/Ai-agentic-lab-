import { ProjectOverviewTab } from "@/features/projects/project-overview-tab";

export default async function ProjectPage(
  props: PageProps<"/projects/[projectId]">,
) {
  const { projectId } = await props.params;

  return <ProjectOverviewTab projectId={projectId} />;
}
