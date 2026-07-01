import V1ReviewTable from '../../../components/v1/V1ReviewTable';

export default function V1Tv() {
  return (
    <V1ReviewTable
      breadcrumb="~ / reviews / tv"
      endpoint="/api/reviews/tv"
      typeLabel="tv"
      getSecondary={() => null}
      getThoughts={(item) => item.review_text}
      getMaxRating={() => 5}
    />
  );
}
