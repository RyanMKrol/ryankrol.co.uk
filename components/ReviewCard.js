export default function ReviewCard({ item, type, isLast = false }) {
  const getTitle = () => {
    if (type === 'book') return `${item.title} by ${item.author}`;
    if (type === 'movie') return item.title;
    if (type === 'tv') return item.title;
    return item.title;
  };

  const getRating = () => {
    if (type === 'book') return item.rating;
    if (type === 'movie') return item.overallScore;
    if (type === 'tv') return item.overallScore;
    return item.rating;
  };

  const getThoughts = () => {
    if (type === 'book') return item.overview;
    if (type === 'movie') return item.gist;
    if (type === 'tv') return item.gist;
    return item.overview;
  };

  return (
    <div className={`review-card ${isLast ? '' : 'border-bottom'}`}>
      <h3 className="review-title">
        {getTitle()}
      </h3>
      
      <div className="rating-container">
        <span className="rating-score">
          {getRating()}/10
        </span>
        <div className="stars">
          {[...Array(10)].map((_, i) => (
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
          Reviewed: {item.date}
        </p>
      )}
    </div>
  );
}