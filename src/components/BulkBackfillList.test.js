import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BulkBackfillList from './BulkBackfillList';

const mkItems = (n) => Array.from({ length: n }, (_, i) => ({ id: `item-${i}`, title: `Item ${i}` }));

const mkCandidates = (n) => Array.from({ length: n }, (_, i) => ({ id: i, label: `Candidate ${i}` }));

const baseProps = {
  renderItemLabel: (item) => item.title,
  renderCandidate: (candidate) => candidate.label,
  getCandidateKey: (candidate) => candidate.id,
};

const applyAllButton = () => screen.getByRole('button', { name: /apply all selections|applying…/i });

test('caps candidates at 3 and the status label reflects the capped count', async () => {
  const onSearch = jest.fn().mockResolvedValue(mkCandidates(5));
  render(<BulkBackfillList items={mkItems(1)} onSearch={onSearch} onConfirm={jest.fn()} {...baseProps} />);

  await screen.findByText('3 candidates found');
  expect(screen.getAllByRole('radio')).toHaveLength(3);
});

test('"Apply all selections" is disabled until a row has a selection, and while applying', async () => {
  const onSearch = jest.fn().mockResolvedValue(mkCandidates(3));
  let resolveConfirm;
  const onConfirm = jest.fn(() => new Promise((resolve) => { resolveConfirm = resolve; }));
  render(<BulkBackfillList items={mkItems(1)} onSearch={onSearch} onConfirm={onConfirm} {...baseProps} />);

  expect(applyAllButton()).toBeDisabled();

  await screen.findByText('3 candidates found');
  await userEvent.setup().click(screen.getAllByRole('radio')[0]);
  expect(applyAllButton()).toBeEnabled();

  await userEvent.setup().click(applyAllButton());
  expect(applyAllButton()).toBeDisabled();
  expect(await screen.findByRole('button', { name: 'Applying…' })).toBeInTheDocument();

  resolveConfirm();
  await screen.findByRole('button', { name: 'Apply all selections' });
});

test('applying calls onConfirm only for rows with a selection', async () => {
  const onSearch = jest.fn().mockResolvedValue(mkCandidates(3));
  const onConfirm = jest.fn().mockResolvedValue();
  const items = mkItems(2);
  render(<BulkBackfillList items={items} onSearch={onSearch} onConfirm={onConfirm} {...baseProps} />);

  await waitFor(() => expect(screen.getAllByText('3 candidates found')).toHaveLength(2), { timeout: 5000 });

  const firstRowRadios = within(screen.getAllByText('Item 0')[0].closest('.bbl-row')).getAllByRole('radio');
  await userEvent.setup().click(firstRowRadios[0]);

  await userEvent.setup().click(applyAllButton());
  await screen.findByRole('button', { name: 'Apply all selections' });

  expect(onConfirm).toHaveBeenCalledTimes(1);
  expect(onConfirm).toHaveBeenCalledWith(items[0], expect.objectContaining({ id: 0 }));
}, 10000);

test('a failed row does not stop the remaining selected rows from being confirmed', async () => {
  const onSearch = jest.fn().mockResolvedValue(mkCandidates(3));
  const items = mkItems(2);
  const onConfirm = jest.fn()
    .mockRejectedValueOnce(new Error('Save failed'))
    .mockResolvedValueOnce();
  render(<BulkBackfillList items={items} onSearch={onSearch} onConfirm={onConfirm} {...baseProps} />);

  await waitFor(() => expect(screen.getAllByText('3 candidates found')).toHaveLength(2), { timeout: 5000 });

  const row0 = screen.getAllByText('Item 0')[0].closest('.bbl-row');
  const row1 = screen.getAllByText('Item 1')[0].closest('.bbl-row');
  await userEvent.setup().click(within(row0).getAllByRole('radio')[0]);
  await userEvent.setup().click(within(row1).getAllByRole('radio')[0]);

  await userEvent.setup().click(applyAllButton());
  await screen.findByRole('button', { name: 'Apply all selections' });

  expect(onConfirm).toHaveBeenCalledTimes(2);
  expect(within(row0).getByText('Save failed')).toBeInTheDocument();
  expect(within(row1).getByText('saved')).toBeInTheDocument();
  expect(within(row0).getAllByRole('radio')[0]).toBeChecked();
}, 10000);
