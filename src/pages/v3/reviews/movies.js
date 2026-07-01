import V3ReviewFeed from '../../../components/v3/V3ReviewFeed';

export default function V3Movies() {
  return (
    <V3ReviewFeed
      title="movies"
      apiPath="/api/reviews/movies"
      ratingScale={5}
      getKey={(movie) => movie.title}
      getSummary={(movie) => movie.title}
      getReviewText={(movie) => movie.review_text}
    />
  );
}
