import { withApiCache, generateCacheKey } from '../../../lib/apiCache';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
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
      // Get user's repositories from GitHub API
      const githubUrl = `https://api.github.com/users/${GITHUB_USERNAME}/repos`;
      
      const headers = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'ryankrol.co.uk'
      };
      
      // Add authorization if token is available (for higher rate limits)
      if (GITHUB_TOKEN) {
        headers['Authorization'] = `token ${GITHUB_TOKEN}`;
      }

      const response = await fetch(githubUrl, { headers });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Filter and sort repositories by activity
      const activeRepos = data
        .filter(repo => {
          // Filter out forks and archived repos
          return !repo.fork && 
                 !repo.archived && 
                 repo.pushed_at;
        })
        .sort((a, b) => {
          // Sort by last push date (most recent first)
          return new Date(b.pushed_at) - new Date(a.pushed_at);
        })
        .slice(0, 20) // Top 20 most active
        .map(repo => ({
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
          topics: repo.topics || []
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