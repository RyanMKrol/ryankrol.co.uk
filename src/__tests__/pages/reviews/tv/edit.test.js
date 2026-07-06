import { render, screen, waitFor } from '@testing-library/react';
import EditTVReview from '../../../../pages/reviews/tv/edit/[id]';

jest.mock('next/router', () => ({
  useRouter: () => ({ push: jest.fn(), query: { id: 'tv-1' } }),
}));

jest.mock('../../../../components/Header', () => function Header() { return null; });

describe('EditTVReview', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ id: 'tv-1', title: 'Test Show', rating: 4, review_text: 'A good show' }],
    });
  });

  it('renders the MarkdownEditor toolbar for the review field', async () => {
    render(<EditTVReview />);
    await waitFor(() => expect(screen.getByLabelText('Bold')).toBeInTheDocument());
    expect(screen.getByLabelText('Italic')).toBeInTheDocument();
    expect(screen.getByLabelText('Bullet list')).toBeInTheDocument();
    expect(screen.getByLabelText('Link')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Share your thoughts about this TV show...')).toHaveValue('A good show');
  });
});
