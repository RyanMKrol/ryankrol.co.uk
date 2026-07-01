import V2ReviewList from '../../../components/v2/V2ReviewList';

export default function V2Books() {
  return (
    <V2ReviewList
      title="Books"
      apiPath="/api/reviews/books"
      getTitle={(item) => item.title}
      getSubtitle={(item) => item.author}
      getExcerpt={(item) => item.review_text}
      getDate={(item) => item.date}
      getKey={(item, i) => `${item.title}-${item.author}-${i}`}
    />
  );
}
