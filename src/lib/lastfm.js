const IMAGE_SIZE_ORDER = ['extralarge', 'large', 'medium', 'small'];

/**
 * Pick the largest non-empty image URL from a Last.fm image array.
 * @param {Array} images - e.g. [{ size: 'small', '#text': '...' }, ...]
 * @returns {string|null}
 */
function pickLargestImage(images) {
  if (!Array.isArray(images)) return null;
  for (const size of IMAGE_SIZE_ORDER) {
    const entry = images.find(img => img.size === size && img['#text']);
    if (entry) return entry['#text'];
  }
  return null;
}

/**
 * Normalise a single Last.fm album.search result item.
 * @param {Object} raw - Raw item from results.albummatches.album[]
 * @returns {{ title, artist, mbid, url, image }}
 */
export function mapAlbumSearchResult(raw) {
  return {
    title: raw.name ?? null,
    artist: raw.artist ?? null,
    mbid: raw.mbid || null,
    url: raw.url ?? null,
    image: pickLargestImage(raw.image),
  };
}

/**
 * Normalise a Last.fm album.getInfo result. Deliberately over-stores metadata.
 * Be defensive — Last.fm fields are frequently missing.
 * @param {Object} raw - Raw album object from album.getInfo response
 * @returns {{ title, artist, mbid, url, image, listeners, playcount, tags, trackCount, summary, releaseDate, images }}
 */
export function mapAlbumInfo(raw) {
  const tags = Array.isArray(raw.tags?.tag)
    ? raw.tags.tag.map(t => t.name).filter(Boolean)
    : [];

  const tracks = raw.tracks?.track;
  const trackCount = Array.isArray(tracks)
    ? tracks.length
    : tracks
    ? 1
    : 0;

  const summary = raw.wiki?.summary ?? null;

  const releaseDate = raw.wiki?.published ?? null;

  // Build images map keyed by size
  const images = {};
  if (Array.isArray(raw.image)) {
    for (const img of raw.image) {
      if (img.size && img['#text']) images[img.size] = img['#text'];
    }
  }

  return {
    title: raw.name ?? null,
    artist: typeof raw.artist === 'string' ? raw.artist : (raw.artist?.name ?? null),
    mbid: raw.mbid || null,
    url: raw.url ?? null,
    image: pickLargestImage(raw.image),
    listeners: raw.listeners != null ? parseInt(raw.listeners, 10) || 0 : 0,
    playcount: raw.playcount != null ? parseInt(raw.playcount, 10) || 0 : 0,
    tags,
    trackCount,
    summary,
    releaseDate,
    images,
  };
}
