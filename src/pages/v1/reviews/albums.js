import V1ReviewTable from '../../../components/v1/V1ReviewTable';

export default function V1Albums() {
  return (
    <V1ReviewTable
      breadcrumb="~ / reviews / albums"
      endpoint="/api/reviews/albums"
      typeLabel="albums"
      getSecondary={(item) => item.artist}
      getThoughts={(item) => item.highlights}
      getMaxRating={() => 5}
    />
  );
}
