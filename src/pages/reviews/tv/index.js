import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ReviewCard from '../../../components/ReviewCard';
import Header from '../../../components/Header';
import SearchInput from '../../../components/SearchInput';
import PillGroup from '../../../components/PillGroup';
import Pagination from '../../../components/Pagination';
import { paginate } from '../../../lib/pagination';

const SORT_OPTIONS = [
  { value: 'date', label: 'date ↓' },
  { value: 'title', label: 'title' },
  { value: 'score', label: 'score' },
];

const PAGE_SIZE = 9;

export function summarizeTvShows(tvShows) {
  const rated = tvShows.length;
  const avgRating = rated
    ? tvShows.reduce((sum, tvShow) => sum + (tvShow.rating || 0), 0) / rated
    : 0;
  const currentYear = new Date().getFullYear();
  const thisYear = tvShows.filter((tvShow) => {
    const date = tvShow.editedDate || tvShow.date;
    if (!date) return false;
    const year = Number(date.split('-')[2]);
    return year === currentYear;
  }).length;

  return { rated, avgRating, thisYear };
}

export default function TV() {
  const router = useRouter();
  const [tvShows, setTvShows] = useState([]);
  const [filteredTvShows, setFilteredTvShows] = useState([]);
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
    async function fetchTvShows() {
      try {
        const response = await fetch('/api/reviews/tv');
        if (!response.ok) throw new Error('Failed to fetch TV shows');
        const data = await response.json();

        setTvShows(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchTvShows();
  }, []);

  useEffect(() => {
    let filtered = tvShows.filter((tvShow) =>
      tvShow.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortBy === 'title') {
      filtered = filtered.sort((a, b) => {
        const titleA = a.title.replace(/^The\s+/i, '');
        const titleB = b.title.replace(/^The\s+/i, '');
        return titleA.localeCompare(titleB);
      });
    } else if (sortBy === 'score') {
      filtered = filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else {
      filtered = filtered.sort((a, b) => {
        const dateA = new Date((a.editedDate || a.date).split('-').reverse().join('-'));
        const dateB = new Date((b.editedDate || b.date).split('-').reverse().join('-'));
        return dateB - dateA;
      });
    }

    setFilteredTvShows(filtered);
  }, [searchTerm, tvShows, sortBy]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy]);

  if (loading) {
    return (
      <div className="review-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading TV show reviews...</p>
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

  const { rated, avgRating, thisYear } = summarizeTvShows(tvShows);
  const { items: pagedTvShows, page, pageCount } = paginate(filteredTvShows, currentPage, PAGE_SIZE);

  return (
    <div className="review-container">
      <Header />

      <div className="collection-review-header">
        <div className="collection-review-title-group">
          <h1 className="page-title">tv</h1>
          <p className="collection-review-meta">
            {rated} rated · avg {avgRating.toFixed(1)}★ · {thisYear} this year
          </p>
        </div>

        <div className="collection-review-controls">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="search by title..."
          />
          <PillGroup
            options={SORT_OPTIONS}
            value={sortBy}
            onChange={setSortBy}
          />
        </div>
      </div>

      <div className="poster-banner-grid">
        {pagedTvShows.map((tvShow, index) => (
          <ReviewCard
            key={`${tvShow.title}-${index}`}
            item={tvShow}
            type="tv"
            styleVariant="poster-banner"
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
