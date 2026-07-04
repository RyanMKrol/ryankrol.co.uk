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

const PAGE_SIZE = 12;

export function summarizeBooks(books) {
  const rated = books.length;
  const avgRating = rated
    ? books.reduce((sum, book) => sum + (book.rating || 0), 0) / rated
    : 0;
  const currentYear = new Date().getFullYear();
  const thisYear = books.filter((book) => {
    const date = book.editedDate || book.date;
    if (!date) return false;
    const year = Number(date.split('-')[2]);
    return year === currentYear;
  }).length;

  return { rated, avgRating, thisYear };
}

export default function Books() {
  const router = useRouter();
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
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
    async function fetchBooks() {
      try {
        const response = await fetch('/api/reviews/books');
        if (!response.ok) throw new Error('Failed to fetch books');
        const data = await response.json();

        setBooks(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchBooks();
  }, []);

  useEffect(() => {
    let filtered = books.filter(
      (book) =>
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (book.author || '').toLowerCase().includes(searchTerm.toLowerCase())
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

    setFilteredBooks(filtered);
  }, [searchTerm, books, sortBy]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy]);

  if (loading) {
    return (
      <div className="review-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading book reviews...</p>
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

  const { rated, avgRating, thisYear } = summarizeBooks(books);
  const { items: pagedBooks, page, pageCount } = paginate(filteredBooks, currentPage, PAGE_SIZE);

  return (
    <div className="review-container">
      <Header />

      <div className="collection-review-header">
        <div className="collection-review-title-group">
          <h1 className="page-title">books</h1>
          <p className="collection-review-meta">
            {rated} rated · avg {avgRating.toFixed(1)}★ · {thisYear} this year
          </p>
        </div>

        <div className="collection-review-controls">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="search by title or author..."
          />
          <PillGroup
            options={SORT_OPTIONS}
            value={sortBy}
            onChange={setSortBy}
          />
        </div>
      </div>

      <div className="spine-cover-list">
        {pagedBooks.map((book, index) => (
          <ReviewCard
            key={`${book.title}-${book.author}-${index}`}
            item={book}
            type="book"
            isLast={index === pagedBooks.length - 1}
            styleVariant="spine-cover"
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
