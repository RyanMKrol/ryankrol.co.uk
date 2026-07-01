import V3ReviewFeed from '../../../components/v3/V3ReviewFeed';

export default function V3TV() {
  return (
    <V3ReviewFeed
      title="tv"
      apiPath="/api/reviews/tv"
      ratingScale={5}
      getKey={(show) => show.title}
      getSummary={(show) => show.title}
      getReviewText={(show) => show.review_text}
    />
  );
}
