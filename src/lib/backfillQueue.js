/**
 * Runs an array of async lookups ONE AT A TIME with a minimum spacing between
 * the start of each request — never bursts a batch of items in parallel.
 *
 * Rate-limit contract: if `searchFn` rejects with an Error whose
 * `.retryAfterSeconds` property is set (the caller detected a 429 and read
 * `Retry-After` off the response — see src/lib/rateLimit.js), that item is
 * retried exactly once after waiting `max(minSpacingMs, retryAfterSeconds*1000)`.
 * A second failure is reported as an error via onItemSettled.
 *
 * @param {Array} items
 * @param {(item: any) => Promise<Array>} searchFn
 * @param {{ minSpacingMs?: number, onItemStart?: (item: any) => void, onItemSettled?: (item: any, result: { candidates?: Array, error?: Error }) => void }} [options]
 * @returns {{ cancel: () => void }}
 */
export function runBackfillQueue(items, searchFn, options = {}) {
  const { minSpacingMs = 1500, onItemStart, onItemSettled } = options;

  let cancelled = false;

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const runItem = async (item) => {
    onItemStart?.(item);
    const start = Date.now();

    try {
      const candidates = await searchFn(item);
      onItemSettled?.(item, { candidates });
    } catch (err) {
      if (err && typeof err.retryAfterSeconds === 'number') {
        await wait(Math.max(minSpacingMs, err.retryAfterSeconds * 1000));
        if (cancelled) return start;
        try {
          const candidates = await searchFn(item);
          onItemSettled?.(item, { candidates });
        } catch (retryErr) {
          onItemSettled?.(item, { error: retryErr });
        }
      } else {
        onItemSettled?.(item, { error: err });
      }
    }

    return start;
  };

  (async () => {
    for (const item of items) {
      if (cancelled) return;
      const start = await runItem(item);
      const elapsed = Date.now() - start;
      if (elapsed < minSpacingMs) {
        await wait(minSpacingMs - elapsed);
      }
    }
  })();

  return {
    cancel() {
      cancelled = true;
    },
  };
}
