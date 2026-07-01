import V1ReviewTable from '../../../components/v1/V1ReviewTable';

export default function V1Movies() {
  return (
    <V1ReviewTable
      breadcrumb="~ / reviews / movies"
      endpoint="/api/reviews/movies"
      typeLabel="movies"
      getSecondary={() => null}
      getThoughts={(item) => item.review_text}
      getMaxRating={() => 5}
    />
  );
}
