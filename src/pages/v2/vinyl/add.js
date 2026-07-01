import { useState } from 'react';
import { useRouter } from 'next/router';
import V2ArticleForm from '../../../components/v2/V2ArticleForm';
import LastfmAlbumSearch from '../../../components/LastfmAlbumSearch';

export default function V2AddVinyl() {
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
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('Vinyl record added successfully!');
        setMessageType('success');
        setTimeout(() => {
          router.push('/v2/vinyl');
        }, 2000);
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
    <V2ArticleForm
      kicker="New addition"
      headline="Add a record"
      onSubmit={handleSubmit}
      submitLabel="Add Record"
      loading={saving}
      message={message}
      messageType={messageType}
    >
      <div>
        <label className="v2-field-label" htmlFor="title">Title</label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          className="v2-input v2-headline-input"
          placeholder="Album/record title…"
          required
        />
      </div>

      <div>
        <label className="v2-field-label" htmlFor="artist">Artist</label>
        <input
          type="text"
          id="artist"
          name="artist"
          value={formData.artist}
          onChange={handleInputChange}
          className="v2-input"
          placeholder="Artist name…"
          required
        />
      </div>

      <div>
        <label className="v2-field-label">Last.fm match (optional)</label>
        <LastfmAlbumSearch titleQuery={formData.title} onSelect={handleLastfmSelect} />
      </div>

      <div>
        <label className="v2-field-label" htmlFor="password">Password</label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          className="v2-input"
          required
        />
      </div>
    </V2ArticleForm>
  );
}
