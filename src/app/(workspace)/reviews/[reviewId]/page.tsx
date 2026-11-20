import { ContentContainer } from "@/components/layout";
import { ReviewDetailsPage } from "@/features/reviews/review-details-page";

export default async function ReviewPage(
  props: PageProps<"/reviews/[reviewId]">,
) {
  const { reviewId } = await props.params;

  return (
    <ContentContainer>
      <ReviewDetailsPage reviewId={reviewId} />
    </ContentContainer>
  );
}
