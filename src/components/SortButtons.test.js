import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SortButtons from './SortButtons';

const FIELDS = [
  { key: 'date', label: 'date', defaultValue: 'date', flippedValue: 'date-asc', defaultArrow: '↓', flippedArrow: '↑' },
  { key: 'title', label: 'title', defaultValue: 'title', flippedValue: 'title-desc', defaultArrow: '↑', flippedArrow: '↓' },
];

test('clicking the active field in its default direction flips it', async () => {
  const onChange = jest.fn();
  render(<SortButtons fields={FIELDS} sortBy="date" onChange={onChange} />);
  await userEvent.setup().click(screen.getByRole('button', { name: /date/ }));
  expect(onChange).toHaveBeenCalledWith('date-asc');
});

test('clicking the active field in its flipped direction returns to default', async () => {
  const onChange = jest.fn();
  render(<SortButtons fields={FIELDS} sortBy="date-asc" onChange={onChange} />);
  await userEvent.setup().click(screen.getByRole('button', { name: /date/ }));
  expect(onChange).toHaveBeenCalledWith('date');
});

test('clicking an inactive field activates it at its default direction', async () => {
  const onChange = jest.fn();
  render(<SortButtons fields={FIELDS} sortBy="date" onChange={onChange} />);
  await userEvent.setup().click(screen.getByRole('button', { name: /title/ }));
  expect(onChange).toHaveBeenCalledWith('title');
});

test('only the active field has the active class + an arrow', () => {
  render(<SortButtons fields={FIELDS} sortBy="date" onChange={() => {}} />);
  const dateBtn = screen.getByRole('button', { name: /date/ });
  const titleBtn = screen.getByRole('button', { name: /title/ });
  expect(dateBtn).toHaveClass('active');
  expect(dateBtn.querySelector('.sort-arrow')).toBeInTheDocument();
  expect(titleBtn).not.toHaveClass('active');
  expect(titleBtn.querySelector('.sort-arrow')).toBeNull();
});
