export default function ReviewCard({ item, type, isLast = false, styleVariant }) {
  const getTitle = () => {
    if (type === 'movie' || type === 'tv') return item.title;
    return item.title; // For books and albums, return just the title
  };

  const getAuthor = () => {
    if (type === 'book') return item.author;
    if (type === 'album') return item.artist;
    return null;
  };

  const hasAuthor = () => {
    return type === 'book' || type === 'album';
  };

  const getRating = () => {
    return item.rating || 0; // All types now use 5-point scale
  };

  const getThoughts = () => {
    if (type === 'album') {
      return item.highlights || '';
    }
    return item.review_text || '';
  };

  const getThoughtsLabel = () => {
    if (type === 'album') return 'Highlights';
    return '';
  };

  const getCardClass = () => {
    let classes = 'review-card';
    if (styleVariant) {
      classes += ` review-style-${styleVariant}`;
    }
    if (!isLast) {
      classes += ' border-bottom';
    }
    return classes;
  };

  return (
    <div className={getCardClass()}>
      <h3 className="review-title">
        {getTitle()}
      </h3>
      {hasAuthor() && (
        <p className="review-author">by {getAuthor()}</p>
      )}
      
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
          {getThoughtsLabel() && <strong>{getThoughtsLabel()}: </strong>}{getThoughts()}
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