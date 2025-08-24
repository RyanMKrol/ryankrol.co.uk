export default function ReviewCard({ item, type, isLast = false, styleVariant }) {
  const getTitle = () => {
    if (type === 'book') return `${item.title} by ${item.author}`;
    if (type === 'movie') return item.title;
    if (type === 'tv') return item.title;
    return item.title;
  };

  const getRating = () => {
    return item.rating || 0;
  };

  const getThoughts = () => {
    return item.review_text || '';
  };

  const getCardClass = () => {
    if (styleVariant) {
      return `review-card review-style-${styleVariant}`;
    }
    return `review-card ${isLast ? '' : 'border-bottom'}`;
  };

  return (
    <div className={getCardClass()}>
      <h3 className="review-title">
        {getTitle()}
      </h3>
      
      <div className="rating-container">
        <span className="rating-score">
          {getRating()}/5
        </span>
        <div className="stars">
          {[...Array(5)].map((_, i) => (
            <span 
              key={i}
              className={`star ${i < getRating() ? 'filled' : 'empty'}`}
            >
              ★
            </span>
          ))}
        </div>
      </div>
      
      {getThoughts() && (
        <p className="review-text">
          {getThoughts()}
        </p>
      )}
      
      {item.date && (
        <p className="review-date">
          Date: {item.date}
        </p>
      )}
    </div>
  );
}