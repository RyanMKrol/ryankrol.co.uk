import { mapHardcoverResult } from './hardcover';

const fullHit = {
  document: {
    id: 'book-123',
    title: 'Dune',
    author_names: ['Frank Herbert'],
    release_year: 1965,
    image: {
      url: 'https://hardcover-cover.com/dune.jpg',
    },
    isbns: ['9780441013593', '0441013597'],
    genres: ['Fiction', 'Science Fiction'],
    pages: 412,
  },
};

describe('mapHardcoverResult', () => {
  it('maps a full hit to the common shape', () => {
    const result = mapHardcoverResult(fullHit);

    expect(result.source).toBe('hardcover');
    expect(result.volumeId).toBe('book-123');
    expect(result.title).toBe('Dune');
    expect(result.authors).toEqual(['Frank Herbert']);
    expect(result.firstPublishedYear).toBe(1965);
    expect(result.coverUrl).toBe('https://hardcover-cover.com/dune.jpg');
    expect(result.isbn).toEqual(['9780441013593', '0441013597']);
    expect(result.subjects).toEqual(['Fiction', 'Science Fiction']);
    expect(result.pageCount).toBe(412);
    expect(result.publisher).toEqual([]);
  });

  it('maps single author correctly', () => {
    const hit = {
      document: {
        id: 'x1',
        title: 'Test',
        author_names: ['John Doe'],
      },
    };
    expect(mapHardcoverResult(hit).authors).toEqual(['John Doe']);
  });

  it('maps multiple authors correctly', () => {
    const hit = {
      document: {
        id: 'x2',
        title: 'Test',
        author_names: ['John Doe', 'Jane Smith', 'Bob Johnson'],
      },
    };
    expect(mapHardcoverResult(hit).authors).toEqual([
      'John Doe',
      'Jane Smith',
      'Bob Johnson',
    ]);
  });

  it('handles missing image object gracefully', () => {
    const hit = {
      document: {
        id: 'x3',
        title: 'Test',
      },
    };
    expect(mapHardcoverResult(hit).coverUrl).toBeNull();
  });

  it('handles null image object gracefully', () => {
    const hit = {
      document: {
        id: 'x4',
        title: 'Test',
        image: null,
      },
    };
    expect(mapHardcoverResult(hit).coverUrl).toBeNull();
  });

  it('handles missing image.url gracefully', () => {
    const hit = {
      document: {
        id: 'x5',
        title: 'Test',
        image: { url: null },
      },
    };
    expect(mapHardcoverResult(hit).coverUrl).toBeNull();
  });

  it('handles missing author_names gracefully', () => {
    const hit = {
      document: {
        id: 'x6',
        title: 'Test',
      },
    };
    expect(mapHardcoverResult(hit).authors).toEqual([]);
  });

  it('handles null author_names gracefully', () => {
    const hit = {
      document: {
        id: 'x7',
        title: 'Test',
        author_names: null,
      },
    };
    expect(mapHardcoverResult(hit).authors).toEqual([]);
  });

  it('handles missing isbns gracefully', () => {
    const hit = {
      document: {
        id: 'x8',
        title: 'Test',
      },
    };
    expect(mapHardcoverResult(hit).isbn).toEqual([]);
  });

  it('handles null isbns gracefully', () => {
    const hit = {
      document: {
        id: 'x9',
        title: 'Test',
        isbns: null,
      },
    };
    expect(mapHardcoverResult(hit).isbn).toEqual([]);
  });

  it('handles missing genres gracefully', () => {
    const hit = {
      document: {
        id: 'x10',
        title: 'Test',
      },
    };
    expect(mapHardcoverResult(hit).subjects).toEqual([]);
  });

  it('handles null genres gracefully', () => {
    const hit = {
      document: {
        id: 'x11',
        title: 'Test',
        genres: null,
      },
    };
    expect(mapHardcoverResult(hit).subjects).toEqual([]);
  });

  it('handles non-numeric pages gracefully (returns null)', () => {
    const hit = {
      document: {
        id: 'x12',
        title: 'Test',
        pages: 'unknown',
      },
    };
    expect(mapHardcoverResult(hit).pageCount).toBeNull();
  });

  it('handles missing pages gracefully', () => {
    const hit = {
      document: {
        id: 'x13',
        title: 'Test',
      },
    };
    expect(mapHardcoverResult(hit).pageCount).toBeNull();
  });

  it('handles null pages gracefully', () => {
    const hit = {
      document: {
        id: 'x14',
        title: 'Test',
        pages: null,
      },
    };
    expect(mapHardcoverResult(hit).pageCount).toBeNull();
  });

  it('always sets publisher to empty array (no publisher field in Hardcover index)', () => {
    const hit = {
      document: {
        id: 'x15',
        title: 'Test',
      },
    };
    expect(mapHardcoverResult(hit).publisher).toEqual([]);
  });

  it('handles sparse document without throwing', () => {
    const hit = {
      document: {
        id: 'sparse-id',
      },
    };
    const result = mapHardcoverResult(hit);

    expect(result.source).toBe('hardcover');
    expect(result.volumeId).toBe('sparse-id');
    expect(result.title).toBeNull();
    expect(result.authors).toEqual([]);
    expect(result.firstPublishedYear).toBeNull();
    expect(result.coverUrl).toBeNull();
    expect(result.isbn).toEqual([]);
    expect(result.subjects).toEqual([]);
    expect(result.pageCount).toBeNull();
    expect(result.publisher).toEqual([]);
  });

  it('handles missing document property gracefully', () => {
    const hit = {};
    const result = mapHardcoverResult(hit);

    expect(result.source).toBe('hardcover');
    expect(result.title).toBeNull();
    expect(result.volumeId).toBeNull();
    expect(result.authors).toEqual([]);
    expect(result.isbn).toEqual([]);
    expect(result.subjects).toEqual([]);
    expect(result.publisher).toEqual([]);
  });

  it('handles null hit gracefully', () => {
    const result = mapHardcoverResult(null);

    expect(result.source).toBe('hardcover');
    expect(result.title).toBeNull();
    expect(result.volumeId).toBeNull();
    expect(result.authors).toEqual([]);
    expect(result.isbn).toEqual([]);
    expect(result.subjects).toEqual([]);
    expect(result.publisher).toEqual([]);
  });

  it('handles undefined hit gracefully', () => {
    const result = mapHardcoverResult(undefined);

    expect(result.source).toBe('hardcover');
    expect(result.title).toBeNull();
    expect(result.volumeId).toBeNull();
    expect(result.authors).toEqual([]);
    expect(result.isbn).toEqual([]);
    expect(result.subjects).toEqual([]);
    expect(result.publisher).toEqual([]);
  });
});
