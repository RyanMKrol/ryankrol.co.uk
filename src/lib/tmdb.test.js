import { mapTmdbResult, tmdbPosterUrl } from './tmdb';

describe('tmdbPosterUrl', () => {
  it('returns full URL for a valid path', () => {
    expect(tmdbPosterUrl('/abc123.jpg')).toBe('https://image.tmdb.org/t/p/w500/abc123.jpg');
  });

  it('returns null for null path', () => {
    expect(tmdbPosterUrl(null)).toBeNull();
  });

  it('returns null for undefined path', () => {
    expect(tmdbPosterUrl(undefined)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(tmdbPosterUrl('')).toBeNull();
  });
});

describe('mapTmdbResult', () => {
  const movieRaw = {
    id: 550,
    title: 'Fight Club',
    overview: 'An insomniac office worker...',
    poster_path: '/fight_club.jpg',
    release_date: '1999-10-15',
  };

  const tvRaw = {
    id: 1399,
    name: 'Game of Thrones',
    overview: 'Seven noble families fight for control...',
    poster_path: '/got.jpg',
    first_air_date: '2011-04-17',
  };

  it('maps a movie result correctly', () => {
    expect(mapTmdbResult(movieRaw, 'movie')).toEqual({
      tmdbId: 550,
      mediaType: 'movie',
      title: 'Fight Club',
      overview: 'An insomniac office worker...',
      posterPath: '/fight_club.jpg',
      date: '1999-10-15',
    });
  });

  it('maps a tv result correctly using name and first_air_date', () => {
    expect(mapTmdbResult(tvRaw, 'tv')).toEqual({
      tmdbId: 1399,
      mediaType: 'tv',
      title: 'Game of Thrones',
      overview: 'Seven noble families fight for control...',
      posterPath: '/got.jpg',
      date: '2011-04-17',
    });
  });

  it('returns null posterPath when poster_path is missing', () => {
    const raw = { ...movieRaw, poster_path: undefined };
    const result = mapTmdbResult(raw, 'movie');
    expect(result.posterPath).toBeNull();
  });

  it('returns null posterPath when poster_path is null', () => {
    const raw = { ...movieRaw, poster_path: null };
    const result = mapTmdbResult(raw, 'movie');
    expect(result.posterPath).toBeNull();
  });
});
