import handler, { parseCommitCountFromLinkHeader } from './repos';
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

// Builds a global.fetch mockImplementation that answers the repos-list call with
// `repoListData` and any `/commits?per_page=1` call via `commitsResponder(fullName)`,
// which must return { ok, linkHeader, body }.
function mockFetchWithCommits(repoListData, commitsResponder = () => ({ ok: true, linkHeader: null, body: [] })) {
  return jest.fn().mockImplementation((url) => {
    if (typeof url === 'string' && url.includes('/commits?per_page=1')) {
      const fullNameMatch = url.match(/repos\/([^/]+\/[^/]+)\/commits/);
      const fullName = fullNameMatch ? fullNameMatch[1] : null;
      const { ok, linkHeader, body } = commitsResponder(fullName);
      return Promise.resolve({
        ok,
        status: ok ? 200 : 403,
        headers: { get: jest.fn(() => linkHeader) },
        json: jest.fn().mockResolvedValue(body)
      });
    }
    return Promise.resolve({
      ok: true,
      json: jest.fn().mockResolvedValue(repoListData)
    });
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  getClientIp.mockReturnValue('1.2.3.4');
  process.env.GITHUB_USERNAME = 'testuser';
  global.fetch = mockFetchWithCommits([]);
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
    global.fetch = mockFetchWithCommits([publicRepo, privateRepo]);
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
    global.fetch = mockFetchWithCommits([publicRepo, archivedRepo]);
    const req = { method: 'GET' };
    const res = mockRes();

    await handler(req, res);

    const [payload] = res.json.mock.calls[0];
    const archived = payload.repos.find(r => r.name === 'archived-repo');
    const nonArchived = payload.repos.find(r => r.name === 'public-repo');
    expect(archived.archived).toBe(true);
    expect(nonArchived.archived).toBe(false);
  });

  describe('parseCommitCountFromLinkHeader', () => {
    it('extracts the rel="last" page number from a multi-page Link header', () => {
      const linkHeader = '<https://api.github.com/repositories/1/commits?per_page=1&page=2>; rel="next", <https://api.github.com/repositories/1/commits?per_page=1&page=42>; rel="last"';
      expect(parseCommitCountFromLinkHeader(linkHeader)).toBe(42);
    });

    it('returns null for a missing/empty header', () => {
      expect(parseCommitCountFromLinkHeader(null)).toBeNull();
      expect(parseCommitCountFromLinkHeader('')).toBeNull();
    });

    it('returns null when there is no rel="last" segment', () => {
      const linkHeader = '<https://api.github.com/repositories/1/commits?per_page=1&page=2>; rel="next"';
      expect(parseCommitCountFromLinkHeader(linkHeader)).toBeNull();
    });
  });

  describe('per-repo commit counts', () => {
    it('maps a repo with a multi-page Link header to the correct commitCount', async () => {
      checkRateLimit.mockReturnValue({ allowed: true, retryAfterSeconds: 0 });
      global.fetch = mockFetchWithCommits([publicRepo], () => ({
        ok: true,
        linkHeader: '<url?per_page=1&page=2>; rel="next", <url?per_page=1&page=7>; rel="last"',
        body: []
      }));
      const req = { method: 'GET' };
      const res = mockRes();

      await handler(req, res);

      const [payload] = res.json.mock.calls[0];
      expect(payload.repos.find(r => r.name === 'public-repo').commitCount).toBe(7);
    });

    it('maps a repo with no Link header and a one-item body to commitCount: 1', async () => {
      checkRateLimit.mockReturnValue({ allowed: true, retryAfterSeconds: 0 });
      global.fetch = mockFetchWithCommits([publicRepo], () => ({
        ok: true,
        linkHeader: null,
        body: [{ sha: 'abc123' }]
      }));
      const req = { method: 'GET' };
      const res = mockRes();

      await handler(req, res);

      const [payload] = res.json.mock.calls[0];
      expect(payload.repos.find(r => r.name === 'public-repo').commitCount).toBe(1);
    });

    it('degrades to commitCount: null and still returns 200 when the commits fetch fails', async () => {
      checkRateLimit.mockReturnValue({ allowed: true, retryAfterSeconds: 0 });
      global.fetch = mockFetchWithCommits([publicRepo], () => ({
        ok: false,
        linkHeader: null,
        body: null
      }));
      const req = { method: 'GET' };
      const res = mockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const [payload] = res.json.mock.calls[0];
      expect(payload.repos.find(r => r.name === 'public-repo').commitCount).toBeNull();
    });
  });
});
