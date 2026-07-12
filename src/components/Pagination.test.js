import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Pagination from './Pagination';

test('renders nothing when there is one page or fewer', () => {
  const { container } = render(<Pagination currentPage={1} totalPages={1} onPageChange={() => {}} />);
  expect(container).toBeEmptyDOMElement();
});

test('keeps first, last, a window around current, and shows ellipsis for the gaps', () => {
  render(<Pagination currentPage={5} totalPages={10} onPageChange={() => {}} />);
  ['1', '4', '5', '6', '10'].forEach((n) => expect(screen.getByRole('button', { name: n })).toBeInTheDocument());
  // 1 ‹gap› 4 5 6 ‹gap› 10 → two ellipsis markers
  expect(document.querySelectorAll('.collection-pagination-ellipsis')).toHaveLength(2);
});

test('clicking a numbered pill reports the right page and no next control renders', async () => {
  const onPageChange = jest.fn();
  const user = userEvent.setup();
  render(<Pagination currentPage={5} totalPages={10} onPageChange={onPageChange} />);
  await user.click(screen.getByRole('button', { name: '6' }));
  expect(onPageChange).toHaveBeenCalledWith(6);
  expect(screen.queryByRole('button', { name: /next/i })).toBeNull();
});

test('the current page pill is marked active', () => {
  render(<Pagination currentPage={5} totalPages={10} onPageChange={() => {}} />);
  expect(screen.getByRole('button', { name: '5' })).toHaveClass('active');
  expect(screen.getByRole('button', { name: '4' })).not.toHaveClass('active');
});
