import { useState, useEffect } from 'react';
import ReviewCard from '../../../components/ReviewCard';
import Header from '../../../components/Header';
import SortButtons from '../../../components/SortButtons';

const SORT_FIELDS = [
  { key: 'date',   label: 'Date',   defaultValue: 'date',        flippedValue: 'date-desc',   defaultArrow: '↓', flippedArrow: '↑' },
  { key: 'title',  label: 'Title',  defaultValue: 'title',       flippedValue: 'title-desc',  defaultArrow: '↑', flippedArrow: '↓' },
  { key: 'artist', label: 'Artist', defaultValue: 'artist',      flippedValue: 'artist-desc', defaultArrow: '↑', flippedArrow: '↓' },
  { key: 'score',  label: 'Score',  defaultValue: 'score',       flippedValue: 'score-desc',  defaultArrow: '↓', flippedArrow: '↑' },
];

export default function Albums() {
  const [albums, setAlbums] = useState([]);
  const [filteredAlbums, setFilteredAlbums] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchAlbums() {
      try {
        const response = await fetch('/api/reviews/albums');
        if (!response.ok) throw new Error('Failed to fetch albums');
        const data = await response.json();
        
        setAlbums(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchAlbums();
  }, []);

  useEffect(() => {
    let filtered = albums.filter(album => 
      album.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      album.artist.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort the filtered results
    if (sortBy === 'title') {
      filtered = filtered.sort((a, b) => {
        const titleA = a.title.replace(/^The\s+/i, '');
        const titleB = b.title.replace(/^The\s+/i, '');
        return titleA.localeCompare(titleB);
      });
    } else if (sortBy === 'title-desc') {
      filtered = filtered.sort((a, b) => {
        const titleA = a.title.replace(/^The\s+/i, '');
        const titleB = b.title.replace(/^The\s+/i, '');
        return titleB.localeCompare(titleA);
      });
    } else if (sortBy === 'artist') {
      filtered = filtered.sort((a, b) => {
        const artistA = a.artist.replace(/^The\s+/i, '');
        const artistB = b.artist.replace(/^The\s+/i, '');
        return artistA.localeCompare(artistB);
      });
    } else if (sortBy === 'artist-desc') {
      filtered = filtered.sort((a, b) => {
        const artistA = a.artist.replace(/^The\s+/i, '');
        const artistB = b.artist.replace(/^The\s+/i, '');
        return artistB.localeCompare(artistA);
      });
    } else if (sortBy === 'score') {
      filtered = filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'score-desc') {
      filtered = filtered.sort((a, b) => (a.rating || 0) - (b.rating || 0));
    } else if (sortBy === 'date-desc') {
      // Sort by date (oldest first)
      filtered = filtered.sort((a, b) => {
        const dateA = new Date(a.date.split('-').reverse().join('-'));
        const dateB = new Date(b.date.split('-').reverse().join('-'));
        return dateA - dateB;
      });
    } else {
      // Sort by date (most recent first)
      filtered = filtered.sort((a, b) => {
        const dateA = new Date(a.date.split('-').reverse().join('-'));
        const dateB = new Date(b.date.split('-').reverse().join('-'));
        return dateB - dateA;
      });
    }

    setFilteredAlbums(filtered);
  }, [searchTerm, albums, sortBy]);

  if (loading) {
    return (
      <div className="review-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading album reviews...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="review-container">
        <div className="loading-container">
          <p className="error-text">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="review-container">
      <Header />
      <h1 className="page-title">albums</h1>
      
      <div className="search-container">
        <input
          type="text"
          placeholder="Search albums by title or artist..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <SortButtons fields={SORT_FIELDS} sortBy={sortBy} onChange={setSortBy} />
        {searchTerm && (
          <div className="search-results-count">
            Found {filteredAlbums.length} album{filteredAlbums.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
      
      <div className="reviews-wrapper">
        {filteredAlbums.map((album, index) => (
          <ReviewCard 
            key={`${album.title}-${album.artist}-${index}`}
            item={album}
            type="album"
            isLast={index === filteredAlbums.length - 1}
            styleVariant={2}
          />
        ))}
      </div>
    </div>
  );
}