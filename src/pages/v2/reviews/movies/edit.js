import V2EditList from '../../../../components/v2/V2EditList';

export default function V2EditMovies() {
  return (
    <V2EditList
      title="Movies"
      apiPath="/api/reviews/movies"
      getTitle={(item) => item.title}
      getSubtitle={() => null}
      getExcerpt={(item) => item.review_text}
      getEditHref={(item) => `/v2/reviews/movies/edit/${encodeURIComponent(item.title)}`}
      getKey={(item, i) => `${item.title}-${i}`}
    />
  );
}
