import { useState } from 'react';
import { useRouter } from 'next/router';
import StarRating from '../../../../components/StarRating';
import LastfmAlbumSearch from '../../../../components/LastfmAlbumSearch';
import V1FormShell, { V1FormRow, V1FormSubmit } from '../../../../components/v1/V1FormShell';

export default function V1AddAlbumReview() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    rating: 0,
    highlights: '',
    password: '',
  });
  const [lastfmMatch, setLastfmMatch] = useState(null);
  const [saving, setSaving] = useState(false);
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
    setSaving(true);
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
        setMessage('Album review added.');
        setMessageType('success');
        setTimeout(() => {
          router.push('/v1/reviews/albums');
        }, 1500);
      } else {
        setMessage(result.message || 'Error adding review');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Error adding review');
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <V1FormShell
      breadcrumb="~ / reviews / albums / add"
      title="Add album review"
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

      <V1FormRow label="Artist" htmlFor="artist">
        <input
          type="text"
          id="artist"
          name="artist"
          value={formData.artist}
          onChange={handleInputChange}
          required
        />
      </V1FormRow>

      <V1FormRow label="Last.fm match">
        <LastfmAlbumSearch titleQuery={formData.title} onSelect={handleLastfmSelect} />
      </V1FormRow>

      {lastfmMatch?.thumbnail && (
        <V1FormRow label="Cover">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lastfmMatch.thumbnail} alt={formData.title} width={60} height={60} />
        </V1FormRow>
      )}

      <V1FormRow label="Rating">
        <StarRating
          rating={formData.rating}
          onRatingChange={(rating) => setFormData({ ...formData, rating })}
        />
      </V1FormRow>

      <V1FormRow label="Highlights" htmlFor="highlights">
        <textarea
          id="highlights"
          name="highlights"
          value={formData.highlights}
          onChange={handleInputChange}
          placeholder="Share your favorite tracks from this album..."
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

      <V1FormSubmit disabled={saving || formData.rating === 0}>
        {saving ? 'Adding…' : 'Add review'}
      </V1FormSubmit>
    </V1FormShell>
  );
}
