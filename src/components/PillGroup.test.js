import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PillGroup from './PillGroup';

const OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'push', label: 'Push' },
  { value: 'pull', label: 'Pull' },
];

test('renders one pill per option', () => {
  render(<PillGroup options={OPTIONS} value="all" onChange={() => {}} />);
  expect(screen.getAllByRole('button')).toHaveLength(3);
  OPTIONS.forEach((o) => expect(screen.getByRole('button', { name: o.label })).toBeInTheDocument());
});

test('the pill matching the current value is active', () => {
  render(<PillGroup options={OPTIONS} value="push" onChange={() => {}} />);
  expect(screen.getByRole('button', { name: 'Push' })).toHaveClass('active');
  expect(screen.getByRole('button', { name: 'All' })).not.toHaveClass('active');
});

test('clicking a pill reports its value', async () => {
  const onChange = jest.fn();
  render(<PillGroup options={OPTIONS} value="all" onChange={onChange} />);
  await userEvent.setup().click(screen.getByRole('button', { name: 'Pull' }));
  expect(onChange).toHaveBeenCalledWith('pull');
});
