import V3ReviewFeed from '../../../components/v3/V3ReviewFeed';

export default function V3Perfumes() {
  return (
    <V3ReviewFeed
      title="perfumes"
      apiPath="/api/reviews/perfumes"
      ratingScale={10}
      getKey={(perfume) => perfume.id}
      getSummary={(perfume) => `${perfume.title} — ${perfume.designer}`}
      getReviewText={(perfume) => perfume.description || perfume.notes}
    />
  );
}
