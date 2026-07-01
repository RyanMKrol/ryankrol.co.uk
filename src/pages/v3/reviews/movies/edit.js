import V3EditFeed from '../../../../components/v3/V3EditFeed';

export default function V3EditMovies() {
  return (
    <V3EditFeed
      title="movies"
      apiPath="/api/reviews/movies"
      editHref={(movie) => `/v3/reviews/movies/edit/${encodeURIComponent(movie.title)}`}
      getKey={(movie) => movie.title}
      getSummary={(movie) => movie.title}
    />
  );
}
