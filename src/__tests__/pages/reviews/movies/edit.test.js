import { render, screen, waitFor } from '@testing-library/react';
import EditMovieReview from '../../../../pages/reviews/movies/edit/[id]';

jest.mock('next/router', () => ({
  useRouter: () => ({ push: jest.fn(), query: { id: 'movie-1' } }),
}));

jest.mock('../../../../components/Header', () => function Header() { return null; });

describe('EditMovieReview', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ id: 'movie-1', title: 'Test Movie', rating: 4, review_text: 'A good movie' }],
    });
  });

  it('renders the MarkdownEditor toolbar for the review field', async () => {
    render(<EditMovieReview />);
    await waitFor(() => expect(screen.getByLabelText('Bold')).toBeInTheDocument());
    expect(screen.getByLabelText('Italic')).toBeInTheDocument();
    expect(screen.getByLabelText('Bullet list')).toBeInTheDocument();
    expect(screen.getByLabelText('Link')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Share your thoughts about this movie...')).toHaveValue('A good movie');
  });
});
