import V1EditList from '../../../../components/v1/V1EditList';

export default function V1EditAlbums() {
  return (
    <V1EditList
      breadcrumb="~ / reviews / albums / edit"
      endpoint="/api/reviews/albums"
      typeLabel="albums"
      getSecondary={(item) => item.artist}
      getEditHref={(item) =>
        `/v1/reviews/albums/edit/${encodeURIComponent(`${item.title}|${item.artist}`)}`
      }
    />
  );
}
