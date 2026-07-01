import V3EditFeed from '../../../../components/v3/V3EditFeed';

export default function V3EditBooks() {
  return (
    <V3EditFeed
      title="books"
      apiPath="/api/reviews/books"
      editHref={(book) => `/v3/reviews/books/edit/${encodeURIComponent(`${book.title}|${book.author}`)}`}
      getKey={(book) => `${book.title}-${book.author}`}
      getSummary={(book) => `${book.title} — ${book.author}`}
    />
  );
}
