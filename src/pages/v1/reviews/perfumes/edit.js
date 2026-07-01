import V1EditList from '../../../../components/v1/V1EditList';

export default function V1EditPerfumes() {
  return (
    <V1EditList
      breadcrumb="~ / reviews / perfumes / edit"
      endpoint="/api/reviews/perfumes"
      typeLabel="perfumes"
      getSecondary={(item) => item.designer}
      getEditHref={(item) => `/v1/reviews/perfumes/edit/${encodeURIComponent(item.id)}`}
    />
  );
}
