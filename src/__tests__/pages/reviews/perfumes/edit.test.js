import { render, screen, waitFor } from '@testing-library/react';
import EditPerfumeReview from '../../../../pages/reviews/perfumes/edit/[id]';

jest.mock('next/router', () => ({
  useRouter: () => ({ push: jest.fn(), query: { id: 'perfume-1' } }),
}));

jest.mock('../../../../components/Header', () => function Header() { return null; });

describe('EditPerfumeReview', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [{
        id: 'perfume-1',
        title: 'Test Perfume',
        designer: 'Test Designer',
        rating: 8,
        description: 'A lovely scent',
      }],
    });
  });

  it('renders the MarkdownEditor toolbar for the description field', async () => {
    render(<EditPerfumeReview />);
    await waitFor(() => expect(screen.getByLabelText('Bold')).toBeInTheDocument());
    expect(screen.getByLabelText('Italic')).toBeInTheDocument();
    expect(screen.getByLabelText('Bullet list')).toBeInTheDocument();
    expect(screen.getByLabelText('Link')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toHaveValue('A lovely scent');
  });
});
