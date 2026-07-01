import V1EditList from '../../../../components/v1/V1EditList';

export default function V1EditTV() {
  return (
    <V1EditList
      breadcrumb="~ / reviews / tv / edit"
      endpoint="/api/reviews/tv"
      typeLabel="tv shows"
      getSecondary={() => null}
      getEditHref={(item) => `/v1/reviews/tv/edit/${encodeURIComponent(item.title)}`}
    />
  );
}
