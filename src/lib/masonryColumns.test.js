import { distributeRoundRobin } from './masonryColumns';

describe('distributeRoundRobin', () => {
  it('splits evenly across columns in round-robin order', () => {
    const items = ['a', 'b', 'c', 'd', 'e', 'f'];
    expect(distributeRoundRobin(items, 3)).toEqual([
      ['a', 'd'],
      ['b', 'e'],
      ['c', 'f'],
    ]);
  });

  it('handles an uneven remainder', () => {
    const items = ['a', 'b', 'c', 'd', 'e'];
    expect(distributeRoundRobin(items, 3)).toEqual([
      ['a', 'd'],
      ['b', 'e'],
      ['c'],
    ]);
  });

  it('returns a single column when columnCount is 1', () => {
    const items = ['a', 'b', 'c'];
    expect(distributeRoundRobin(items, 1)).toEqual([['a', 'b', 'c']]);
  });

  it('returns empty columns for an empty items array', () => {
    expect(distributeRoundRobin([], 3)).toEqual([[], [], []]);
  });

  it('handles columnCount greater than or equal to items length', () => {
    const items = ['a', 'b'];
    expect(distributeRoundRobin(items, 4)).toEqual([['a'], ['b'], [], []]);
  });
});
