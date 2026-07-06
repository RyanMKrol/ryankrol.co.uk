import { useState, useEffect } from 'react';
import Header from '../../../components/Header';
import BulkBackfillList from '../../../components/BulkBackfillList';
import { needsAlbumBackfill } from '../../../lib/backfillEligibility';

export default function BackfillAlbums() {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [password, setPassword] = useState('');

  useEffect(() => {
    async function fetchAlbums() {
      try {
        const response = await fetch('/api/reviews/albums');
        if (!response.ok) throw new Error('Failed to fetch albums');
        const data = await response.json();
        setAlbums(data.filter(needsAlbumBackfill));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchAlbums();
  }, []);

  const handleSearch = async (album) => {
    const query = (album.title || album.artist || '').trim();
    const res = await fetch(`/api/lastfm/album-search?query=${encodeURIComponent(query)}`);
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.message || 'Search failed');
      if (res.status === 429) {
        const retryAfter = Number(res.headers.get('Retry-After'));
        err.retryAfterSeconds = Number.isFinite(retryAfter) ? retryAfter : 1;
      }
      throw err;
    }
    return data.results;
  };

  const handleConfirm = async (album, candidate) => {
    const infoUrl = candidate.mbid
      ? `/api/lastfm/album-info?mbid=${encodeURIComponent(candidate.mbid)}`
      : `/api/lastfm/album-info?artist=${encodeURIComponent(candidate.artist)}&album=${encodeURIComponent(candidate.title)}`;

    const infoRes = await fetch(infoUrl);
    const infoData = await infoRes.json();
    if (!infoRes.ok) {
      const err = new Error(infoData.message || 'Failed to fetch album info');
      if (infoRes.status === 429) {
        const retryAfter = Number(infoRes.headers.get('Retry-After'));
        err.retryAfterSeconds = Number.isFinite(retryAfter) ? retryAfter : 1;
      }
      throw err;
    }

    const info = infoData.info;
    const lastfm = {
      mbid: info.mbid || '',
      url: info.url || '',
      listeners: info.listeners || 0,
      playcount: info.playcount || 0,
      tags: info.tags || [],
      trackCount: info.trackCount || 0,
      summary: info.summary || '',
      releaseDate: info.releaseDate || '',
      images: info.images || {},
    };

    const response = await fetch('/api/reviews/albums/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: album.title,
        artist: album.artist,
        rating: album.rating,
        highlights: album.highlights,
        originalId: album.id,
        password,
        lastfm,
      }),
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.message || 'Save failed');
    }
  };

  if (loading) {
    return (
      <div className="review-container">
        <Header />
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading albums...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="review-container">
        <Header />
        <div className="loading-container">
          <p className="error-text">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="review-container">
      <Header />
      <h1 className="page-title">backfill album metadata</h1>

      <div className="collection-form-card">
        <div className="collection-form-group">
          <label className="collection-form-label" htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="collection-form-input"
            required
          />
        </div>
      </div>

      {albums.length === 0 ? (
        <p>Nothing to backfill</p>
      ) : (
        <BulkBackfillList
          items={albums}
          pageSize={15}
          onSearch={handleSearch}
          renderItemLabel={(album) => album.title}
          getCandidateKey={(candidate, i) => candidate.mbid ?? i}
          renderCandidate={(result) => (
            <div className="mbm-card-row">
              {result.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={result.image}
                  alt={result.title}
                  className="mbm-thumb"
                  width={50}
                  height={50}
                />
              ) : (
                <div className="mbm-thumb mbm-thumb-placeholder" />
              )}
              <div className="mbm-card-info">
                <p className="mbm-card-title"><strong>{result.title}</strong></p>
                {result.artist && <p className="mbm-card-secondary">{result.artist}</p>}
              </div>
            </div>
          )}
          onConfirm={handleConfirm}
        />
      )}

      <style jsx>{`
        .mbm-card-row {
          display: flex;
          gap: 0.75rem;
          align-items: flex-start;
        }
        .mbm-thumb {
          object-fit: cover;
          border-radius: var(--radius-cover);
          flex-shrink: 0;
        }
        .mbm-thumb-placeholder {
          width: 50px;
          height: 50px;
          background: var(--color-hairline);
          border-radius: var(--radius-cover);
          flex-shrink: 0;
        }
        .mbm-card-info {
          flex: 1;
          min-width: 0;
        }
        .mbm-card-title {
          font-size: 0.9rem;
          margin: 0 0 0.25rem;
          font-family: var(--font-body);
          color: var(--color-ink);
        }
        .mbm-card-secondary {
          font-size: 0.8rem;
          opacity: 0.8;
          margin: 0;
          line-height: 1.4;
          font-family: var(--font-body);
          color: var(--color-ink);
        }
      `}</style>
    </div>
  );
}
