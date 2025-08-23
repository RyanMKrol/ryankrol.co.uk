import { useState } from 'react';

export default function StarRating({ rating, onRatingChange }) {
  const [hoveredStar, setHoveredStar] = useState(0);

  const handleStarClick = (starValue) => {
    onRatingChange(starValue);
  };

  const handleStarHover = (starValue) => {
    setHoveredStar(starValue);
  };

  const handleMouseLeave = () => {
    setHoveredStar(0);
  };

  return (
    <div className="star-rating" onMouseLeave={handleMouseLeave}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`star-button ${
            star <= (hoveredStar || rating) ? 'filled' : 'empty'
          }`}
          onClick={() => handleStarClick(star)}
          onMouseEnter={() => handleStarHover(star)}
        >
          ★
        </button>
      ))}
      <span className="rating-text">{rating}/5</span>
    </div>
  );
}