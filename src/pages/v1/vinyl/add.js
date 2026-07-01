import { useState } from 'react';
import { useRouter } from 'next/router';
import LastfmAlbumSearch from '../../../components/LastfmAlbumSearch';
import V1FormShell, { V1FormRow, V1FormSubmit } from '../../../components/v1/V1FormShell';

export default function V1AddVinyl() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
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
      const response = await fetch('/api/vinyl/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('Vinyl record added.');
        setMessageType('success');
        setTimeout(() => {
          router.push('/v1/vinyl');
        }, 1500);
      } else {
        setMessage(result.message || 'Error adding vinyl record');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Error adding vinyl record');
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <V1FormShell
      breadcrumb="~ / vinyl / add"
      title="Add vinyl record"
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

      <V1FormSubmit disabled={saving}>
        {saving ? 'Adding…' : 'Add record'}
      </V1FormSubmit>
    </V1FormShell>
  );
}
