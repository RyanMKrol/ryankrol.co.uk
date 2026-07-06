import { render, screen } from '@testing-library/react';
import NowPlaying from './NowPlaying';

afterEach(() => { jest.restoreAllMocks(); });

test('renders the current track (linked) when something is playing', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ isPlaying: true, track: { name: 'Time (You and I)', artist: 'Khruangbin', lastFmUrl: 'https://www.last.fm/x' } }),
  });
  render(<NowPlaying />);
  const link = await screen.findByRole('link', { name: /Time \(You and I\) by Khruangbin/ });
  expect(link).toHaveAttribute('href', 'https://www.last.fm/x');
});

test('renders the idle state when nothing is playing', async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ isPlaying: false }) });
  render(<NowPlaying />);
  expect(await screen.findByText(/not listening rn/)).toBeInTheDocument();
});
