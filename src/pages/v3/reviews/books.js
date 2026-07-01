import V3ReviewFeed from '../../../components/v3/V3ReviewFeed';

export default function V3Books() {
  return (
    <V3ReviewFeed
      title="books"
      apiPath="/api/reviews/books"
      ratingScale={5}
      getKey={(book) => `${book.title}-${book.author}`}
      getSummary={(book) => `${book.title} — ${book.author}`}
      getReviewText={(book) => book.review_text}
    />
  );
}
