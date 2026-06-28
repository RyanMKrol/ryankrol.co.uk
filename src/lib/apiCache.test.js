import {
  generateCacheKey,
  withApiCache,
  clearApiCache,
} from './apiCache';

describe('generateCacheKey', () => {
  it('prefixes the endpoint with "api-"', () => {
    expect(generateCacheKey('workouts')).toBe('api-workouts');
  });

  it('appends params as sorted-by-insertion key:value pairs', () => {
    expect(generateCacheKey('workouts', { page: 1, pageSize: 10 })).toBe(
      'api-workouts-page:1-pageSize:10'
    );
  });

  it('ignores an empty params object', () => {
    expect(generateCacheKey('stats', {})).toBe('api-stats');
  });
});

describe('withApiCache', () => {
  it('requires a cache key', async () => {
    await expect(withApiCache('', async () => 1)).rejects.toThrow(
      'Cache key is required'
    );
  });

  it('fetches on a miss then serves subsequent calls from cache', async () => {
    const key = generateCacheKey('test-hit', { id: 1 });
    clearApiCache(key);

    const fetcher = jest.fn().mockResolvedValue({ value: 42 });

    const first = await withApiCache(key, fetcher);
    const second = await withApiCache(key, fetcher);

    expect(first).toEqual({ value: 42 });
    expect(second).toEqual({ value: 42 });
    // The fetcher must only run once — the second call is a cache hit.
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('re-fetches after the key is cleared', async () => {
    const key = generateCacheKey('test-clear', { id: 2 });
    const fetcher = jest.fn().mockResolvedValue({ value: 'x' });

    await withApiCache(key, fetcher);
    clearApiCache(key);
    await withApiCache(key, fetcher);

    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('supports wildcard pattern clears', async () => {
    const fetcher = jest.fn().mockResolvedValue({ ok: true });
    await withApiCache(generateCacheKey('movies', { a: 1 }), fetcher);
    await withApiCache(generateCacheKey('movies', { a: 2 }), fetcher);

    clearApiCache('api-movies*');

    // Both keys cleared -> two fresh fetches on the next reads (4 total).
    await withApiCache(generateCacheKey('movies', { a: 1 }), fetcher);
    await withApiCache(generateCacheKey('movies', { a: 2 }), fetcher);
    expect(fetcher).toHaveBeenCalledTimes(4);
  });
});
