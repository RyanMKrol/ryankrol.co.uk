import { useEffect, useState } from 'react';
import V3Layout from './V3Layout';
import V3TimelineEntry from './V3TimelineEntry';

function formatDate(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
}

export default function V3ProjectsFeed() {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchRepos() {
      try {
        const response = await fetch('/api/github/repos');
        if (!response.ok) throw new Error('Failed to fetch GitHub repositories');
        const data = await response.json();
        setRepos(data.repos || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchRepos();
  }, []);

  return (
    <V3Layout title="projects">
      {loading && <p className="v3-status">loading…</p>}
      {error && <p className="v3-status v3-error">error: {error}</p>}

      {!loading && !error && (
        <>
          <p className="v3-sort">sorted by last updated, newest first — change</p>

          {repos.map((repo) => (
            <V3TimelineEntry
              key={repo.fullName}
              date={formatDate(repo.lastPush)}
              type={repo.language ? repo.language.toLowerCase() : 'repo'}
              summary={`${repo.name}${repo.description ? ` — ${repo.description}` : ''}`}
            >
              {repo.stars > 0 && `${repo.stars} star${repo.stars !== 1 ? 's' : ''}`}
              {repo.stars > 0 && repo.forks > 0 && ' · '}
              {repo.forks > 0 && `${repo.forks} fork${repo.forks !== 1 ? 's' : ''}`}
              {(repo.stars > 0 || repo.forks > 0) && ' · '}
              <a href={repo.url} target="_blank" rel="noopener noreferrer">
                view on GitHub
              </a>
              {repo.topics && repo.topics.length > 0 && ` · ${repo.topics.slice(0, 5).join(', ')}`}
            </V3TimelineEntry>
          ))}

          {repos.length === 0 && <p className="v3-status">nothing here yet.</p>}

          <div className="v3-end">— end of feed —</div>
        </>
      )}

      <style jsx>{`
        .v3-status {
          color: #767672;
          margin: 14px 0;
        }

        .v3-error {
          color: #a33;
        }

        .v3-sort {
          color: #767672;
          margin: 14px 0;
        }

        .v3-end {
          padding: 10px 0;
          color: #767672;
          text-align: center;
        }
      `}</style>
    </V3Layout>
  );
}
