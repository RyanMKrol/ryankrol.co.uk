import { checkRateLimit, getClientIp } from './rateLimit';

describe('checkRateLimit', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('allows the first `max` calls with the same key', () => {
    const key = `test-key-${Math.random()}`;
    for (let i = 0; i < 5; i += 1) {
      const result = checkRateLimit(key, { windowMs: 1000, max: 5 });
      expect(result.allowed).toBe(true);
    }
  });

  it('blocks the max + 1th call with a positive retryAfterSeconds', () => {
    const key = `test-key-${Math.random()}`;
    for (let i = 0; i < 5; i += 1) {
      checkRateLimit(key, { windowMs: 1000, max: 5 });
    }
    const result = checkRateLimit(key, { windowMs: 1000, max: 5 });
    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('does not let one key affect a different key', () => {
    const keyA = `test-key-a-${Math.random()}`;
    const keyB = `test-key-b-${Math.random()}`;
    for (let i = 0; i < 5; i += 1) {
      checkRateLimit(keyA, { windowMs: 1000, max: 5 });
    }
    const blockedA = checkRateLimit(keyA, { windowMs: 1000, max: 5 });
    expect(blockedA.allowed).toBe(false);

    const resultB = checkRateLimit(keyB, { windowMs: 1000, max: 5 });
    expect(resultB.allowed).toBe(true);
  });

  it('resets after the window elapses', () => {
    const key = `test-key-${Math.random()}`;
    for (let i = 0; i < 5; i += 1) {
      checkRateLimit(key, { windowMs: 1000, max: 5 });
    }
    expect(checkRateLimit(key, { windowMs: 1000, max: 5 }).allowed).toBe(false);

    jest.advanceTimersByTime(1001);

    const result = checkRateLimit(key, { windowMs: 1000, max: 5 });
    expect(result.allowed).toBe(true);

    // Fresh count: should allow max - 1 more calls before blocking again
    for (let i = 0; i < 4; i += 1) {
      expect(checkRateLimit(key, { windowMs: 1000, max: 5 }).allowed).toBe(true);
    }
    expect(checkRateLimit(key, { windowMs: 1000, max: 5 }).allowed).toBe(false);
  });
});

describe('getClientIp', () => {
  it('uses the first entry of x-forwarded-for when present', () => {
    const req = { headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' }, socket: {} };
    expect(getClientIp(req)).toBe('1.2.3.4');
  });

  it('falls back to socket.remoteAddress when no x-forwarded-for', () => {
    const req = { headers: {}, socket: { remoteAddress: '9.9.9.9' } };
    expect(getClientIp(req)).toBe('9.9.9.9');
  });

  it("falls back to 'unknown' when nothing is available", () => {
    const req = { headers: {}, socket: {} };
    expect(getClientIp(req)).toBe('unknown');
  });
});
