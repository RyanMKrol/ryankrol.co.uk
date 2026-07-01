import V3EditFeed from '../../../../components/v3/V3EditFeed';

export default function V3EditPerfumes() {
  return (
    <V3EditFeed
      title="perfumes"
      apiPath="/api/reviews/perfumes"
      editHref={(perfume) => `/v3/reviews/perfumes/edit/${encodeURIComponent(perfume.id)}`}
      getKey={(perfume) => perfume.id}
      getSummary={(perfume) => `${perfume.title} — ${perfume.designer}`}
    />
  );
}
