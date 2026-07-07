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
