const {
  fieldsToStrip,
  buildRemoveExpression,
  KEEP_FIELDS,
} = require('./stripAlbumProviderMetadata');

describe('fieldsToStrip', () => {
  it('keeps every KEEP_FIELD and strips nothing on an already-clean row', () => {
    const item = {
      id: '1',
      title: 'OK Computer',
      artist: 'Radiohead',
      rating: 5,
      highlights: 'A masterpiece',
      date: '01-01-2026',
    };
    expect(fieldsToStrip(item)).toEqual([]);
  });

  it('strips thumbnail and the lastfm object (the core backfill fields)', () => {
    const item = {
      id: '2',
      title: 'Kid A',
      artist: 'Radiohead',
      rating: 4,
      highlights: 'Cold and brilliant',
      date: '02-02-2026',
      thumbnail: 'https://lastfm.example/cover.jpg',
      lastfm: { mbid: 'abc', url: 'https://last.fm/kid-a', images: {} },
    };
    expect(fieldsToStrip(item).sort()).toEqual(['lastfm', 'thumbnail']);
  });

  it('strips a partial-schema lastfm-with-url-but-no-images row (the "nothing to backfill" case)', () => {
    // This is the exact shape that fools needsAlbumBackfill: it has lastfm.url set, so it reads as
    // "done", yet no usable thumbnail. Stripping lastfm+thumbnail flips it back to eligible.
    const item = {
      id: '3',
      title: 'In Rainbows',
      artist: 'Radiohead',
      rating: 5,
      highlights: 'Warm',
      date: '03-03-2026',
      thumbnail: '',
      lastfm: { url: 'https://last.fm/in-rainbows', images: {} },
    };
    expect(fieldsToStrip(item).sort()).toEqual(['lastfm', 'thumbnail']);
  });

  it('strips stray legacy fields from any past schema (keep-list, not a fixed target-list)', () => {
    const item = {
      id: '4',
      title: 'Amnesiac',
      artist: 'Radiohead',
      rating: 4,
      highlights: 'B-sides that arent',
      date: '04-04-2026',
      thumbnail: 'x',
      lastfm: { url: 'y' },
      coverImage: 'legacy-field',
      mbid: 'top-level-legacy',
      editedDate: '05-05-2026',
    };
    expect(fieldsToStrip(item).sort()).toEqual(
      ['coverImage', 'editedDate', 'lastfm', 'mbid', 'thumbnail'].sort(),
    );
  });

  it('never lists id among fields to strip (it is the partition key)', () => {
    const item = { id: '5', title: 'T', artist: 'A', thumbnail: 'x' };
    expect(fieldsToStrip(item)).not.toContain('id');
    expect(fieldsToStrip(item)).toEqual(['thumbnail']);
  });

  it('does not require every keep field to be present', () => {
    // A row missing highlights/rating is fine — we only ever REMOVE non-keep fields, never add.
    const item = { id: '6', title: 'T', artist: 'A', date: '01-01-2026', lastfm: { url: 'x' } };
    expect(fieldsToStrip(item)).toEqual(['lastfm']);
  });

  it('KEEP_FIELDS is exactly the owner-authored set', () => {
    expect(KEEP_FIELDS).toEqual(['id', 'title', 'artist', 'rating', 'highlights', 'date']);
  });
});

describe('buildRemoveExpression', () => {
  it('aliases every field so DynamoDB reserved keywords are never used literally', () => {
    const { UpdateExpression, ExpressionAttributeNames } = buildRemoveExpression([
      'thumbnail',
      'lastfm',
    ]);
    expect(UpdateExpression).toBe('REMOVE #f0, #f1');
    expect(UpdateExpression).not.toMatch(/\bthumbnail\b/);
    expect(UpdateExpression).not.toMatch(/\blastfm\b/);
    expect(ExpressionAttributeNames).toEqual({
      '#f0': 'thumbnail',
      '#f1': 'lastfm',
    });
  });
});
