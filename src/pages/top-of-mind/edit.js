import { useState, useEffect } from 'react';
import Head from 'next/head';
import MarkdownEditor from '../../components/MarkdownEditor';
import Markdown from '../../components/Markdown';
import { isExpired, daysSinceUpdate, daysRemaining } from '../../lib/topOfMind';

export default function EditTopOfMind() {
  const [formData, setFormData] = useState({ text: '', password: '' });
  const [updatedAt, setUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  useEffect(() => {
    fetch('/api/top-of-mind')
      .then((response) => response.json())
      .then((data) => {
        setFormData((prev) => ({ ...prev, text: data.text || '' }));
        setUpdatedAt(data.updatedAt || null);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.text.trim()) {
      setMessage('A non-empty note is required');
      setMessageType('error');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/top-of-mind/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('Top of mind note saved successfully!');
        setMessageType('success');
        setUpdatedAt(result.updatedAt);
      } else {
        setMessage(result.message || 'Error saving top of mind note');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Error saving top of mind note');
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  };

  const renderExpiryIndicator = () => {
    if (!updatedAt) return null;

    const daysSince = daysSinceUpdate(updatedAt);
    const expired = isExpired(updatedAt);
    const lastUpdatedLabel = `Last updated ${daysSince < 1 ? 'today' : `${Math.floor(daysSince)} day${Math.floor(daysSince) === 1 ? '' : 's'} ago`}`;

    if (expired) {
      const daysExpiredAgo = Math.floor(daysSince - 90);
      return (
        <p className="collection-form-hint">
          {lastUpdatedLabel} — Expired {daysExpiredAgo <= 0 ? 'just now' : `${daysExpiredAgo} day${daysExpiredAgo === 1 ? '' : 's'} ago`} — save again to keep it on the homepage
        </p>
      );
    }

    const remaining = Math.ceil(daysRemaining(updatedAt));
    return (
      <p className="collection-form-hint">
        {lastUpdatedLabel} — Expires in {remaining} day{remaining === 1 ? '' : 's'}
      </p>
    );
  };

  return (
    <>
      <Head>
        <title>Top of Mind - ryankrol.co.uk</title>
      </Head>

      <div className="review-container">
        <h1 className="page-title">top of mind</h1>

        <div className="collection-form-card">
          {!loading && renderExpiryIndicator()}

          {message && (
            <div className={`collection-form-message ${messageType === 'success' ? 'collection-form-message-success' : 'collection-form-message-error'}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="collection-form-group">
              <label className="collection-form-label" htmlFor="text">Note *</label>
              <MarkdownEditor
                id="text"
                name="text"
                value={formData.text}
                onChange={handleInputChange}
                placeholder="What's on your mind..."
                required
              />
            </div>

            <div className="collection-form-group">
              <label className="collection-form-label">Preview</label>
              <Markdown>{formData.text}</Markdown>
            </div>

            <div className="collection-form-group">
              <label className="collection-form-label" htmlFor="password">Password *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="collection-form-input"
                required
              />
            </div>

            <button
              type="submit"
              className="collection-form-button"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
