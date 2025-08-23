import NodeCache from 'node-cache';

const ONE_DAY_S = 60 * 60 * 24;

const DYNAMO_TABLES = {
  MOVIE_RATINGS_TABLE: 'MovieRatings',
  BOOK_RATINGS_TABLE: 'BookRatings',
  ALBUM_RATINGS_TABLE: 'AlbumRatings',
  TV_RATINGS_TABLE: 'TelevisionRatings',
  VINYL_COLLECTION_TABLE: 'VinylCollection',
  CONCERTS_TABLE: 'ConcertDataItems',
};

const SERVER_CACHES = {
  MOVIE_CACHE: new NodeCache(),
  BOOK_CACHE: new NodeCache(),
  ALBUM_CACHE: new NodeCache(),
  TV_CACHE: new NodeCache(),
  VINYL_CACHE: new NodeCache(),
  LISTENS_CACHE: new NodeCache({ stdTTL: ONE_DAY_S }),
  CONCERTS_CACHE: new NodeCache({ stdTTL: ONE_DAY_S }),
};

export { DYNAMO_TABLES, SERVER_CACHES };