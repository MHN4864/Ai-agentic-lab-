import { ProjectActivityTab } from "@/features/projects/project-activity-tab";

export default async function ProjectActivityPage(
  props: PageProps<"/projects/[projectId]/activity">,
) {
  const { projectId } = await props.params;

  return <ProjectActivityTab projectId={projectId} />;
}
