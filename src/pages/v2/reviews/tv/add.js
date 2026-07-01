import { useState } from 'react';
import { useRouter } from 'next/router';
import V2ArticleForm, { V2StarPicker } from '../../../../components/v2/V2ArticleForm';
import TmdbSearch from '../../../../components/TmdbSearch';

export default function V2AddTvReview() {
  const router = useRouter();
  const [formData, setFormData] = useState({ title: '', rating: 0, gist: '', password: '' });
  const [tmdbMatch, setTmdbMatch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const body = {
      ...formData,
      ...(tmdbMatch && {
        tmdbId: tmdbMatch.tmdbId,
        mediaType: tmdbMatch.mediaType,
        posterPath: tmdbMatch.posterPath,
        tmdbOverview: tmdbMatch.overview,
        tmdbDate: tmdbMatch.date,
      }),
    };

    try {
      const response = await fetch('/api/reviews/tv/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await response.json();

      if (response.ok) {
        setMessage('TV show review added successfully!');
        setMessageType('success');
        setTimeout(() => router.push('/v2/reviews/tv'), 2000);
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
      kicker="New TV review"
      headline="Add a TV show"
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
        <label className="v2-field-label">TMDB match (optional)</label>
        <TmdbSearch mediaType="tv" query={formData.title} onSelect={setTmdbMatch} />
      </div>

      <div>
        <label className="v2-field-label">Rating</label>
        <V2StarPicker rating={formData.rating} onChange={(rating) => setFormData({ ...formData, rating })} />
      </div>

      <div>
        <label className="v2-field-label" htmlFor="gist">Review</label>
        <textarea
          id="gist"
          name="gist"
          className="v2-textarea"
          placeholder="Share your thoughts about this TV show…"
          value={formData.gist}
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
