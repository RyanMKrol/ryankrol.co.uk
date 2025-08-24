import { useState, useEffect } from 'react';
import Head from 'next/head';
import Header from '../../components/Header';

export default function CacheDevPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [messageVisible, setMessageVisible] = useState(true);

  const fetchStats = async () => {
    if (!authenticated) return;
    
    try {
      const response = await fetch(`/api/dev/cache-bust?password=${encodeURIComponent(password)}`);
      const data = await response.json();
      setStats(data);
      setMessage('Cache stats refreshed');
      setMessageVisible(true);
      setTimeout(() => setMessageVisible(false), 1500);
      setTimeout(() => setMessage(''), 2000);
    } catch (error) {
      setMessage('Error fetching cache stats');
      setMessageVisible(true);
      setTimeout(() => setMessageVisible(false), 1500);
      setTimeout(() => setMessage(''), 2000);
    }
  };

  const clearCache = async () => {
    if (!authenticated) return;
    
    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/dev/cache-bust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });
      
      const data = await response.json();
      setMessage(data.message);
      setMessageVisible(true);
      setTimeout(() => setMessageVisible(false), 1500);
      setTimeout(() => setMessage(''), 2000);
      setStats(data.stats);
    } catch (error) {
      setMessage('Error clearing cache');
      setMessageVisible(true);
      setTimeout(() => setMessageVisible(false), 1500);
      setTimeout(() => setMessage(''), 2000);
    } finally {
      setLoading(false);
    }
  };

  const authenticate = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch(`/api/dev/cache-bust?password=${encodeURIComponent(password)}`);
      if (response.ok) {
        setAuthenticated(true);
        const data = await response.json();
        setStats(data);
        setMessage('Authentication successful');
        setMessageVisible(true);
        setTimeout(() => setMessageVisible(false), 1500);
        setTimeout(() => setMessage(''), 2000);
      } else {
        setMessage('Invalid password');
        setMessageVisible(true);
        setTimeout(() => setMessageVisible(false), 1500);
        setTimeout(() => setMessage(''), 2000);
      }
    } catch (error) {
      setMessage('Error authenticating');
      setMessageVisible(true);
      setTimeout(() => setMessageVisible(false), 1500);
      setTimeout(() => setMessage(''), 2000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authenticated) {
      fetchStats();
    }
  }, [authenticated]);

  if (!authenticated) {
    return (
      <>
        <Head>
          <title>Cache Dev Tools - ryankrol.co.uk</title>
        </Head>
        
        <div className="container" style={{ maxWidth: '400px' }}>
          <h1 style={{ marginBottom: '2rem', fontSize: '2rem', fontWeight: 'bold' }}>
            🔒 Authentication Required
          </h1>
          
          {message && (
            <div style={{ 
              padding: '1rem', 
              marginBottom: '1rem', 
              backgroundColor: message.includes('Error') || message.includes('Invalid') ? '#fee' : '#efe',
              border: `1px solid ${message.includes('Error') || message.includes('Invalid') ? '#fcc' : '#cfc'}`,
              borderRadius: '4px',
              opacity: messageVisible ? 1 : 0,
              transition: 'opacity 0.5s ease'
            }}>
              {message}
            </div>
          )}
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter site password"
              style={{
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '1rem',
                fontFamily: 'JetBrains Mono, monospace'
              }}
              onKeyPress={(e) => e.key === 'Enter' && authenticate()}
            />
            <button
              type="button"
              onClick={authenticate}
              disabled={loading || !password}
              style={{
                padding: '0.75rem',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading || !password ? 'not-allowed' : 'pointer',
                opacity: loading || !password ? 0.6 : 1,
                fontSize: '1rem',
                transition: 'all 0.1s ease',
                transform: 'translateY(0)',
                boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
              }}
              onMouseDown={(e) => {
                e.target.style.transform = 'translateY(2px)';
                e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.2)';
              }}
              onMouseUp={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
              }}
            >
              {loading ? 'Authenticating...' : 'Access Dev Tools'}
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Cache Dev Tools - ryankrol.co.uk</title>
      </Head>
      
      <div className="container">
        <Header />
        <h1 style={{ marginBottom: '2rem', fontSize: '2rem', fontWeight: 'bold' }}>
          🔧 Cache Dev Tools
        </h1>
        
        {message && (
          <div style={{ 
            padding: '1rem', 
            marginBottom: '1rem', 
            backgroundColor: message.includes('Error') ? '#fee' : '#efe',
            border: `1px solid ${message.includes('Error') ? '#fcc' : '#cfc'}`,
            borderRadius: '4px',
            opacity: messageVisible ? 1 : 0,
            transition: 'opacity 0.5s ease'
          }}>
            {message}
          </div>
        )}

        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>Cache Actions</h2>
          
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={clearCache}
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                transition: 'all 0.1s ease',
                transform: 'translateY(0)',
                boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
              }}
              onMouseDown={(e) => {
                if (!loading) {
                  e.target.style.transform = 'translateY(2px)';
                  e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.2)';
                }
              }}
              onMouseUp={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
              }}
            >
              {loading ? 'Clearing...' : 'Clear All Caches'}
            </button>
            
            <button
              onClick={fetchStats}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.1s ease',
                transform: 'translateY(0)',
                boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
              }}
              onMouseDown={(e) => {
                e.target.style.transform = 'translateY(2px)';
                e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.2)';
              }}
              onMouseUp={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
              }}
            >
              Refresh Stats
            </button>
          </div>
        </div>

        {stats && (
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>Cache Statistics</h2>
            
            <div style={{ 
              backgroundColor: '#f8f9fa',
              padding: '1rem',
              borderRadius: '4px',
              border: '1px solid #e5e7eb',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                <div>
                  <strong>Total Keys:</strong> {stats.totalKeys}
                </div>
                <div>
                  <strong>Hits:</strong> {stats.hits}
                </div>
                <div>
                  <strong>Misses:</strong> {stats.misses}
                </div>
                <div>
                  <strong>Hit Rate:</strong> {stats.hits + stats.misses > 0 ? Math.round((stats.hits / (stats.hits + stats.misses)) * 100) : 0}%
                </div>
              </div>
            </div>

            {stats.keys && stats.keys.length > 0 && (
              <div>
                <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>Active Cache Keys:</h3>
                <div style={{ 
                  backgroundColor: '#f8f9fa',
                  padding: '1rem',
                  borderRadius: '4px',
                  border: '1px solid #e5e7eb',
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}>
                  {stats.keys.map((key, index) => (
                    <div key={index} style={{ 
                      padding: '0.25rem 0',
                      borderBottom: index < stats.keys.length - 1 ? '1px solid #e5e7eb' : 'none',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '0.8rem'
                    }}>
                      {key}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </>
  );
}