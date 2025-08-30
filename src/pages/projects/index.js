import { useState, useEffect } from 'react';
import Head from 'next/head';
import Header from '../../components/Header';

export default function ProjectsPage() {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [username, setUsername] = useState('');

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
    const colors = {
      'JavaScript': '#f7df1e',
      'TypeScript': '#3178c6',
      'Python': '#3776ab',
      'Java': '#ed8b00',
      'Go': '#00add8',
      'Rust': '#000000',
      'C++': '#00599c',
      'C': '#555555',
      'HTML': '#e34c26',
      'CSS': '#1572b6',
      'Shell': '#89e051',
      'Ruby': '#cc342d'
    };
    return colors[language] || '#666666';
  };

  return (
    <>
      <Head>
        <title>💻 My Projects - ryankrol.co.uk</title>
      </Head>
      
      <div className="container">
        <Header />
        
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          💻 My Projects
        </h1>
        
        <p style={{ fontSize: '1rem', color: '#666', marginBottom: '2rem' }}>
          My GitHub repositories, sorted by recent activity
          {username && (
            <>
              {' '}• <a 
                href={`https://github.com/${username}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#0366d6', textDecoration: 'none' }}
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
          <div style={{ 
            padding: '1rem', 
            backgroundColor: '#fee', 
            border: '1px solid #fcc', 
            borderRadius: '4px',
            marginBottom: '2rem'
          }}>
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
                style={{
                  padding: '1.5rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  backgroundColor: 'white'
                }}
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
                        style={{ 
                          textDecoration: 'none', 
                          color: '#0366d6'
                        }}
                      >
                        {repo.name}
                      </a>
                      {repo.isPrivate && (
                        <span style={{
                          marginLeft: '0.5rem',
                          fontSize: '0.75rem',
                          backgroundColor: '#fbbf24',
                          color: '#92400e',
                          padding: '0.125rem 0.375rem',
                          borderRadius: '4px',
                          fontWeight: 'normal'
                        }}>
                          PRIVATE
                        </span>
                      )}
                    </h3>
                    
                    {repo.description && (
                      <p style={{ 
                        color: '#666', 
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
                          <span style={{ fontSize: '0.8rem', color: '#666' }}>
                            {repo.language}
                          </span>
                        </div>
                      )}
                      
                      {repo.stars > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <span style={{ fontSize: '0.8rem' }}>⭐</span>
                          <span style={{ fontSize: '0.8rem', color: '#666' }}>
                            {repo.stars}
                          </span>
                        </div>
                      )}
                      
                      {repo.forks > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <span style={{ fontSize: '0.8rem' }}>🍴</span>
                          <span style={{ fontSize: '0.8rem', color: '#666' }}>
                            {repo.forks}
                          </span>
                        </div>
                      )}
                      
                      <span style={{ fontSize: '0.8rem', color: '#666' }}>
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
                            style={{
                              fontSize: '0.75rem',
                              backgroundColor: '#f3f4f6',
                              color: '#374151',
                              padding: '0.125rem 0.5rem',
                              borderRadius: '12px'
                            }}
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