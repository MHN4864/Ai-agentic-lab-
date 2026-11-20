import { ProjectAgentsTab } from "@/features/projects/project-agents-tab";

export default async function ProjectAgentsPage(
  props: PageProps<"/projects/[projectId]/agents">,
) {
  const { projectId } = await props.params;

  return <ProjectAgentsTab projectId={projectId} />;
}
