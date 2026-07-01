import { useEffect, useState } from 'react';
import V2Layout from '../../../components/v2/V2Layout';

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function V2Projects() {
  const [repos, setRepos] = useState([]);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchRepos() {
      try {
        const response = await fetch('/api/github/repos');
        if (!response.ok) throw new Error('Failed to fetch GitHub repositories');
        const data = await response.json();
        if (!cancelled) {
          setRepos(data.repos || []);
          setUsername(data.username || '');
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchRepos();
    return () => {
      cancelled = true;
    };
  }, []);

  const [featured, ...rest] = repos;

  return (
    <V2Layout>
      <div className="v2-list-header">
        <h1 className="v2-list-title">Projects</h1>
        <span className="v2-count">
          {username ? (
            <a href={`https://github.com/${username}`} target="_blank" rel="noopener noreferrer">
              @{username}
            </a>
          ) : (
            ''
          )}
        </span>
      </div>

      {loading && <p className="v2-status">Loading projects…</p>}
      {error && <p className="v2-status v2-error">Error: {error}</p>}

      {!loading && !error && repos.length === 0 && (
        <p className="v2-status">No active repositories found.</p>
      )}

      {!loading && !error && featured && (
        <article className="v2-hero-repo">
          <span className="v2-hero-kicker">Most recently pushed</span>
          <h2 className="v2-hero-repo-title">
            <a href={featured.url} target="_blank" rel="noopener noreferrer">
              {featured.name}
            </a>
          </h2>
          {featured.description && (
            <p className="v2-hero-blurb">{featured.description}</p>
          )}
          <p className="v2-hero-meta">
            {featured.language && <span>{featured.language}</span>}
            {featured.stars > 0 && <span>⭐ {featured.stars}</span>}
            {featured.forks > 0 && <span>🍴 {featured.forks}</span>}
            <span>Updated {formatDate(featured.lastPush)}</span>
          </p>
        </article>
      )}

      {!loading && !error && rest.length > 0 && (
        <div className="v2-masonry">
          {rest.map((repo, i) => (
            <article key={repo.fullName} className="v2-repo-card" data-tall={i % 3 === 1}>
              <h3 className="v2-card-title">
                <a href={repo.url} target="_blank" rel="noopener noreferrer">
                  {repo.name}
                </a>
                {repo.isPrivate && <span className="v2-badge">PRIVATE</span>}
              </h3>
              {repo.description && <p className="v2-card-blurb">{repo.description}</p>}
              <p className="v2-card-meta">
                {repo.language && <span>{repo.language}</span>}
                {repo.stars > 0 && <span>⭐ {repo.stars}</span>}
                {repo.forks > 0 && <span>🍴 {repo.forks}</span>}
                <span>Updated {formatDate(repo.lastPush)}</span>
              </p>
              {repo.topics && repo.topics.length > 0 && (
                <div className="v2-topics">
                  {repo.topics.slice(0, 5).map((topic) => (
                    <span key={topic} className="v2-topic">
                      {topic}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      <style jsx>{`
        .v2-list-header {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin-bottom: 24px;
          gap: 16px;
          flex-wrap: wrap;
        }

        .v2-list-title {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 2.5rem;
          margin: 0;
        }

        .v2-count {
          font-size: 0.8rem;
          color: #8a8474;
        }

        .v2-count :global(a) {
          color: #8a8474;
        }

        .v2-status {
          color: #4b473f;
        }

        .v2-error {
          color: #a33;
        }

        .v2-hero-repo {
          border: 1px solid #d8d3c4;
          background: #fff;
          padding: 40px;
          margin-bottom: 32px;
        }

        .v2-hero-kicker {
          font-variant: small-caps;
          letter-spacing: 0.08em;
          font-size: 0.8rem;
          color: #8a8474;
        }

        .v2-hero-repo-title {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 3rem;
          margin: 8px 0 12px;
        }

        .v2-hero-repo-title :global(a) {
          color: #211f1c;
          text-decoration: none;
        }

        .v2-hero-repo-title :global(a:hover) {
          text-decoration: underline;
        }

        .v2-hero-blurb {
          font-size: 1.1rem;
          line-height: 1.6;
          max-width: 60ch;
          color: #4b473f;
          margin: 0 0 16px;
        }

        .v2-hero-meta,
        .v2-card-meta {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          font-size: 0.85rem;
          color: #8a8474;
          margin: 0;
        }

        .v2-masonry {
          columns: 2;
          column-gap: 20px;
        }

        @media (max-width: 700px) {
          .v2-masonry {
            columns: 1;
          }
          .v2-hero-repo-title {
            font-size: 2.25rem;
          }
        }

        .v2-repo-card {
          break-inside: avoid;
          margin-bottom: 20px;
          border: 1px solid #d8d3c4;
          background: #fff;
          padding: 24px;
        }

        .v2-repo-card[data-tall='true'] {
          padding-bottom: 40px;
        }

        .v2-card-title {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 1.6rem;
          margin: 0 0 8px;
        }

        .v2-card-title :global(a) {
          color: #211f1c;
          text-decoration: none;
        }

        .v2-card-title :global(a:hover) {
          text-decoration: underline;
        }

        .v2-badge {
          margin-left: 8px;
          font-family: 'Helvetica Neue', Arial, sans-serif;
          font-size: 0.65rem;
          vertical-align: middle;
          background: #211f1c;
          color: #f2efe6;
          padding: 2px 6px;
          border-radius: 3px;
        }

        .v2-card-blurb {
          font-size: 0.95rem;
          line-height: 1.55;
          color: #4b473f;
          margin: 0 0 12px;
        }

        .v2-topics {
          margin-top: 12px;
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .v2-topic {
          font-size: 0.7rem;
          font-variant: small-caps;
          letter-spacing: 0.04em;
          border: 1px solid #d8d3c4;
          padding: 2px 8px;
          color: #4b473f;
        }
      `}</style>
    </V2Layout>
  );
}
