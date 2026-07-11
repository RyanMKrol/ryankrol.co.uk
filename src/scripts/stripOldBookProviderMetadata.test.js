const {
  fieldsToStrip,
  buildRemoveExpression,
  TARGET_FIELDS,
} = require('./stripOldBookProviderMetadata');

describe('fieldsToStrip', () => {
  it.each(TARGET_FIELDS)('strips %s when present', (field) => {
    const item = { id: '1', title: 'A Book', [field]: 'some-value' };
    expect(fieldsToStrip(item)).toEqual([field]);
  });

  it('strips the legacy olid/coverId Open-Library fields together', () => {
    const item = { id: '2', title: 'Old Book', olid: 'OL123M', coverId: '456' };
    expect(fieldsToStrip(item)).toEqual(['olid', 'coverId']);
  });

  it('strips multiple Hardcover-era-superseded fields present on the same row', () => {
    const item = {
      id: '3',
      title: 'Mixed Book',
      source: 'googlebooks',
      coverUrl: 'https://example.com/cover.jpg',
      volumeId: 'abc123',
      isbn: '9781234567890',
    };
    expect(fieldsToStrip(item)).toEqual(['source', 'coverUrl', 'volumeId', 'isbn']);
  });

  it('leaves a clean row (no old-provider fields) untouched', () => {
    const item = {
      id: '4',
      title: 'Clean Hardcover Book',
      author: 'Someone',
      rating: 4,
      review_text: 'Great',
      date: '01-01-2026',
      hardcoverSynopsis: 'A synopsis',
      hardcoverSlug: 'clean-hardcover-book',
      hardcoverRating: 4.2,
    };
    expect(fieldsToStrip(item)).toEqual([]);
  });
});

describe('buildRemoveExpression', () => {
  it('aliases every field so DynamoDB reserved keywords (e.g. source) are never used literally', () => {
    const { UpdateExpression, ExpressionAttributeNames } = buildRemoveExpression([
      'source',
      'coverUrl',
      'volumeId',
    ]);
    // No raw attribute name may appear in the expression — only #fN aliases.
    expect(UpdateExpression).toBe('REMOVE #f0, #f1, #f2');
    expect(UpdateExpression).not.toMatch(/\bsource\b/);
    expect(ExpressionAttributeNames).toEqual({
      '#f0': 'source',
      '#f1': 'coverUrl',
      '#f2': 'volumeId',
    });
  });

  it('maps each alias back to its original attribute for a single reserved-keyword field', () => {
    const { UpdateExpression, ExpressionAttributeNames } = buildRemoveExpression(['source']);
    expect(UpdateExpression).toBe('REMOVE #f0');
    expect(ExpressionAttributeNames).toEqual({ '#f0': 'source' });
  });
});
