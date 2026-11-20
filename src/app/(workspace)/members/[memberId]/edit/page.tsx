import { ContentContainer } from "@/components/layout";
import { MemberFormPage } from "@/features/members/members-pages";

export default async function EditMemberPage(
  props: PageProps<"/members/[memberId]/edit">,
) {
  const { memberId } = await props.params;

  return (
    <ContentContainer>
      <MemberFormPage memberId={memberId} />
    </ContentContainer>
  );
}
