import V3EditFeed from '../../../../components/v3/V3EditFeed';

export default function V3EditAlbums() {
  return (
    <V3EditFeed
      title="albums"
      apiPath="/api/reviews/albums"
      editHref={(album) => `/v3/reviews/albums/edit/${encodeURIComponent(`${album.title}|${album.artist}`)}`}
      getKey={(album) => `${album.title}-${album.artist}`}
      getSummary={(album) => `${album.title} — ${album.artist}`}
    />
  );
}
