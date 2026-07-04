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

const PAGE_SIZE = 9;

export function summarizeMovies(movies) {
  const rated = movies.length;
  const avgRating = rated
    ? movies.reduce((sum, movie) => sum + (movie.rating || 0), 0) / rated
    : 0;
  const currentYear = new Date().getFullYear();
  const thisYear = movies.filter((movie) => {
    const date = movie.editedDate || movie.date;
    if (!date) return false;
    const year = Number(date.split('-')[2]);
    return year === currentYear;
  }).length;

  return { rated, avgRating, thisYear };
}

export default function Movies() {
  const router = useRouter();
  const [movies, setMovies] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState([]);
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
    async function fetchMovies() {
      try {
        const response = await fetch('/api/reviews/movies');
        if (!response.ok) throw new Error('Failed to fetch movies');
        const data = await response.json();

        setMovies(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchMovies();
  }, []);

  useEffect(() => {
    let filtered = movies.filter((movie) =>
      movie.title.toLowerCase().includes(searchTerm.toLowerCase())
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

    setFilteredMovies(filtered);
  }, [searchTerm, movies, sortBy]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy]);

  if (loading) {
    return (
      <div className="review-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading movie reviews...</p>
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

  const { rated, avgRating, thisYear } = summarizeMovies(movies);
  const { items: pagedMovies, page, pageCount } = paginate(filteredMovies, currentPage, PAGE_SIZE);
  const movieGradients = assignGradients(pagedMovies.map((movie, index) => movie.id || `${movie.title}-${index}`));

  return (
    <div className="review-container">
      <Header />

      <div className="collection-review-header">
        <div className="collection-review-title-group">
          <h1 className="page-title">movies</h1>
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
          <SortButtons
            fields={SORT_FIELDS}
            sortBy={sortBy}
            onChange={setSortBy}
          />
        </div>
      </div>

      <div className="poster-banner-grid">
        {pagedMovies.map((movie, index) => (
          <ReviewCard
            key={`${movie.title}-${index}`}
            item={movie}
            type="movie"
            styleVariant="poster-banner"
            gradient={movieGradients[index]}
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
