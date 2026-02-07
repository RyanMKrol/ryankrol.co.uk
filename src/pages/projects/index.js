import { useState, useEffect } from 'react';
import Head from 'next/head';
import Header from '../../components/Header';
import useMatrixActive from '../../hooks/useMatrixActive';

export default function ProjectsPage() {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [username, setUsername] = useState('');
  const matrixActive = useMatrixActive();

  useEffect(() => {
    async function fetchRepos() {
      try {
        const response = await fetch('/api/github/repos');
        if (response.ok) {
          const data = await response.json();
          setRepos(data.repos || []);
          setUsername(data.username || '');
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getLanguageColor = (language) => {
    if (matrixActive) {
      const matrixColors = {
        'JavaScript': '#00ff41',
        'TypeScript': '#00cc33',
        'Python': '#33ff66',
        'Java': '#00aa22',
        'Go': '#66ff88',
        'Rust': '#008f11',
        'C++': '#00cc33',
        'C': '#00aa22',
        'HTML': '#33ff66',
        'CSS': '#66ff88',
        'Shell': '#00ff41',
        'Ruby': '#008f11'
      };
      return matrixColors[language] || '#00aa22';
    }
    const colors = {
      'JavaScript': '#ffd700',
      'TypeScript': '#00fff5',
      'Python': '#ff00ff',
      'Java': '#ff6633',
      'Go': '#00ccff',
      'Rust': '#ff3366',
      'C++': '#a855f7',
      'C': '#66ffcc',
      'HTML': '#ff6699',
      'CSS': '#cc66ff',
      'Shell': '#00ff88',
      'Ruby': '#ff3399'
    };
    return colors[language] || '#6a6a99';
  };

  return (
    <>
      <Head>
        <title>My Projects - ryankrol.co.uk</title>
      </Head>

      <div className="container">
        <Header />

        <h1 className="page-title">projects</h1>

        <p className="page-subtitle">
          My GitHub repositories, sorted by recent activity
          {username && (
            <>
              {' '}• <a
                href={`https://github.com/${username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="link-accent"
              >
                @{username}
              </a>
            </>
          )}
        </p>

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
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {repos.map((repo, index) => (
              <div
                key={repo.fullName}
                className="project-card"
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      marginBottom: '0.5rem'
                    }}>
                      <a
                        href={repo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link-accent"
                      >
                        {repo.name}
                      </a>
                      {repo.isPrivate && (
                        <span style={{
                          marginLeft: '0.5rem',
                          fontSize: '0.75rem',
                          backgroundColor: 'var(--color-accent-secondary)',
                          color: 'white',
                          padding: '0.125rem 0.375rem',
                          borderRadius: '4px',
                          fontWeight: 'normal'
                        }}>
                          PRIVATE
                        </span>
                      )}
                    </h3>

                    {repo.description && (
                      <p className="text-muted" style={{
                        fontSize: '0.9rem',
                        marginBottom: '0.75rem',
                        lineHeight: '1.4'
                      }}>
                        {repo.description}
                      </p>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                      {repo.language && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <div style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: getLanguageColor(repo.language)
                          }}></div>
                          <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                            {repo.language}
                          </span>
                        </div>
                      )}

                      {repo.stars > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <span style={{ fontSize: '0.8rem' }}>⭐</span>
                          <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                            {repo.stars}
                          </span>
                        </div>
                      )}

                      {repo.forks > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <span style={{ fontSize: '0.8rem' }}>🍴</span>
                          <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                            {repo.forks}
                          </span>
                        </div>
                      )}

                      <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                        Updated {formatDate(repo.lastPush)}
                      </span>
                    </div>

                    {repo.topics && repo.topics.length > 0 && (
                      <div style={{
                        marginTop: '0.75rem',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.5rem'
                      }}>
                        {repo.topics.slice(0, 5).map(topic => (
                          <span
                            key={topic}
                            className="project-tag"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
