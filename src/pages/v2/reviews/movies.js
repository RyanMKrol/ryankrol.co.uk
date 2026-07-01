import V2ReviewList from '../../../components/v2/V2ReviewList';

export default function V2Movies() {
  return (
    <V2ReviewList
      title="Movies"
      apiPath="/api/reviews/movies"
      getTitle={(item) => item.title}
      getSubtitle={() => null}
      getExcerpt={(item) => item.review_text}
      getDate={(item) => item.date}
      getKey={(item, i) => `${item.title}-${i}`}
    />
  );
}
