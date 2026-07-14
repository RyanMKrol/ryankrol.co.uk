import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReviewCard from './ReviewCard';

describe('ReviewCard spine-cover variant', () => {
  it('renders markdown in the review text as real elements, not raw syntax', () => {
    const item = {
      id: 'book-1',
      title: 'Piranesi',
      author: 'Susanna Clarke',
      rating: 5,
      review_text: '**bold** opening line about the House.',
      date: '01-01-2026',
    };

    render(<ReviewCard item={item} type="book" styleVariant="spine-cover" />);

    expect(screen.getByText('bold').tagName).toBe('STRONG');
    expect(screen.queryByText(/\*\*bold\*\*/)).toBeNull();
  });

  it('renders markdown in both the truncated preview and the expanded view', async () => {
    const user = userEvent.setup();
    const filler = 'word '.repeat(60).trim();
    const item = {
      id: 'book-2',
      title: 'The Left Hand of Darkness',
      author: 'Ursula K. Le Guin',
      rating: 4,
      review_text: `**bold** ${filler} - the craft on display here is staggering.`,
      date: '01-01-2026',
    };

    render(<ReviewCard item={item} type="book" styleVariant="spine-cover" />);

    expect(screen.getByText('bold').tagName).toBe('STRONG');
    expect(screen.queryByText(/\*\*bold\*\*/)).toBeNull();

    const expandButton = screen.getByRole('button', { name: 'Read more' });
    await user.click(expandButton);

    expect(screen.getByText('bold').tagName).toBe('STRONG');
    expect(screen.queryByText(/\*\*bold\*\*/)).toBeNull();
    expect(screen.getByRole('button', { name: 'Show less' })).toBeInTheDocument();
  });
});

describe('ReviewCard poster-banner variant', () => {
  it('renders markdown (bold, italic, list) in the review text as real elements', () => {
    const item = {
      id: 'movie-1',
      title: 'The Grand Budapest Hotel',
      rating: 5,
      review_text: '**Wes Anderson** at his most *precise*.\n\n- symmetry\n- pastel colours',
      date: '01-01-2026',
    };

    render(<ReviewCard item={item} type="movie" styleVariant="poster-banner" />);

    expect(screen.getByText('Wes Anderson').tagName).toBe('STRONG');
    expect(screen.getByText('precise').tagName).toBe('EM');
    const list = screen.getByText('symmetry').closest('ul');
    expect(list).not.toBeNull();
    expect(list.querySelectorAll('li')).toHaveLength(2);
  });
});

describe('ReviewCard square-cover variant (inline mode)', () => {
  it('renders bold/italic within a highlight but strips block-level list syntax to flat text', () => {
    const item = {
      id: 'album-1',
      title: 'In Rainbows',
      artist: 'Radiohead',
      rating: 5,
      highlights: '**Weird Fishes**, - 15 Step, _Reckoner_',
      date: '01-01-2026',
    };

    render(<ReviewCard item={item} type="album" styleVariant="square-cover" />);

    expect(screen.getByText('Weird Fishes').tagName).toBe('STRONG');
    expect(screen.getByText('Reckoner').tagName).toBe('EM');
    expect(screen.getByText(/15 Step/)).toBeInTheDocument();
    expect(document.querySelector('ul')).toBeNull();
    expect(document.querySelector('li')).toBeNull();
  });
});
