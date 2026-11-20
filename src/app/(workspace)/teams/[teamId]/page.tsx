import { ContentContainer } from "@/components/layout";
import { TeamProfile } from "@/features/teams/teams-pages";

export default async function TeamPage(
  props: PageProps<"/teams/[teamId]">,
) {
  const { teamId } = await props.params;

  return (
    <ContentContainer>
      <TeamProfile teamId={teamId} />
    </ContentContainer>
  );
}
