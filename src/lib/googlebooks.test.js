import { mapGoogleBooksResult } from './googlebooks';

const fullVolume = {
  id: 'abc123',
  volumeInfo: {
    title: 'Dune',
    authors: ['Frank Herbert'],
    publishedDate: '1965-08-01',
    imageLinks: {
      thumbnail: 'http://books.google.com/books/content?id=abc123&zoom=1',
      smallThumbnail: 'http://books.google.com/books/content?id=abc123&zoom=5',
    },
    industryIdentifiers: [
      { type: 'ISBN_13', identifier: '9780441013593' },
      { type: 'ISBN_10', identifier: '0441013597' },
    ],
    categories: ['Fiction', 'Science Fiction'],
    pageCount: 412,
    publisher: 'Ace Books',
  },
};

describe('mapGoogleBooksResult', () => {
  it('maps a full volume to the common shape', () => {
    const result = mapGoogleBooksResult(fullVolume);

    expect(result.source).toBe('googlebooks');
    expect(result.volumeId).toBe('abc123');
    expect(result.title).toBe('Dune');
    expect(result.authors).toEqual(['Frank Herbert']);
    expect(result.firstPublishedYear).toBe(1965);
    expect(result.coverUrl).toBe(
      'https://books.google.com/books/content?id=abc123&zoom=1'
    );
    expect(result.isbn).toEqual(['9780441013593', '0441013597']);
    expect(result.subjects).toEqual(['Fiction', 'Science Fiction']);
    expect(result.pageCount).toBe(412);
    expect(result.publisher).toEqual(['Ace Books']);
  });

  it('forces coverUrl to https', () => {
    const result = mapGoogleBooksResult(fullVolume);
    expect(result.coverUrl).toMatch(/^https:\/\//);
  });

  it('parses year from publishedDate with only year string', () => {
    const vol = { id: 'x', volumeInfo: { publishedDate: '2001' } };
    expect(mapGoogleBooksResult(vol).firstPublishedYear).toBe(2001);
  });

  it('handles sparse volume without throwing', () => {
    const result = mapGoogleBooksResult({ id: 'sparse', volumeInfo: {} });

    expect(result.source).toBe('googlebooks');
    expect(result.volumeId).toBe('sparse');
    expect(result.title).toBeNull();
    expect(result.authors).toEqual([]);
    expect(result.firstPublishedYear).toBeNull();
    expect(result.coverUrl).toBeNull();
    expect(result.isbn).toEqual([]);
    expect(result.subjects).toEqual([]);
    expect(result.pageCount).toBeNull();
    expect(result.publisher).toEqual([]);
  });

  it('handles completely missing volumeInfo without throwing', () => {
    const result = mapGoogleBooksResult({});
    expect(result.source).toBe('googlebooks');
    expect(result.title).toBeNull();
  });

  it('handles null/undefined input without throwing', () => {
    expect(() => mapGoogleBooksResult(null)).not.toThrow();
    expect(() => mapGoogleBooksResult(undefined)).not.toThrow();
  });

  it('uses smallThumbnail when thumbnail is absent', () => {
    const vol = {
      id: 'y',
      volumeInfo: {
        imageLinks: { smallThumbnail: 'http://books.google.com/small' },
      },
    };
    expect(mapGoogleBooksResult(vol).coverUrl).toBe('https://books.google.com/small');
  });
});
