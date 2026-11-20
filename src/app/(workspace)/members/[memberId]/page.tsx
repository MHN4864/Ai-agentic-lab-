import { ContentContainer } from "@/components/layout";
import { MemberProfile } from "@/features/members/members-pages";

export default async function MemberPage(
  props: PageProps<"/members/[memberId]">,
) {
  const { memberId } = await props.params;

  return (
    <ContentContainer>
      <MemberProfile memberId={memberId} />
    </ContentContainer>
  );
}
