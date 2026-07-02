import handler from './album-search';
import { checkRateLimit, getClientIp } from '../../../lib/rateLimit';

jest.mock('../../../lib/rateLimit', () => ({
  checkRateLimit: jest.fn(),
  getClientIp: jest.fn()
}));

jest.mock('../../../lib/apiCache', () => ({
  withApiCache: jest.fn((key, fn) => fn()),
  generateCacheKey: jest.fn(() => 'api-lastfm-album-search')
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
  process.env.LAST_FM_API_KEY = 'test-key';
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: jest.fn().mockResolvedValue({ results: { albummatches: { album: [] } } })
  });
});

// The other three lastfm routes (now-playing, top-albums, album-info) apply the identical
// checkRateLimit/getClientIp gate immediately after the method check — this exercises the shared
// pattern once rather than duplicating it four times.
describe('lastfm album-search API', () => {
  it('succeeds with results when under the rate limit', async () => {
    checkRateLimit.mockReturnValue({ allowed: true, retryAfterSeconds: 0 });
    const req = { method: 'GET', query: { query: 'Dune' } };
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(global.fetch).toHaveBeenCalled();
  });

  it('returns 429 with Retry-After and does not call fetch when rate limited', async () => {
    checkRateLimit.mockReturnValue({ allowed: false, retryAfterSeconds: 42 });
    const req = { method: 'GET', query: { query: 'Dune' } };
    const res = mockRes();

    await handler(req, res);

    expect(res.setHeader).toHaveBeenCalledWith('Retry-After', '42');
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.any(String) }));
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
