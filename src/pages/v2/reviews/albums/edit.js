import V2EditList from '../../../../components/v2/V2EditList';

export default function V2EditAlbums() {
  return (
    <V2EditList
      title="Albums"
      apiPath="/api/reviews/albums"
      getTitle={(item) => item.title}
      getSubtitle={(item) => item.artist}
      getExcerpt={(item) => item.highlights}
      getEditHref={(item) => `/v2/reviews/albums/edit/${encodeURIComponent(`${item.title}|${item.artist}`)}`}
      getKey={(item, i) => `${item.title}-${item.artist}-${i}`}
    />
  );
}
