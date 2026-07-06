import { render, screen } from '@testing-library/react';
import AddAlbumReview from '../../../../pages/reviews/albums/add';

jest.mock('next/router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('../../../../components/Header', () => function Header() { return null; });

describe('AddAlbumReview', () => {
  it('renders the MarkdownEditor toolbar for the highlights field', () => {
    render(<AddAlbumReview />);
    expect(screen.getByLabelText('Bold')).toBeInTheDocument();
    expect(screen.getByLabelText('Italic')).toBeInTheDocument();
    expect(screen.getByLabelText('Bullet list')).toBeInTheDocument();
    expect(screen.getByLabelText('Link')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Share your favorite tracks from this album...')).toBeInTheDocument();
  });
});
