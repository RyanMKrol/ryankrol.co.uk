import { render, screen } from '@testing-library/react';
import AddBookReview from '../../../../pages/reviews/books/add';

jest.mock('next/router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('../../../../components/Header', () => function Header() { return null; });

describe('AddBookReview', () => {
  it('renders the MarkdownEditor toolbar for the review field', () => {
    render(<AddBookReview />);
    expect(screen.getByLabelText('Bold')).toBeInTheDocument();
    expect(screen.getByLabelText('Italic')).toBeInTheDocument();
    expect(screen.getByLabelText('Bullet list')).toBeInTheDocument();
    expect(screen.getByLabelText('Link')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Share your thoughts about this book...')).toBeInTheDocument();
  });
});
