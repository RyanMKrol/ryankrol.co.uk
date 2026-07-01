import V2ReviewList from '../../../components/v2/V2ReviewList';

export default function V2Tv() {
  return (
    <V2ReviewList
      title="TV"
      apiPath="/api/reviews/tv"
      getTitle={(item) => item.title}
      getSubtitle={() => null}
      getExcerpt={(item) => item.review_text}
      getDate={(item) => item.date}
      getKey={(item, i) => `${item.title}-${i}`}
    />
  );
}
