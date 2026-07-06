import { render, screen } from '@testing-library/react';

// Header uses next/router (active-section highlight) + next/link (nav) + a ResizeObserver
// (scroll-fade) + renders NowPlaying (which fetches). Stub the platform bits so we can assert the
// nav links themselves; mock next/link to a plain anchor so we can read hrefs directly.
jest.mock('next/router', () => ({ useRouter: () => ({ pathname: '/', push: jest.fn() }) }));
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }) => <a href={typeof href === 'string' ? href : href?.pathname}>{children}</a>,
}));

import Header from './Header';

beforeAll(() => {
  global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ isPlaying: false }) });
});
afterAll(() => { jest.restoreAllMocks(); });

test('renders every nav section as a link to its route', () => {
  render(<Header />);
  const expected = [
    ['books', '/reviews/books'], ['movies', '/reviews/movies'], ['tv', '/reviews/tv'],
    ['albums', '/reviews/albums'], ['perfumes', '/reviews/perfumes'], ['vinyl', '/vinyl'],
    ['workouts', '/workouts'], ['listening', '/listening'], ['projects', '/projects'],
    ['hot takes', '/hot-takes'],
  ];
  for (const [label, href] of expected) {
    expect(screen.getByText(label).closest('a')).toHaveAttribute('href', href);
  }
});
