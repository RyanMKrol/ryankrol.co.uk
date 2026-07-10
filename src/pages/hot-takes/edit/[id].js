import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import MarkdownEditor from '../../../components/MarkdownEditor';

export default function EditHotTake() {
  const router = useRouter();
  const { id } = router.query;

  const [formData, setFormData] = useState({
    text: '',
    password: '',
  });
  const [originalData, setOriginalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  useEffect(() => {
    if (!id) return;

    async function fetchHotTake() {
      try {
        const response = await fetch('/api/hot-takes');
        if (!response.ok) throw new Error('Failed to fetch hot takes');
        const hotTakes = await response.json();

        const decodedId = decodeURIComponent(id);
        const hotTake = hotTakes.find((t) => t.id === decodedId);

        if (!hotTake) {
          throw new Error('Hot take not found');
        }

        setOriginalData(hotTake);
        setFormData({
          text: hotTake.text,
          password: '',
        });
      } catch (err) {
        setMessage('Error loading hot take');
        setMessageType('error');
      } finally {
        setLoading(false);
      }
    }

    fetchHotTake();
  }, [id]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/hot-takes/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: originalData.id,
          text: formData.text,
          password: formData.password,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('Hot take updated successfully!');
        setMessageType('success');
        setTimeout(() => {
          router.push('/hot-takes/edit');
        }, 2000);
      } else {
        setMessage(result.message || 'Error updating hot take');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Error updating hot take');
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (e) => {
    e.preventDefault();

    if (!confirm('Are you sure you want to delete this take? This action cannot be undone.')) {
      return;
    }

    if (!formData.password) {
      setMessage('Password is required to delete takes');
      setMessageType('error');
      return;
    }

    setDeleting(true);
    setMessage('');

    try {
      const response = await fetch('/api/hot-takes/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: originalData.id,
          password: formData.password,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('Hot take deleted successfully!');
        setMessageType('success');
        setTimeout(() => {
          router.push('/hot-takes/edit');
        }, 2000);
      } else {
        setMessage(result.message || 'Error deleting hot take');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Error deleting hot take');
      setMessageType('error');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="review-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading hot take...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Edit Hot Take - ryankrol.co.uk</title>
      </Head>

      <div className="review-container">
        <h1 className="page-title">edit hot take</h1>

        <div className="collection-form-card">
          {message && (
            <div className={`collection-form-message ${messageType === 'success' ? 'collection-form-message-success' : 'collection-form-message-error'}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="collection-form-group">
              <label className="collection-form-label" htmlFor="text">Take</label>
              <MarkdownEditor
                id="text"
                name="text"
                value={formData.text}
                onChange={handleInputChange}
                className="collection-form-textarea"
                required
              />
            </div>

            <div className="collection-form-group">
              <label className="collection-form-label" htmlFor="password">Password</label>
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

            <div className="collection-form-actions">
              <button
                type="submit"
                className="collection-form-button"
                disabled={saving || deleting}
              >
                {saving ? 'Updating Take...' : 'Update Take'}
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={saving || deleting || !formData.password}
                className="collection-form-button collection-form-button-danger"
              >
                {deleting ? 'Deleting Take...' : 'Delete Take'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
