import { render, screen, waitFor } from '@testing-library/react';
import EditBookReview from '../../../../pages/reviews/books/edit/[id]';

jest.mock('next/router', () => ({
  useRouter: () => ({ push: jest.fn(), query: { id: 'book-1' } }),
}));

jest.mock('../../../../components/Header', () => function Header() { return null; });

describe('EditBookReview', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ id: 'book-1', title: 'Test Book', author: 'Test Author', rating: 4, review_text: 'A good book' }],
    });
  });

  it('renders the MarkdownEditor toolbar for the review field', async () => {
    render(<EditBookReview />);
    await waitFor(() => expect(screen.getByLabelText('Bold')).toBeInTheDocument());
    expect(screen.getByLabelText('Italic')).toBeInTheDocument();
    expect(screen.getByLabelText('Bullet list')).toBeInTheDocument();
    expect(screen.getByLabelText('Link')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Share your thoughts about this book...')).toHaveValue('A good book');
  });
});
