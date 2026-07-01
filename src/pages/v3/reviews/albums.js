import V3ReviewFeed from '../../../components/v3/V3ReviewFeed';

export default function V3Albums() {
  return (
    <V3ReviewFeed
      title="albums"
      apiPath="/api/reviews/albums"
      ratingScale={5}
      getKey={(album) => `${album.title}-${album.artist}`}
      getSummary={(album) => `${album.title} — ${album.artist}`}
      getReviewText={(album) => album.highlights}
    />
  );
}
