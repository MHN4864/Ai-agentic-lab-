import { ContentContainer } from "@/components/layout";
import { TeamFormPage } from "@/features/teams/teams-pages";

export default async function EditTeamPage(
  props: PageProps<"/teams/[teamId]/edit">,
) {
  const { teamId } = await props.params;

  return (
    <ContentContainer>
      <TeamFormPage teamId={teamId} />
    </ContentContainer>
  );
}
