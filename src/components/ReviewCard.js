export default function ReviewCard({ item, type, isLast = false, styleVariant }) {
  const getTitle = () => {
    if (type === 'movie' || type === 'tv') return item.title;
    return item.title; // For books and albums, return just the title
  };

  const getAuthor = () => {
    if (type === 'book') return item.author;
    if (type === 'album') return item.artist;
    if (type === 'perfume') return item.designer;
    return null;
  };

  const hasAuthor = () => {
    return type === 'book' || type === 'album' || type === 'perfume';
  };

  const getMaxRating = () => {
    return type === 'perfume' ? 10 : 5; // Perfumes are rated on a 0-10 scale
  };

  const getRating = () => {
    return item.rating || 0;
  };

  const getThoughts = () => {
    if (type === 'album') {
      return item.highlights || '';
    }
    if (type === 'perfume') {
      return item.description || '';
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
        <p className="review-author">
          by {getAuthor()}
          {type === 'perfume' && item.type && ` (${item.type})`}
        </p>
      )}

      <div className="rating-container">
        <span className="rating-score">
          {getRating()}/{getMaxRating()}
        </span>
        <div className="stars">
          {[...Array(getMaxRating())].map((_, i) => (
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

      {item.editedDate && (
        <p className="review-date">
          Updated: {item.editedDate}
        </p>
      )}
    </div>
  );
}