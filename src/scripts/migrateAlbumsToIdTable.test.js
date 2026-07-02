const {
  buildMigratedItem,
  diffMigratedItem,
  findMatchingNewItem,
} = require('./migrateAlbumsToIdTable');

const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const sampleOldItem = {
  title: 'OK Computer',
  artist: 'Radiohead',
  rating: 5,
  highlights: 'Flawless.',
  date: '01-01-2024',
  thumbnail: 'https://example.com/cover.jpg',
  lastfm: {
    mbid: 'abc-123',
    url: 'https://last.fm/album/ok-computer',
    listeners: '123456',
    playcount: '7891011',
    tags: ['alternative', 'rock'],
    trackCount: 12,
    summary: 'A landmark album.',
    releaseDate: '1997-06-16',
    images: ['https://example.com/img-small.jpg', 'https://example.com/img-large.jpg'],
  },
};

describe('buildMigratedItem', () => {
  it('preserves every existing field unchanged, including title and artist', () => {
    const migrated = buildMigratedItem(sampleOldItem);

    Object.keys(sampleOldItem).forEach((field) => {
      expect(migrated[field]).toEqual(sampleOldItem[field]);
    });
  });

  it('preserves the nested lastfm object unchanged', () => {
    const migrated = buildMigratedItem(sampleOldItem);
    expect(migrated.lastfm).toEqual(sampleOldItem.lastfm);
  });

  it('adds an id field', () => {
    const migrated = buildMigratedItem(sampleOldItem);
    expect(migrated).toHaveProperty('id');
  });

  it('generates a valid v4 UUID for id', () => {
    const migrated = buildMigratedItem(sampleOldItem);
    expect(migrated.id).toMatch(UUID_V4_RE);
  });

  it('generates a different id on each call', () => {
    const first = buildMigratedItem(sampleOldItem);
    const second = buildMigratedItem(sampleOldItem);
    expect(first.id).not.toEqual(second.id);
  });
});

describe('diffMigratedItem', () => {
  it('returns no mismatches for an identical item (ignoring id)', () => {
    const newItem = { ...sampleOldItem, id: 'some-uuid' };
    expect(diffMigratedItem(sampleOldItem, newItem)).toEqual([]);
  });

  it('detects a changed field', () => {
    const newItem = { ...sampleOldItem, id: 'some-uuid', rating: 3 };
    const mismatches = diffMigratedItem(sampleOldItem, newItem);

    expect(mismatches).toHaveLength(1);
    expect(mismatches[0]).toMatchObject({ field: 'rating', oldValue: 5, newValue: 3 });
  });

  it('detects a mismatched nested lastfm object', () => {
    const newItem = {
      ...sampleOldItem,
      id: 'some-uuid',
      lastfm: { ...sampleOldItem.lastfm, listeners: '999' },
    };
    const mismatches = diffMigratedItem(sampleOldItem, newItem);

    expect(mismatches).toHaveLength(1);
    expect(mismatches[0].field).toEqual('lastfm');
  });

  it('detects a missing new item', () => {
    const mismatches = diffMigratedItem(sampleOldItem, undefined);
    expect(mismatches).toEqual([{ field: '<missing>', oldValue: sampleOldItem, newValue: undefined }]);
  });
});

describe('findMatchingNewItem', () => {
  it('matches on title + artist', () => {
    const newItem = { ...sampleOldItem, id: 'some-uuid' };
    const found = findMatchingNewItem(sampleOldItem, [
      { title: 'Other', artist: 'Other Artist', id: 'x' },
      newItem,
    ]);
    expect(found).toEqual(newItem);
  });

  it('returns undefined when no match exists', () => {
    const found = findMatchingNewItem(sampleOldItem, [
      { title: 'Other', artist: 'Other Artist', id: 'x' },
    ]);
    expect(found).toBeUndefined();
  });
});
