import V2EditList from '../../../../components/v2/V2EditList';

export default function V2EditBooks() {
  return (
    <V2EditList
      title="Books"
      apiPath="/api/reviews/books"
      getTitle={(item) => item.title}
      getSubtitle={(item) => item.author}
      getExcerpt={(item) => item.review_text}
      getEditHref={(item) => `/v2/reviews/books/edit/${encodeURIComponent(`${item.title}|${item.author}`)}`}
      getKey={(item, i) => `${item.title}-${item.author}-${i}`}
    />
  );
}
