import { ContentContainer } from "@/components/layout";
import { ProjectWorkspaceFrame } from "@/features/projects/project-workspace-frame";

export default async function ProjectWorkspaceLayout(
  props: LayoutProps<"/projects/[projectId]">,
) {
  const { projectId } = await props.params;

  return (
    <ContentContainer>
      <ProjectWorkspaceFrame projectId={projectId}>
        {props.children}
      </ProjectWorkspaceFrame>
    </ContentContainer>
  );
}
