import { ContentContainer } from "@/components/layout";
import { ReviewRegistry } from "@/features/reviews/review-registry";

export default function ReviewsPage() {
  return (
    <ContentContainer>
      <ReviewRegistry />
    </ContentContainer>
  );
}
