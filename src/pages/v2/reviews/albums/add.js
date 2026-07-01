import { useState } from 'react';
import { useRouter } from 'next/router';
import V2ArticleForm, { V2StarPicker } from '../../../../components/v2/V2ArticleForm';
import LastfmAlbumSearch from '../../../../components/LastfmAlbumSearch';

export default function V2AddAlbumReview() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '', artist: '', rating: 0, highlights: '', password: '',
  });
  const [lastfmMatch, setLastfmMatch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLastfmSelect = (match) => {
    if (match) {
      setFormData((prev) => ({
        ...prev,
        title: match.title || prev.title,
        artist: match.artist || prev.artist,
      }));
    }
    setLastfmMatch(match);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const body = {
      ...formData,
      ...(lastfmMatch && { lastfm: lastfmMatch.lastfm }),
    };

    try {
      const response = await fetch('/api/reviews/albums/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await response.json();

      if (response.ok) {
        setMessage('Album review added successfully!');
        setMessageType('success');
        setTimeout(() => router.push('/v2/reviews/albums'), 2000);
      } else {
        setMessage(result.message || 'Error adding review');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Error adding review');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <V2ArticleForm
      kicker="New album review"
      headline="Add an album"
      onSubmit={handleSubmit}
      submitLabel="Publish review"
      loading={loading}
      message={message}
      messageType={messageType}
    >
      <div>
        <label className="v2-field-label" htmlFor="title">Title</label>
        <input
          id="title"
          name="title"
          type="text"
          className="v2-input v2-headline-input"
          value={formData.title}
          onChange={handleInputChange}
          required
        />
      </div>

      <div>
        <label className="v2-field-label" htmlFor="artist">Artist</label>
        <input
          id="artist"
          name="artist"
          type="text"
          className="v2-input"
          value={formData.artist}
          onChange={handleInputChange}
          required
        />
      </div>

      <div>
        <label className="v2-field-label">Last.fm match (optional)</label>
        <LastfmAlbumSearch titleQuery={formData.title} onSelect={handleLastfmSelect} />
      </div>

      {lastfmMatch?.thumbnail && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={lastfmMatch.thumbnail} alt={formData.title} width={80} height={80} />
      )}

      <div>
        <label className="v2-field-label">Rating</label>
        <V2StarPicker rating={formData.rating} onChange={(rating) => setFormData({ ...formData, rating })} />
      </div>

      <div>
        <label className="v2-field-label" htmlFor="highlights">Highlights</label>
        <textarea
          id="highlights"
          name="highlights"
          className="v2-textarea"
          placeholder="Share your favorite tracks from this album…"
          value={formData.highlights}
          onChange={handleInputChange}
          required
        />
      </div>

      <div>
        <label className="v2-field-label" htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          className="v2-input"
          value={formData.password}
          onChange={handleInputChange}
          required
        />
      </div>
    </V2ArticleForm>
  );
}
