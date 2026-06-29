const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

/**
 * Build a full TMDB poster image URL from a poster path.
 * Returns null if path is falsy.
 */
export function tmdbPosterUrl(path) {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}${path}`;
}

/**
 * Normalise a single raw TMDB search result into our shape.
 * @param {Object} raw - Raw TMDB result object
 * @param {'movie'|'tv'} type
 * @returns {{ tmdbId, mediaType, title, overview, posterPath, date }}
 */
export function mapTmdbResult(raw, type) {
  const title = type === 'tv' ? raw.name : raw.title;
  const date = type === 'tv' ? raw.first_air_date : raw.release_date;

  return {
    tmdbId: raw.id,
    mediaType: type,
    title: title ?? null,
    overview: raw.overview ?? null,
    posterPath: raw.poster_path ?? null,
    date: date ?? null,
  };
}
