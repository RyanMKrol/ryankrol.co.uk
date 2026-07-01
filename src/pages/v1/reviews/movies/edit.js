import V1EditList from '../../../../components/v1/V1EditList';

export default function V1EditMovies() {
  return (
    <V1EditList
      breadcrumb="~ / reviews / movies / edit"
      endpoint="/api/reviews/movies"
      typeLabel="movies"
      getSecondary={() => null}
      getEditHref={(item) => `/v1/reviews/movies/edit/${encodeURIComponent(item.title)}`}
    />
  );
}
