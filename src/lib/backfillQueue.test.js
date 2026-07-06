import { runBackfillQueue } from './backfillQueue';

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

const flush = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

describe('runBackfillQueue', () => {
  test('processes items sequentially — never two searches in flight at once', async () => {
    const items = ['a', 'b', 'c'];
    let inFlight = 0;
    let maxInFlight = 0;

    const searchFn = jest.fn(async (item) => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await Promise.resolve();
      inFlight -= 1;
      return [item];
    });

    runBackfillQueue(items, searchFn, { minSpacingMs: 1000 });

    for (let i = 0; i < items.length; i += 1) {
      await flush();
      await jest.advanceTimersByTimeAsync(1000);
    }
    await flush();

    expect(maxInFlight).toBe(1);
    expect(searchFn).toHaveBeenCalledTimes(3);
  });

  test('enforces the minimum spacing between the start of consecutive requests', async () => {
    const items = ['a', 'b'];
    const starts = [];

    const searchFn = jest.fn(async (item) => {
      starts.push(Date.now());
      return [item];
    });

    runBackfillQueue(items, searchFn, { minSpacingMs: 1500 });

    await flush();
    expect(searchFn).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(1499);
    expect(searchFn).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(1);
    await flush();
    expect(searchFn).toHaveBeenCalledTimes(2);
  });

  test('calls onItemStart and onItemSettled with candidates on success', async () => {
    const onItemStart = jest.fn();
    const onItemSettled = jest.fn();
    const searchFn = jest.fn(async (item) => [`match-${item}`]);

    runBackfillQueue(['x'], searchFn, { minSpacingMs: 100, onItemStart, onItemSettled });
    await flush();

    expect(onItemStart).toHaveBeenCalledWith('x');
    expect(onItemSettled).toHaveBeenCalledWith('x', { candidates: ['match-x'] });
  });

  test('retries exactly once after a retryAfterSeconds rejection, then succeeds', async () => {
    const onItemSettled = jest.fn();
    let calls = 0;
    const searchFn = jest.fn(async () => {
      calls += 1;
      if (calls === 1) {
        const err = new Error('rate limited');
        err.retryAfterSeconds = 3;
        throw err;
      }
      return ['ok'];
    });

    runBackfillQueue(['x'], searchFn, { minSpacingMs: 100, onItemSettled });

    await flush();
    expect(searchFn).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(3000);
    await flush();

    expect(searchFn).toHaveBeenCalledTimes(2);
    expect(onItemSettled).toHaveBeenCalledWith('x', { candidates: ['ok'] });
  });

  test('reports failure via onItemSettled if the retry also rejects', async () => {
    const onItemSettled = jest.fn();
    const err1 = new Error('rate limited');
    err1.retryAfterSeconds = 2;
    const err2 = new Error('still failing');
    const searchFn = jest.fn()
      .mockRejectedValueOnce(err1)
      .mockRejectedValueOnce(err2);

    runBackfillQueue(['x'], searchFn, { minSpacingMs: 100, onItemSettled });

    await flush();
    await jest.advanceTimersByTimeAsync(2000);
    await flush();

    expect(searchFn).toHaveBeenCalledTimes(2);
    expect(onItemSettled).toHaveBeenCalledWith('x', { error: err2 });
  });

  test('cancel() prevents any further items from starting', async () => {
    const items = ['a', 'b', 'c'];
    const searchFn = jest.fn(async (item) => [item]);

    const controller = runBackfillQueue(items, searchFn, { minSpacingMs: 500 });

    await flush();
    expect(searchFn).toHaveBeenCalledTimes(1);

    controller.cancel();

    await jest.advanceTimersByTimeAsync(5000);
    await flush();

    expect(searchFn).toHaveBeenCalledTimes(1);
  });
});
