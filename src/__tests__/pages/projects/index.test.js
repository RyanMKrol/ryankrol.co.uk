import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProjectsPage from '../../../pages/projects/index';

// The tag-filter logic lives inline in the page, so exercise it through the page. Header is mocked
// out (it pulls in router/ResizeObserver/NowPlaying — irrelevant here), matching the repo's other
// page tests. Only /api/github/repos needs stubbing.
jest.mock('../../../components/Header', () => function Header() { return null; });

const REPOS = {
  repos: [
    { name: 'alpha', description: 'a react app', url: '#', language: 'JavaScript', stars: 5, forks: 1, lastPush: '2026-01-01T00:00:00Z', createdAt: '2020-01-01T00:00:00Z', isPrivate: false, topics: ['react'], archived: false, commitCount: 10 },
    { name: 'beta', description: 'a next app', url: '#', language: 'TypeScript', stars: 3, forks: 0, lastPush: '2026-02-01T00:00:00Z', createdAt: '2020-01-01T00:00:00Z', isPrivate: false, topics: ['nextjs'], archived: false, commitCount: 20 },
    { name: 'gamma', description: 'react + next', url: '#', language: 'JavaScript', stars: 1, forks: 0, lastPush: '2026-03-01T00:00:00Z', createdAt: '2020-01-01T00:00:00Z', isPrivate: false, topics: ['react', 'nextjs'], archived: false, commitCount: 5 },
  ],
  total: 3, username: 'RyanMKrol',
};

beforeEach(() => { global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => REPOS }); });
afterEach(() => { jest.restoreAllMocks(); });

test('renders a card per repo, narrows on a tag filter, and restores when cleared', async () => {
  const user = userEvent.setup();
  render(<ProjectsPage />);
  await waitFor(() => expect(document.querySelectorAll('.project-card')).toHaveLength(3));

  // Filter by the "react" tag → only the two react-tagged repos remain, and the pill is active.
  await user.click(screen.getByRole('button', { name: 'react' }));
  expect(document.querySelectorAll('.project-card')).toHaveLength(2);
  expect(screen.getByRole('button', { name: 'react' })).toHaveClass('active');

  // Clearing the tag restores the full set.
  await user.click(screen.getByRole('button', { name: 'react' }));
  expect(document.querySelectorAll('.project-card')).toHaveLength(3);
});
