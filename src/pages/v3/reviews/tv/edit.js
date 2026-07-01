import V3EditFeed from '../../../../components/v3/V3EditFeed';

export default function V3EditTV() {
  return (
    <V3EditFeed
      title="tv"
      apiPath="/api/reviews/tv"
      editHref={(show) => `/v3/reviews/tv/edit/${encodeURIComponent(show.title)}`}
      getKey={(show) => show.title}
      getSummary={(show) => show.title}
    />
  );
}
