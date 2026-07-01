import V2ReviewList from '../../../components/v2/V2ReviewList';

export default function V2Albums() {
  return (
    <V2ReviewList
      title="Albums"
      apiPath="/api/reviews/albums"
      getTitle={(item) => item.title}
      getSubtitle={(item) => item.artist}
      getExcerpt={(item) => item.highlights}
      getDate={(item) => item.date}
      getKey={(item, i) => `${item.title}-${item.artist}-${i}`}
    />
  );
}
