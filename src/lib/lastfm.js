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
 * Pick the largest non-empty image URL from a Last.fm images map.
 * @param {Object} images - e.g. { extralarge: '...', large: '...', ... }
 * @returns {string|null}
 */
export function pickLargestFromImageMap(images) {
  if (!images || typeof images !== 'object') return null;
  for (const size of IMAGE_SIZE_ORDER) {
    const url = images[size];
    if (url) return url;
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
 * Normalise a string for fuzzy grouping: lowercase, strip punctuation, fold
 * '&'/'and' to the same token, collapse whitespace.
 * @param {string} str
 * @returns {string}
 */
function normalizeForGrouping(str) {
  return str
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[.,']/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Build a normalized grouping key for a mapped album search result, used to
 * collapse near-duplicate Last.fm entries (e.g. "808s and Heartbreaks" vs
 * "Kanye West 808s And Heartbreaks (feat. Kid Cudi)").
 * @param {{ title: string, artist: string }} result
 * @returns {string}
 */
function albumGroupKey(result) {
  const artist = normalizeForGrouping(result.artist ?? '');
  let title = normalizeForGrouping(result.title ?? '');

  // strip a leading artist-name prefix, e.g. "Kanye West 808s..." -> "808s..."
  if (artist && title.startsWith(artist)) {
    title = title.slice(artist.length).trim();
  }

  // strip trailing/parenthetical feat/ft qualifiers
  title = title
    .replace(/\(feat\.?[^)]*\)/g, '')
    .replace(/\bfeat\.?\s.*$/g, '')
    .replace(/\bft\.?\s.*$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    // fold trivial singular/plural variants (e.g. "Heartbreaks" vs "Heartbreak")
    .replace(/s$/, '');

  return `${artist}::${title}`;
}

/**
 * Collapse near-duplicate album search results (Last.fm's crowd-tagged
 * database frequently surfaces the same album under several near-identical
 * titles). Keeps one representative per normalized group, preferring an
 * mbid-bearing entry, and preserves first-appearance order.
 * @param {Array<{ title, artist, mbid, url, image }>} results
 * @returns {Array<{ title, artist, mbid, url, image }>}
 */
export function dedupeAlbumResults(results) {
  const order = [];
  const groups = new Map();

  for (const result of results) {
    const key = albumGroupKey(result);
    if (!groups.has(key)) {
      groups.set(key, result);
      order.push(key);
    } else if (!groups.get(key).mbid && result.mbid) {
      groups.set(key, result);
    }
  }

  return order.map(key => groups.get(key));
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
