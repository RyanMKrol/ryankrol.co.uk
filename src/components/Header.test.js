import { render, screen, fireEvent } from '@testing-library/react';

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

// jsdom's native scrollLeft accessor ignores writes (no real layout engine), so replace it with a
// plain writable property the way a real browser's would behave for this purpose.
function stubScrollLeft(nav) {
  Object.defineProperty(nav, 'scrollLeft', { writable: true, configurable: true, value: 0 });
}

test('dragging the nav pill row with the mouse scrolls it left and right', () => {
  const { container } = render(<Header />);
  const nav = container.querySelector('.collection-nav-pills');
  stubScrollLeft(nav);

  fireEvent.mouseDown(nav, { clientX: 200 });
  fireEvent.mouseMove(window, { clientX: 150 }); // dragged 50px right-to-left -> content scrolls right
  fireEvent.mouseUp(window);
  expect(nav.scrollLeft).toBe(50);

  fireEvent.mouseDown(nav, { clientX: 150 });
  fireEvent.mouseMove(window, { clientX: 220 }); // dragged 70px left-to-right -> content scrolls left
  fireEvent.mouseUp(window);
  expect(nav.scrollLeft).toBe(-20);
});

test('a drag past the click threshold suppresses navigation on mouseup', () => {
  const { container } = render(<Header />);
  const nav = container.querySelector('.collection-nav-pills');
  stubScrollLeft(nav);
  const firstPill = screen.getByText('books').closest('a');

  fireEvent.mouseDown(nav, { clientX: 200 });
  fireEvent.mouseMove(window, { clientX: 140 });
  fireEvent.mouseUp(window);

  const notPrevented = fireEvent.click(firstPill);
  expect(notPrevented).toBe(false);
});

test('a plain click (no meaningful movement) still navigates normally', () => {
  const { container } = render(<Header />);
  const nav = container.querySelector('.collection-nav-pills');
  stubScrollLeft(nav);
  const firstPill = screen.getByText('books').closest('a');

  fireEvent.mouseDown(nav, { clientX: 200 });
  fireEvent.mouseMove(window, { clientX: 202 });
  fireEvent.mouseUp(window);

  const notPrevented = fireEvent.click(firstPill);
  expect(notPrevented).toBe(true);
});
