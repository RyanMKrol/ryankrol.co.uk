/** True when a movie review is missing TMDB metadata. */
export const needsMovieBackfill = (item) => !item.tmdbId;

/** True when a TV review is missing TMDB metadata (TV shares the movies shape). */
export const needsTvBackfill = (item) => !item.tmdbId;

/** True when a book review has no rich source metadata from either provider. */
export const needsBookBackfill = (item) => !item.volumeId && !item.olid;

/** True when an album review is missing Last.fm metadata (no url). */
export const needsAlbumBackfill = (item) => !item.lastfm || !item.lastfm.url;
