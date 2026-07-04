import handler from './repos';
import { checkRateLimit, getClientIp } from '../../../lib/rateLimit';

jest.mock('../../../lib/rateLimit', () => ({
  checkRateLimit: jest.fn(),
  getClientIp: jest.fn()
}));

jest.mock('../../../lib/apiCache', () => ({
  withApiCache: jest.fn((key, fn) => fn()),
  generateCacheKey: jest.fn(() => 'api-github-repos')
}));

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn();
  return res;
}

const publicRepo = {
  name: 'public-repo',
  full_name: 'testuser/public-repo',
  description: 'A public repo',
  html_url: 'https://github.com/testuser/public-repo',
  language: 'JavaScript',
  stargazers_count: 5,
  forks_count: 1,
  pushed_at: '2026-01-01T00:00:00Z',
  created_at: '2025-01-01T00:00:00Z',
  private: false,
  fork: false,
  topics: []
};

const privateRepo = {
  ...publicRepo,
  name: 'private-repo',
  full_name: 'testuser/private-repo',
  html_url: 'https://github.com/testuser/private-repo',
  private: true
};

beforeEach(() => {
  jest.clearAllMocks();
  getClientIp.mockReturnValue('1.2.3.4');
  process.env.GITHUB_USERNAME = 'testuser';
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: jest.fn().mockResolvedValue([])
  });
});

describe('github repos API', () => {
  it('succeeds with results when under the rate limit', async () => {
    checkRateLimit.mockReturnValue({ allowed: true, retryAfterSeconds: 0 });
    const req = { method: 'GET' };
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(global.fetch).toHaveBeenCalled();
  });

  it('returns 429 with Retry-After and does not call fetch when rate limited', async () => {
    checkRateLimit.mockReturnValue({ allowed: false, retryAfterSeconds: 42 });
    const req = { method: 'GET' };
    const res = mockRes();

    await handler(req, res);

    expect(res.setHeader).toHaveBeenCalledWith('Retry-After', '42');
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.any(String) }));
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('excludes private repos from the response', async () => {
    checkRateLimit.mockReturnValue({ allowed: true, retryAfterSeconds: 0 });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue([publicRepo, privateRepo])
    });
    const req = { method: 'GET' };
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const [payload] = res.json.mock.calls[0];
    expect(payload.repos.some(r => r.name === 'private-repo')).toBe(false);
    expect(payload.repos.some(r => r.name === 'public-repo')).toBe(true);
    expect(payload.total).toBe(1);
  });

  it('threads the archived flag through, defaulting to false when absent', async () => {
    checkRateLimit.mockReturnValue({ allowed: true, retryAfterSeconds: 0 });
    const archivedRepo = {
      ...publicRepo,
      name: 'archived-repo',
      full_name: 'testuser/archived-repo',
      html_url: 'https://github.com/testuser/archived-repo',
      archived: true
    };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue([publicRepo, archivedRepo])
    });
    const req = { method: 'GET' };
    const res = mockRes();

    await handler(req, res);

    const [payload] = res.json.mock.calls[0];
    const archived = payload.repos.find(r => r.name === 'archived-repo');
    const nonArchived = payload.repos.find(r => r.name === 'public-repo');
    expect(archived.archived).toBe(true);
    expect(nonArchived.archived).toBe(false);
  });
});
