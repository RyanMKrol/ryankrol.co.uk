import { mapHardcoverResult, mapHardcoverDetails, fetchHardcoverBookDetails } from './hardcover';

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

describe('mapHardcoverDetails', () => {
  it('maps a well-formed book details response with all fields', () => {
    const book = {
      id: 'book-456',
      description: 'An epic science fiction saga.',
      slug: 'horus-rising-graham-mcneill',
      rating: 4.5,
      book_series: [
        {
          position: 1,
          series: {
            name: 'The Horus Heresy',
          },
        },
      ],
    };

    const result = mapHardcoverDetails(book);

    expect(result.hardcoverSynopsis).toBe('An epic science fiction saga.');
    expect(result.hardcoverSlug).toBe('horus-rising-graham-mcneill');
    expect(result.hardcoverRating).toBe(4.5);
    expect(result.seriesName).toBe('The Horus Heresy');
    expect(result.seriesPosition).toBe(1);
  });

  it('omits description when it is null', () => {
    const book = {
      id: 'book-1',
      description: null,
      slug: 'test-slug',
      rating: 3,
      book_series: [],
    };

    const result = mapHardcoverDetails(book);

    expect(result.hardcoverSynopsis).toBeUndefined();
    expect(result.hardcoverSlug).toBe('test-slug');
  });

  it('omits description when it is an empty string', () => {
    const book = {
      id: 'book-2',
      description: '   ',
      slug: 'another-slug',
      rating: 4,
      book_series: [],
    };

    const result = mapHardcoverDetails(book);

    expect(result.hardcoverSynopsis).toBeUndefined();
    expect(result.hardcoverSlug).toBe('another-slug');
  });

  it('omits slug when it is missing', () => {
    const book = {
      id: 'book-3',
      description: 'A great book.',
      rating: 4.2,
      book_series: [],
    };

    const result = mapHardcoverDetails(book);

    expect(result.hardcoverSynopsis).toBe('A great book.');
    expect(result.hardcoverSlug).toBeUndefined();
  });

  it('omits rating when it is not a number', () => {
    const book = {
      id: 'book-4',
      description: 'Another book.',
      slug: 'book-4-slug',
      rating: 'not-a-number',
      book_series: [],
    };

    const result = mapHardcoverDetails(book);

    expect(result.hardcoverRating).toBeUndefined();
  });

  it('omits rating when it is null', () => {
    const book = {
      id: 'book-5',
      description: 'Yet another book.',
      slug: 'book-5-slug',
      rating: null,
      book_series: [],
    };

    const result = mapHardcoverDetails(book);

    expect(result.hardcoverRating).toBeUndefined();
  });

  it('omits series fields when book_series is empty', () => {
    const book = {
      id: 'book-6',
      description: 'Standalone novel.',
      slug: 'standalone-novel',
      rating: 3.8,
      book_series: [],
    };

    const result = mapHardcoverDetails(book);

    expect(result.seriesName).toBeUndefined();
    expect(result.seriesPosition).toBeUndefined();
    expect(result.hardcoverSynopsis).toBe('Standalone novel.');
  });

  it('omits seriesName when series.name is missing or whitespace', () => {
    const book = {
      id: 'book-7',
      description: 'Part of a series.',
      slug: 'series-book',
      rating: 4.0,
      book_series: [
        {
          position: 2,
          series: {
            name: '   ',
          },
        },
      ],
    };

    const result = mapHardcoverDetails(book);

    expect(result.seriesName).toBeUndefined();
    expect(result.seriesPosition).toBe(2);
  });

  it('omits seriesPosition when it is not a number', () => {
    const book = {
      id: 'book-8',
      description: 'Another series book.',
      slug: 'series-book-2',
      rating: 4.1,
      book_series: [
        {
          position: 'unknown',
          series: {
            name: 'Some Series',
          },
        },
      ],
    };

    const result = mapHardcoverDetails(book);

    expect(result.seriesName).toBe('Some Series');
    expect(result.seriesPosition).toBeUndefined();
  });

  it('handles book_series being null', () => {
    const book = {
      id: 'book-9',
      description: 'A book.',
      slug: 'book-9',
      rating: 3.5,
      book_series: null,
    };

    const result = mapHardcoverDetails(book);

    expect(result.seriesName).toBeUndefined();
    expect(result.seriesPosition).toBeUndefined();
  });

  it('handles book_series[0].series being null', () => {
    const book = {
      id: 'book-10',
      description: 'A book.',
      slug: 'book-10',
      rating: 3.5,
      book_series: [
        {
          position: 3,
          series: null,
        },
      ],
    };

    const result = mapHardcoverDetails(book);

    expect(result.seriesName).toBeUndefined();
    expect(result.seriesPosition).toBe(3);
  });

  it('strips whitespace from description and slug', () => {
    const book = {
      id: 'book-11',
      description: '  A well-trimmed description.  ',
      slug: '  trimmed-slug  ',
      rating: 4.3,
      book_series: [],
    };

    const result = mapHardcoverDetails(book);

    expect(result.hardcoverSynopsis).toBe('A well-trimmed description.');
    expect(result.hardcoverSlug).toBe('trimmed-slug');
  });

  it('handles an empty book object', () => {
    const book = {};

    const result = mapHardcoverDetails(book);

    expect(result).toEqual({});
  });

  it('returns only the fields that are present in a degraded response', () => {
    const book = {
      id: 'book-12',
      slug: 'partial-book',
      // Missing: description, rating, book_series
    };

    const result = mapHardcoverDetails(book);

    expect(result).toEqual({
      hardcoverSlug: 'partial-book',
    });
    expect(result.hardcoverSynopsis).toBeUndefined();
    expect(result.hardcoverRating).toBeUndefined();
    expect(result.seriesName).toBeUndefined();
    expect(result.seriesPosition).toBeUndefined();
  });
});

describe('fetchHardcoverBookDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    delete global.fetch;
  });

  it('returns an empty object when bookId is null', async () => {
    const result = await fetchHardcoverBookDetails(null);
    expect(result).toEqual({});
  });

  it('returns an empty object when bookId is undefined', async () => {
    const result = await fetchHardcoverBookDetails(undefined);
    expect(result).toEqual({});
  });

  it('returns an empty object when bookId is not a string', async () => {
    const result = await fetchHardcoverBookDetails(123);
    expect(result).toEqual({});
  });

  it('returns an empty object when HARDCOVER_API_TOKEN is not set', async () => {
    const oldToken = process.env.HARDCOVER_API_TOKEN;
    delete process.env.HARDCOVER_API_TOKEN;

    const result = await fetchHardcoverBookDetails('book-id');

    expect(result).toEqual({});

    process.env.HARDCOVER_API_TOKEN = oldToken;
  });

  it('fetches and maps book details successfully', async () => {
    process.env.HARDCOVER_API_TOKEN = 'test-token';

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          books: [
            {
              id: 'book-123',
              description: 'An epic tale.',
              slug: 'epic-tale',
              rating: 4.7,
              book_series: [
                {
                  position: 1,
                  series: {
                    name: 'Epic Saga',
                  },
                },
              ],
            },
          ],
        },
      }),
    });

    const result = await fetchHardcoverBookDetails('book-123');

    expect(result.hardcoverSynopsis).toBe('An epic tale.');
    expect(result.hardcoverSlug).toBe('epic-tale');
    expect(result.hardcoverRating).toBe(4.7);
    expect(result.seriesName).toBe('Epic Saga');
    expect(result.seriesPosition).toBe(1);

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.hardcover.app/v1/graphql',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-token',
        }),
      })
    );
  });

  it('returns an empty object when API returns a non-ok status', async () => {
    process.env.HARDCOVER_API_TOKEN = 'test-token';

    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    });

    const result = await fetchHardcoverBookDetails('book-id');

    expect(result).toEqual({});
  });

  it('returns an empty object when API returns GraphQL errors', async () => {
    process.env.HARDCOVER_API_TOKEN = 'test-token';

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        errors: [{ message: 'Book not found' }],
      }),
    });

    const result = await fetchHardcoverBookDetails('nonexistent-book');

    expect(result).toEqual({});
  });

  it('returns an empty object when books array is empty', async () => {
    process.env.HARDCOVER_API_TOKEN = 'test-token';

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          books: [],
        },
      }),
    });

    const result = await fetchHardcoverBookDetails('book-id');

    expect(result).toEqual({});
  });

  it('handles a degraded response with missing fields', async () => {
    process.env.HARDCOVER_API_TOKEN = 'test-token';

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          books: [
            {
              id: 'book-456',
              slug: 'degraded-book',
              // Missing: description, rating, book_series
            },
          ],
        },
      }),
    });

    const result = await fetchHardcoverBookDetails('book-456');

    expect(result).toEqual({
      hardcoverSlug: 'degraded-book',
    });
  });

  it('returns an empty object when fetch throws an error', async () => {
    process.env.HARDCOVER_API_TOKEN = 'test-token';

    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await fetchHardcoverBookDetails('book-id');

    expect(result).toEqual({});
  });

  it('sends the correct GraphQL query with variables', async () => {
    process.env.HARDCOVER_API_TOKEN = 'test-token';

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          books: [],
        },
      }),
    });

    await fetchHardcoverBookDetails('book-xyz');

    const callArgs = global.fetch.mock.calls[0];
    const body = JSON.parse(callArgs[1].body);

    expect(body.variables).toEqual({ id: 'book-xyz' });
    expect(body.query).toContain('BookDetails');
    expect(body.query).toContain('books');
  });
});
