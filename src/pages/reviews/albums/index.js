import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ReviewCard from '../../../components/ReviewCard';
import Header from '../../../components/Header';
import SearchInput from '../../../components/SearchInput';
import SortButtons from '../../../components/SortButtons';
import Pagination from '../../../components/Pagination';
import { paginate } from '../../../lib/pagination';
import { assignGradients } from '../../../components/CoverTile';

const SORT_FIELDS = [
  { key: 'date', label: 'date', defaultValue: 'date', flippedValue: 'date-asc', defaultArrow: '↓', flippedArrow: '↑' },
  { key: 'title', label: 'title', defaultValue: 'title', flippedValue: 'title-desc', defaultArrow: '↓', flippedArrow: '↑' },
  { key: 'score', label: 'score', defaultValue: 'score', flippedValue: 'score-asc', defaultArrow: '↓', flippedArrow: '↑' },
];

const PAGE_SIZE = 8;

export function summarizeAlbums(albums) {
  const rated = albums.length;
  const avgRating = rated
    ? albums.reduce((sum, album) => sum + (album.rating || 0), 0) / rated
    : 0;
  const currentYear = new Date().getFullYear();
  const thisYear = albums.filter((album) => {
    const date = album.editedDate || album.date;
    if (!date) return false;
    const year = Number(date.split('-')[2]);
    return year === currentYear;
  }).length;

  return { rated, avgRating, thisYear };
}

export default function Albums() {
  const router = useRouter();
  const [albums, setAlbums] = useState([]);
  const [filteredAlbums, setFilteredAlbums] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (router.isReady && typeof router.query.q === 'string') {
      setSearchTerm(router.query.q);
    }
  }, [router.isReady, router.query.q]);

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
    let filtered = albums.filter(
      (album) =>
        album.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (album.artist || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

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
    } else if (sortBy === 'score') {
      filtered = filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'score-asc') {
      filtered = filtered.sort((a, b) => (a.rating || 0) - (b.rating || 0));
    } else if (sortBy === 'date-asc') {
      filtered = filtered.sort((a, b) => {
        const dateA = new Date((a.editedDate || a.date).split('-').reverse().join('-'));
        const dateB = new Date((b.editedDate || b.date).split('-').reverse().join('-'));
        return dateA - dateB;
      });
    } else {
      filtered = filtered.sort((a, b) => {
        const dateA = new Date((a.editedDate || a.date).split('-').reverse().join('-'));
        const dateB = new Date((b.editedDate || b.date).split('-').reverse().join('-'));
        return dateB - dateA;
      });
    }

    setFilteredAlbums(filtered);
  }, [searchTerm, albums, sortBy]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy]);

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

  const { rated, avgRating, thisYear } = summarizeAlbums(albums);
  const { items: pagedAlbums, page, pageCount } = paginate(filteredAlbums, currentPage, PAGE_SIZE);
  const albumGradientKeys = pagedAlbums
    .filter((album) => !(album.thumbnail || album.coverUrl))
    .map((album, index) => album.id || `${album.title}-${album.artist}-${index}`);
  const albumGradientPool = assignGradients(albumGradientKeys);
  let albumGradientIndex = 0;
  const albumGradients = pagedAlbums.map((album) => (
    (album.thumbnail || album.coverUrl) ? null : albumGradientPool[albumGradientIndex++]
  ));

  return (
    <div className="review-container">
      <Header />

      <div className="collection-review-header">
        <div className="collection-review-title-group">
          <h1 className="page-title">albums</h1>
          <p className="collection-review-meta">
            {rated} rated · avg {avgRating.toFixed(1)}★ · {thisYear} this year
          </p>
        </div>

        <div className="collection-review-controls">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="search by title or artist..."
          />
          <SortButtons
            fields={SORT_FIELDS}
            sortBy={sortBy}
            onChange={setSortBy}
          />
        </div>
      </div>

      <div className="square-cover-grid">
        {pagedAlbums.map((album, index) => (
          <ReviewCard
            key={`${album.title}-${album.artist}-${index}`}
            item={album}
            type="album"
            styleVariant="square-cover"
            gradient={albumGradients[index]}
          />
        ))}
      </div>

      <Pagination
        currentPage={page}
        totalPages={pageCount}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
