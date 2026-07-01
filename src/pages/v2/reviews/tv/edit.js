import V2EditList from '../../../../components/v2/V2EditList';

export default function V2EditTv() {
  return (
    <V2EditList
      title="TV"
      apiPath="/api/reviews/tv"
      getTitle={(item) => item.title}
      getSubtitle={() => null}
      getExcerpt={(item) => item.review_text}
      getEditHref={(item) => `/v2/reviews/tv/edit/${encodeURIComponent(item.title)}`}
      getKey={(item, i) => `${item.title}-${i}`}
    />
  );
}
