import { useState, useEffect } from 'react';
import ReviewCard from '../../../components/ReviewCard';

export default function TV() {
  const [tvShows, setTvShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchTvShows() {
      try {
        const response = await fetch('/api/reviews/tv');
        if (!response.ok) throw new Error('Failed to fetch TV shows');
        const data = await response.json();
        
        // Sort by date (most recent first)
        const sortedTvShows = data.sort((a, b) => new Date(b.date) - new Date(a.date));
        setTvShows(sortedTvShows);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchTvShows();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-6">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading TV show reviews...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 py-6">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <p className="text-red-600">Error: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">📺 TV Show Reviews</h1>
        

        <div className="bg-white rounded-lg shadow-md">
          {tvShows.map((tvShow, index) => (
            <ReviewCard 
              key={`${tvShow.title}-${index}`}
              item={tvShow}
              type="tv"
              isLast={index === tvShows.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}