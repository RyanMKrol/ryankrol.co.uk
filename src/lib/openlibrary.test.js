import { mapBookResult, bookCoverUrl } from './openlibrary';

const fullDoc = {
  key: '/works/OL45883W',
  cover_edition_key: 'OL7353617M',
  title: 'Dune',
  author_name: ['Frank Herbert'],
  first_publish_year: 1965,
  cover_i: 6707123,
  isbn: ['9780441013593', '0441013597'],
  subject: ['Science fiction', 'Desert planets'],
  number_of_pages_median: 412,
  publisher: ['Ace Books'],
};

describe('mapBookResult', () => {
  it('maps the full rich set from a complete doc', () => {
    expect(mapBookResult(fullDoc)).toEqual({
      olid: 'OL7353617M',
      title: 'Dune',
      authors: ['Frank Herbert'],
      firstPublishedYear: 1965,
      coverId: 6707123,
      isbn: ['9780441013593', '0441013597'],
      subjects: ['Science fiction', 'Desert planets'],
      pageCount: 412,
      publisher: ['Ace Books'],
    });
  });

  it('derives olid from key when cover_edition_key is absent', () => {
    const doc = { ...fullDoc, cover_edition_key: undefined };
    expect(mapBookResult(doc).olid).toBe('OL45883W');
  });

  it('returns null coverId when cover_i is missing', () => {
    const doc = { ...fullDoc, cover_i: undefined };
    expect(mapBookResult(doc).coverId).toBeNull();
  });

  it('returns empty arrays for missing array fields', () => {
    const doc = { title: 'Minimal', key: '/works/OL1W' };
    const result = mapBookResult(doc);
    expect(result.authors).toEqual([]);
    expect(result.isbn).toEqual([]);
    expect(result.subjects).toEqual([]);
    expect(result.publisher).toEqual([]);
  });

  it('returns null for missing scalar fields', () => {
    const doc = { key: '/works/OL1W' };
    const result = mapBookResult(doc);
    expect(result.title).toBeNull();
    expect(result.firstPublishedYear).toBeNull();
    expect(result.pageCount).toBeNull();
  });

  it('maps title and authors from a typical doc', () => {
    const result = mapBookResult(fullDoc);
    expect(result.title).toBe('Dune');
    expect(result.authors).toEqual(['Frank Herbert']);
    expect(result.firstPublishedYear).toBe(1965);
  });
});

describe('bookCoverUrl', () => {
  it('builds the expected covers.openlibrary.org URL', () => {
    expect(bookCoverUrl(6707123, 'M')).toBe(
      'https://covers.openlibrary.org/b/id/6707123-M.jpg'
    );
  });

  it('defaults size to M', () => {
    expect(bookCoverUrl(6707123)).toBe(
      'https://covers.openlibrary.org/b/id/6707123-M.jpg'
    );
  });

  it('supports L size', () => {
    expect(bookCoverUrl(6707123, 'L')).toBe(
      'https://covers.openlibrary.org/b/id/6707123-L.jpg'
    );
  });

  it('returns null for null coverId', () => {
    expect(bookCoverUrl(null)).toBeNull();
  });

  it('returns null for undefined coverId', () => {
    expect(bookCoverUrl(undefined)).toBeNull();
  });

  it('returns null for zero coverId', () => {
    expect(bookCoverUrl(0)).toBeNull();
  });
});
