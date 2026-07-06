import { render, screen } from '@testing-library/react';
import AddPerfumeReview from '../../../../pages/reviews/perfumes/add';

jest.mock('next/router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('../../../../components/Header', () => function Header() { return null; });

describe('AddPerfumeReview', () => {
  it('renders the MarkdownEditor toolbar for the description field', () => {
    render(<AddPerfumeReview />);
    expect(screen.getByLabelText('Bold')).toBeInTheDocument();
    expect(screen.getByLabelText('Italic')).toBeInTheDocument();
    expect(screen.getByLabelText('Bullet list')).toBeInTheDocument();
    expect(screen.getByLabelText('Link')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Share your thoughts about this perfume...')).toBeInTheDocument();
  });
});
