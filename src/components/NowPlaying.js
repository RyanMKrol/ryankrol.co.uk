import { useState, useEffect } from 'react';
import MarqueeText from './MarqueeText';

export default function NowPlaying() {
  const [track, setTrack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchCurrentTrack() {
      try {
        const response = await fetch('/api/lastfm/now-playing');
        if (response.ok) {
          const data = await response.json();
          setTrack(data);
        } else {
          setError('Failed to fetch track');
        }
      } catch (err) {
        setError('Error fetching current track');
      } finally {
        setLoading(false);
      }
    }

    fetchCurrentTrack();
    
    // Refresh every 60 seconds (Last.fm data is cached for 5 minutes)
    const interval = setInterval(fetchCurrentTrack, 60000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="now-playing-chip loading">
        <span className="now-playing-dot" aria-hidden="true" />
        <span className="now-playing-label">Loading...</span>
      </div>
    );
  }

  if (error || !track || !track.isPlaying) {
    return (
      <div className="now-playing-chip offline">
        <span className="now-playing-dot" aria-hidden="true" />
        <span className="now-playing-label">not listening rn :)</span>
      </div>
    );
  }

  const trackText = `${track.track.name} by ${track.track.artist}`;

  return (
    <div className="now-playing-chip">
      <span className="now-playing-dot playing" aria-hidden="true" />
      <div className="now-playing-split">
        {track.track.lastFmUrl ? (
          <a
            href={track.track.lastFmUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="track-link-single"
          >
            <MarqueeText className="single-line-track">
              {trackText}
            </MarqueeText>
          </a>
        ) : (
          <MarqueeText className="single-line-track">
            {trackText}
          </MarqueeText>
        )}
      </div>
    </div>
  );
}