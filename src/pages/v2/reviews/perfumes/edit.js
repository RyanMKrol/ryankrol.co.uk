import V2EditList from '../../../../components/v2/V2EditList';

export default function V2EditPerfumes() {
  return (
    <V2EditList
      title="Perfumes"
      apiPath="/api/reviews/perfumes"
      ratingMax={10}
      getTitle={(item) => item.title}
      getSubtitle={(item) => item.designer}
      getExcerpt={(item) => item.description}
      getEditHref={(item) => `/v2/reviews/perfumes/edit/${encodeURIComponent(item.id)}`}
      getKey={(item, i) => `${item.id}-${i}`}
    />
  );
}
