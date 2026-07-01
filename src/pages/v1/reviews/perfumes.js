import V1ReviewTable from '../../../components/v1/V1ReviewTable';

export default function V1Perfumes() {
  return (
    <V1ReviewTable
      breadcrumb="~ / reviews / perfumes"
      endpoint="/api/reviews/perfumes"
      typeLabel="perfumes"
      getSecondary={(item) => item.designer}
      getThoughts={(item) => item.description}
      getMaxRating={() => 10}
    />
  );
}
