import { withApiCache, generateCacheKey } from '../../../lib/apiCache';
import { checkRateLimit, getClientIp } from '../../../lib/rateLimit';

// Given a GitHub `Link` response header value, return the total commit count
// implied by the rel="last" page number (per_page=1 means page number == count).
// Returns null if the header is missing/unparseable (caller decides the fallback).
export function parseCommitCountFromLinkHeader(linkHeader) {
  if (!linkHeader) return null;
  const lastMatch = linkHeader.match(/<[^>]*[?&]page=(\d+)[^>]*>;\s*rel="last"/);
  if (!lastMatch) return null;
  const parsed = Number.parseInt(lastMatch[1], 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { allowed, retryAfterSeconds } = checkRateLimit(`github-repos:${getClientIp(req)}`, { windowMs: 60_000, max: 20 });
  if (!allowed) {
    res.setHeader('Retry-After', String(retryAfterSeconds));
    return res.status(429).json({ message: 'Too many requests — please wait a moment and try again.' });
  }

  try {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_USERNAME = process.env.GITHUB_USERNAME;
    
    if (!GITHUB_USERNAME) {
      return res.status(500).json({ 
        message: 'GitHub username not configured',
        error: 'Missing GITHUB_USERNAME environment variable'
      });
    }

    const cacheKey = generateCacheKey('github-repos', { username: GITHUB_USERNAME });
    
    const repos = await withApiCache(cacheKey, async () => {
      const headers = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'ryankrol.co.uk'
      };

      // Add authorization if token is available (for higher rate limits)
      if (GITHUB_TOKEN) {
        headers['Authorization'] = `token ${GITHUB_TOKEN}`;
      } else {
        console.warn('⚠️ [GitHub] GITHUB_TOKEN not set — falling back to public-only /users/{username}/repos, private repos will be missing from /projects');
      }

      const PER_PAGE = 100;
      let data = [];
      let page = 1;

      // /users/{username}/repos is public-repos-only by design, even when authenticated.
      // /user/repos (authenticated user) is the only endpoint that returns private repos.
      const baseUrl = GITHUB_TOKEN
        ? `https://api.github.com/user/repos?affiliation=owner`
        : `https://api.github.com/users/${GITHUB_USERNAME}/repos`;

      // Page through GitHub's repos endpoint until a short/empty page ends the list
      for (;;) {
        const githubUrl = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}per_page=${PER_PAGE}&page=${page}`;
        const response = await fetch(githubUrl, { headers });

        if (!response.ok) {
          throw new Error(`GitHub API error: ${response.status}`);
        }

        const pageData = await response.json();
        data = data.concat(pageData);

        if (pageData.length < PER_PAGE) {
          break;
        }

        page += 1;
      }

      // Filter and sort repositories by activity
      const activeReposPreMap = data
        .filter(repo => {
          // Filter out forks and private repos; archived repos are included
          return !repo.fork && repo.pushed_at && !repo.private;
        })
        .sort((a, b) => {
          // Sort by last push date (most recent first)
          return new Date(b.pushed_at) - new Date(a.pushed_at);
        });

      // GitHub's repos-list endpoint has no commit-count field, so fetch it
      // per repo via the commits endpoint's Link header (rel="last" page number).
      const reposWithCommitCounts = await Promise.all(
        activeReposPreMap.map(async (repo) => {
          try {
            const commitsUrl = `https://api.github.com/repos/${repo.full_name}/commits?per_page=1`;
            const commitsResponse = await fetch(commitsUrl, { headers });
            if (!commitsResponse.ok) {
              console.warn(`⚠️ [GitHub] commit-count fetch failed for ${repo.full_name}: ${commitsResponse.status}`);
              return { ...repo, commitCount: null };
            }
            const linkHeader = commitsResponse.headers.get('link');
            const fromLinkHeader = parseCommitCountFromLinkHeader(linkHeader);
            if (fromLinkHeader !== null) {
              return { ...repo, commitCount: fromLinkHeader };
            }
            // No Link header means there's only one page of results (0 or 1 commits) —
            // the response body's array length tells us which.
            const commitsBody = await commitsResponse.json();
            return { ...repo, commitCount: Array.isArray(commitsBody) ? commitsBody.length : null };
          } catch (err) {
            console.warn(`⚠️ [GitHub] commit-count fetch threw for ${repo.full_name}:`, err.message);
            return { ...repo, commitCount: null };
          }
        })
      );

      const activeRepos = reposWithCommitCounts.map(repo => ({
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        url: repo.html_url,
        language: repo.language,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        lastPush: repo.pushed_at,
        createdAt: repo.created_at,
        isPrivate: repo.private,
        topics: repo.topics || [],
        archived: Boolean(repo.archived),
        commitCount: repo.commitCount
      }));

      return {
        repos: activeRepos,
        total: activeRepos.length,
        username: GITHUB_USERNAME
      };
    });

    res.status(200).json(repos);
  } catch (error) {
    console.error('Error fetching GitHub repos:', error);
    res.status(500).json({ 
      message: 'Error fetching GitHub repositories',
      error: error.message 
    });
  }
}