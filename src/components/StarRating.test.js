import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StarRating from './StarRating';

test('readOnly renders 5 non-interactive stars, the right number filled, and no rating text', () => {
  const { container } = render(<StarRating rating={3} readOnly />);
  expect(container.querySelectorAll('span.star-button')).toHaveLength(5);
  expect(container.querySelectorAll('span.star-button.filled')).toHaveLength(3);
  expect(container.querySelectorAll('button')).toHaveLength(0);
  expect(screen.queryByText('3/5')).toBeNull();
});

test('interactive renders 5 buttons + rating text and reports a click', async () => {
  const onRatingChange = jest.fn();
  render(<StarRating rating={2} onRatingChange={onRatingChange} />);
  const buttons = screen.getAllByRole('button');
  expect(buttons).toHaveLength(5);
  expect(screen.getByText('2/5')).toBeInTheDocument();
  await userEvent.setup().click(buttons[2]); // the 3rd star
  expect(onRatingChange).toHaveBeenCalledWith(3);
});

test('hovering a star previews the fill up to it', async () => {
  render(<StarRating rating={0} onRatingChange={() => {}} />);
  const buttons = screen.getAllByRole('button');
  await userEvent.setup().hover(buttons[3]); // the 4th star
  expect(document.querySelectorAll('button.star-button.filled')).toHaveLength(4);
});
