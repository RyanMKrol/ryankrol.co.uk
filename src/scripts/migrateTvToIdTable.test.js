const {
  buildMigratedItem,
  diffMigratedItem,
  findMatchingNewItem,
} = require('./migrateTvToIdTable');

const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const sampleOldItem = {
  title: 'Severance',
  rating: 5,
  review_text: 'Great show.',
  date: '01-01-2024',
  tmdbId: 95396,
  mediaType: 'tv',
  posterPath: '/poster.jpg',
  tmdbOverview: 'A workplace mystery.',
  tmdbDate: '2022-02-18',
};

describe('buildMigratedItem', () => {
  it('preserves every existing field unchanged', () => {
    const migrated = buildMigratedItem(sampleOldItem);

    Object.keys(sampleOldItem).forEach((field) => {
      expect(migrated[field]).toEqual(sampleOldItem[field]);
    });
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

  it('detects a missing new item', () => {
    const mismatches = diffMigratedItem(sampleOldItem, undefined);
    expect(mismatches).toEqual([{ field: '<missing>', oldValue: sampleOldItem, newValue: undefined }]);
  });
});

describe('findMatchingNewItem', () => {
  it('matches on title + date', () => {
    const newItem = { ...sampleOldItem, id: 'some-uuid' };
    const found = findMatchingNewItem(sampleOldItem, [
      { title: 'Other', date: '02-02-2024', id: 'x' },
      newItem,
    ]);
    expect(found).toEqual(newItem);
  });

  it('returns undefined when no match exists', () => {
    const found = findMatchingNewItem(sampleOldItem, [
      { title: 'Other', date: '02-02-2024', id: 'x' },
    ]);
    expect(found).toBeUndefined();
  });
});
