import V2ReviewList from '../../../components/v2/V2ReviewList';

export default function V2Perfumes() {
  return (
    <V2ReviewList
      title="Perfumes"
      apiPath="/api/reviews/perfumes"
      ratingMax={10}
      getTitle={(item) => item.title}
      getSubtitle={(item) => item.designer}
      getExcerpt={(item) => item.description || item.notes}
      getDate={(item) => item.date}
      getKey={(item, i) => item.id || `${item.title}-${i}`}
    />
  );
}
