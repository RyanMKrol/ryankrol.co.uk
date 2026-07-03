import { useEffect, useState } from 'react';
import Head from 'next/head';
import Header from '../../components/Header';
import Badge from '../../components/Badge';

const LANGUAGE_COLORS = {
  TypeScript: '#3178C6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  Shell: '#89E051',
  Java: '#b07219',
  Go: '#00ADD8',
  Rust: '#dea584',
  'C++': '#f34b7d',
  C: '#555555',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Ruby: '#701516',
};

const FALLBACK_LANGUAGE_COLOR = '#8A837A';

function getLanguageColor(language) {
  return LANGUAGE_COLORS[language] || FALLBACK_LANGUAGE_COLOR;
}

function formatUpdatedAgo(dateString) {
  const then = new Date(dateString).getTime();
  if (Number.isNaN(then)) return '';

  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
  const units = [
    { label: 'y', secs: 31536000 },
    { label: 'mo', secs: 2592000 },
    { label: 'd', secs: 86400 },
    { label: 'h', secs: 3600 },
    { label: 'm', secs: 60 },
  ];

  for (const unit of units) {
    const value = Math.floor(seconds / unit.secs);
    if (value >= 1) return `${value}${unit.label} ago`;
  }
  return 'just now';
}

export default function ProjectsPage() {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchRepos() {
      try {
        const response = await fetch('/api/github/repos');
        if (response.ok) {
          const data = await response.json();
          setRepos(data.repos || []);
        } else {
          setError('Failed to fetch GitHub repositories');
        }
      } catch (err) {
        setError('Error fetching GitHub repositories');
      } finally {
        setLoading(false);
      }
    }

    fetchRepos();
  }, []);

  return (
    <>
      <Head>
        <title>My Projects - ryankrol.co.uk</title>
      </Head>

      <div className="container">
        <Header />

        <div className="collection-review-header">
          <div className="collection-review-title-group">
            <h1 className="page-title">projects</h1>
            <p className="collection-review-meta">
              what I&apos;ve been building on github · sorted by recent activity
            </p>
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            Loading projects...
          </div>
        )}

        {error && (
          <div className="inline-error">
            {error}
          </div>
        )}

        {!loading && !error && repos.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            No active repositories found.
          </div>
        )}

        {!loading && !error && repos.length > 0 && (
          <div className="projects-grid">
            {repos.map((repo) => (
              <div key={repo.fullName} className="project-card">
                <div className="project-card-top">
                  <a
                    href={repo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="project-card-name"
                  >
                    {repo.name}
                  </a>
                  <span className="project-card-stars">
                    ★ {repo.stars || 0}
                  </span>
                </div>

                {repo.description && (
                  <p className="project-card-description">{repo.description}</p>
                )}

                <div className="project-card-meta-row">
                  {repo.language && (
                    <span className="project-card-language">
                      <span
                        className="project-card-language-dot"
                        style={{ backgroundColor: getLanguageColor(repo.language) }}
                      />
                      {repo.language}
                    </span>
                  )}
                  {repo.lastPush && (
                    <span className="project-card-updated">
                      updated {formatUpdatedAgo(repo.lastPush)}
                    </span>
                  )}
                </div>

                {repo.topics && repo.topics.length > 0 && (
                  <div className="project-card-tags">
                    {repo.topics.slice(0, 5).map((topic) => (
                      <Badge key={topic} accentColor="var(--accent-projects)" variant="soft">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
