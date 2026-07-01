import V1ReviewTable from '../../../components/v1/V1ReviewTable';

export default function V1Books() {
  return (
    <V1ReviewTable
      breadcrumb="~ / reviews / books"
      endpoint="/api/reviews/books"
      typeLabel="books"
      getSecondary={(item) => item.author}
      getThoughts={(item) => item.review_text}
      getMaxRating={() => 5}
    />
  );
}
