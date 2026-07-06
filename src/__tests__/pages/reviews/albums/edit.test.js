import { render, screen, waitFor } from '@testing-library/react';
import EditAlbumReview from '../../../../pages/reviews/albums/edit/[id]';

jest.mock('next/router', () => ({
  useRouter: () => ({ push: jest.fn(), query: { id: 'album-1' } }),
}));

jest.mock('../../../../components/Header', () => function Header() { return null; });

describe('EditAlbumReview', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ id: 'album-1', title: 'Test Album', artist: 'Test Artist', rating: 4, highlights: 'Great tracks' }],
    });
  });

  it('renders the MarkdownEditor toolbar for the highlights field', async () => {
    render(<EditAlbumReview />);
    await waitFor(() => expect(screen.getByLabelText('Bold')).toBeInTheDocument());
    expect(screen.getByLabelText('Italic')).toBeInTheDocument();
    expect(screen.getByLabelText('Bullet list')).toBeInTheDocument();
    expect(screen.getByLabelText('Link')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Share your favorite tracks from this album...')).toHaveValue('Great tracks');
  });
});
