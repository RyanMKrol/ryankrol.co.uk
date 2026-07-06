import { render, screen } from '@testing-library/react';
import AddTvReview from '../../../../pages/reviews/tv/add';

jest.mock('next/router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('../../../../components/Header', () => function Header() { return null; });

describe('AddTvReview', () => {
  it('renders the MarkdownEditor toolbar for the review field', () => {
    render(<AddTvReview />);
    expect(screen.getByLabelText('Bold')).toBeInTheDocument();
    expect(screen.getByLabelText('Italic')).toBeInTheDocument();
    expect(screen.getByLabelText('Bullet list')).toBeInTheDocument();
    expect(screen.getByLabelText('Link')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Share your thoughts about this TV show...')).toBeInTheDocument();
  });
});
