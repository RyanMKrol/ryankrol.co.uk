import { useState } from 'react';
import { useRouter } from 'next/router';
import StarRating from '../../../../components/StarRating';
import TmdbSearch from '../../../../components/TmdbSearch';
import V1FormShell, { V1FormRow, V1FormSubmit } from '../../../../components/v1/V1FormShell';

export default function V1AddMovieReview() {
  const [formData, setFormData] = useState({
    title: '',
    rating: 0,
    gist: '',
    password: '',
  });
  const [tmdbMatch, setTmdbMatch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const router = useRouter();

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
      const response = await fetch('/api/reviews/movies/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('Movie review added.');
        setMessageType('success');
        setTimeout(() => {
          router.push('/v1/reviews/movies');
        }, 1500);
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
    <V1FormShell
      breadcrumb="~ / reviews / movies / add"
      title="Add movie review"
      message={message}
      messageType={messageType}
      onSubmit={handleSubmit}
    >
      <V1FormRow label="Title" htmlFor="title">
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          required
        />
      </V1FormRow>

      <V1FormRow label="TMDB match">
        <TmdbSearch mediaType="movie" query={formData.title} onSelect={setTmdbMatch} />
      </V1FormRow>

      <V1FormRow label="Rating">
        <StarRating
          rating={formData.rating}
          onRatingChange={(rating) => setFormData({ ...formData, rating })}
        />
      </V1FormRow>

      <V1FormRow label="Review" htmlFor="gist">
        <textarea
          id="gist"
          name="gist"
          value={formData.gist}
          onChange={handleInputChange}
          placeholder="Share your thoughts about this movie..."
          required
        />
      </V1FormRow>

      <V1FormRow label="Password" htmlFor="password">
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          required
        />
      </V1FormRow>

      <V1FormSubmit disabled={loading || formData.rating === 0}>
        {loading ? 'Adding…' : 'Add review'}
      </V1FormSubmit>
    </V1FormShell>
  );
}
