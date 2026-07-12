import {
  needsMovieBackfill,
  needsTvBackfill,
  needsBookBackfill,
  needsAlbumBackfill,
} from './backfillEligibility';

describe('needsMovieBackfill', () => {
  test('true when tmdbId missing', () => {
    expect(needsMovieBackfill({ title: 'X' })).toBe(true);
  });

  test('false when tmdbId present', () => {
    expect(needsMovieBackfill({ title: 'X', tmdbId: 123 })).toBe(false);
  });
});

describe('needsTvBackfill', () => {
  test('true when tmdbId missing', () => {
    expect(needsTvBackfill({ title: 'X' })).toBe(true);
  });

  test('false when tmdbId present', () => {
    expect(needsTvBackfill({ title: 'X', tmdbId: 456 })).toBe(false);
  });
});

describe('needsBookBackfill', () => {
  test('true when neither volumeId nor olid present', () => {
    expect(needsBookBackfill({ title: 'X' })).toBe(true);
  });

  test('false when volumeId present', () => {
    expect(needsBookBackfill({ title: 'X', volumeId: 'abc' })).toBe(false);
  });

  test('false when olid present', () => {
    expect(needsBookBackfill({ title: 'X', olid: 'OL123M' })).toBe(false);
  });
});

describe('needsAlbumBackfill', () => {
  test('true when lastfm missing', () => {
    expect(needsAlbumBackfill({ title: 'X' })).toBe(true);
  });

  test('true when lastfm present but url falsy', () => {
    expect(needsAlbumBackfill({ title: 'X', lastfm: { url: '' } })).toBe(true);
  });

  test('false when lastfm.url present even if mbid empty', () => {
    expect(needsAlbumBackfill({ title: 'X', lastfm: { mbid: '', url: 'https://last.fm/...' } })).toBe(false);
  });
});
