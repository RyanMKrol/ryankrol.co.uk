const {
  normaliseTitle,
  findConfidentMatch,
  computeUpdateFields,
} = require('./migrateOpenLibraryBooksToGoogleBooks');

const confidentMatchCandidate = {
  source: 'googlebooks',
  volumeId: 'abc123',
  title: 'Dune',
  authors: ['Frank Herbert'],
  firstPublishedYear: 1965,
  coverUrl: 'https://books.google.com/books/content?id=abc123',
  isbn: ['9780441013593'],
  subjects: ['Fiction'],
  pageCount: 412,
  publisher: ['Ace Books'],
};

describe('normaliseTitle', () => {
  it('lowercases and strips punctuation/whitespace', () => {
    expect(normaliseTitle('Dune: Messiah!')).toBe('dune messiah');
    expect(normaliseTitle('  The   Hobbit ')).toBe('the hobbit');
  });
});

describe('findConfidentMatch', () => {
  it('returns the top candidate when its title matches the review title', () => {
    const match = findConfidentMatch('Dune', [confidentMatchCandidate]);
    expect(match).toEqual(confidentMatchCandidate);
  });

  it('returns null when there are no candidates', () => {
    expect(findConfidentMatch('Dune', [])).toBeNull();
  });

  it('returns null when the top candidate title does not match', () => {
    const unrelated = { ...confidentMatchCandidate, title: 'Some Other Book' };
    expect(findConfidentMatch('Dune', [unrelated])).toBeNull();
  });
});

describe('computeUpdateFields', () => {
  it('maps a confident match to the correct update fields, never touching the review text fields', () => {
    const fields = computeUpdateFields(confidentMatchCandidate);

    expect(fields).toEqual({
      source: 'googlebooks',
      volumeId: 'abc123',
      coverUrl: 'https://books.google.com/books/content?id=abc123',
      bookAuthors: ['Frank Herbert'],
      firstPublishedYear: 1965,
      isbn: ['9780441013593'],
      subjects: ['Fiction'],
      pageCount: 412,
      publisher: ['Ace Books'],
    });

    expect(fields).not.toHaveProperty('title');
    expect(fields).not.toHaveProperty('rating');
    expect(fields).not.toHaveProperty('overview');
    expect(fields).not.toHaveProperty('author');
  });
});

describe('migration dry-run behaviour on fixture reviews', () => {
  const fixtureReviews = [
    {
      title: 'Dune',
      author: 'Frank Herbert',
      rating: 5,
      overview: 'A classic.',
      source: 'openlibrary',
      olid: 'OL123M',
      coverId: 456,
    },
    {
      title: 'Some Obscure Book',
      author: 'Unknown Author',
      rating: 3,
      overview: 'Not sure.',
      source: 'openlibrary',
      olid: 'OL999M',
      coverId: 789,
    },
  ];

  const mockSearchResults = {
    Dune: [confidentMatchCandidate],
    'Some Obscure Book': [
      { ...confidentMatchCandidate, title: 'Completely Different Title', volumeId: 'zzz' },
    ],
  };

  it('computes the correct update for a confident match and leaves an unmatched review untouched', () => {
    const updates = fixtureReviews.map((review) => {
      const candidates = mockSearchResults[review.title] || [];
      const match = findConfidentMatch(review.title, candidates);

      if (!match) {
        return { review, matched: false };
      }

      return { review, matched: true, fields: computeUpdateFields(match) };
    });

    const [duneUpdate, obscureUpdate] = updates;

    expect(duneUpdate.matched).toBe(true);
    expect(duneUpdate.fields.volumeId).toBe('abc123');
    expect(duneUpdate.fields).not.toHaveProperty('title');
    expect(duneUpdate.fields).not.toHaveProperty('rating');
    expect(duneUpdate.fields).not.toHaveProperty('overview');

    expect(obscureUpdate.matched).toBe(false);
  });
});
