import handler from './search';
import { checkRateLimit, getClientIp } from '../../../lib/rateLimit';

jest.mock('../../../lib/rateLimit', () => ({
  checkRateLimit: jest.fn(),
  getClientIp: jest.fn()
}));

jest.mock('../../../lib/apiCache', () => ({
  withApiCache: jest.fn((key, fn) => fn()),
  generateCacheKey: jest.fn(() => 'api-book-search')
}));

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn();
  return res;
}

beforeEach(() => {
  jest.clearAllMocks();
  getClientIp.mockReturnValue('1.2.3.4');
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: jest.fn().mockResolvedValue({ items: [] })
  });
});

describe('books search API', () => {
  beforeEach(() => {
    console.error = jest.fn();
  });

  it('succeeds with results when under the rate limit', async () => {
    checkRateLimit.mockReturnValue({ allowed: true, retryAfterSeconds: 0 });
    const req = { method: 'GET', query: { title: 'Dune' } };
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(global.fetch).toHaveBeenCalled();
  });

  it('returns 429 with Retry-After and does not call fetch when rate limited', async () => {
    checkRateLimit.mockReturnValue({ allowed: false, retryAfterSeconds: 42 });
    const req = { method: 'GET', query: { title: 'Dune' } };
    const res = mockRes();

    await handler(req, res);

    expect(res.setHeader).toHaveBeenCalledWith('Retry-After', '42');
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.any(String) }));
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns 429 with Retry-After when upstream Google Books returns 429', async () => {
    checkRateLimit.mockReturnValue({ allowed: true, retryAfterSeconds: 0 });
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
      text: jest.fn().mockResolvedValueOnce('{"error": {"message": "Quota exceeded"}}')
    });

    const req = { method: 'GET', query: { title: 'Dune' } };
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.setHeader).toHaveBeenCalledWith('Retry-After', expect.any(String));
  });

  it('logs diagnostic detail when upstream returns 429', async () => {
    checkRateLimit.mockReturnValue({ allowed: true, retryAfterSeconds: 0 });
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
      text: jest.fn().mockResolvedValueOnce('{"error": {"message": "Quota exceeded"}}')
    });

    const req = { method: 'GET', query: { title: 'Dune', author: 'Frank Herbert' } };
    const res = mockRes();

    await handler(req, res);

    expect(console.error).toHaveBeenCalled();
    const errorCall = console.error.mock.calls[0];
    const logOutput = errorCall.join(' ');
    expect(logOutput).toContain('429');
  });

  it('returns 500 for non-429 upstream errors and logs diagnostic detail', async () => {
    checkRateLimit.mockReturnValue({ allowed: true, retryAfterSeconds: 0 });
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: jest.fn().mockResolvedValueOnce('Internal error')
    });

    const req = { method: 'GET', query: { title: 'Dune', author: 'Frank Herbert' } };
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(console.error).toHaveBeenCalled();
    const errorCall = console.error.mock.calls[0];
    const logOutput = errorCall.join(' ');
    expect(logOutput).toContain('500');
  });
});
