import CoverTile, { gradientForKey } from './CoverTile';
import StarRating from './StarRating';

function splitHighlights(highlights) {
  if (!highlights) return [];
  return highlights
    .split(/[\n,.;]+/)
    .map((fragment) => fragment.trim())
    .filter(Boolean)
    .slice(0, 4);
}

function SquareCoverCard({ item, getTitle, getAuthor, getRating, getThoughts, gradient }) {
  const tracks = splitHighlights(getThoughts());

  return (
    <div className="square-cover-card">
      <CoverTile
        title={null}
        imageUrl={item.thumbnail || item.coverUrl}
        id={item.id || getTitle()}
        aspectRatio="1 / 1"
        gradient={gradient}
      />
      <div className="square-cover-body">
        <div className="square-cover-heading">
          <h3 className="square-cover-title">{getTitle()}</h3>
          <StarRating rating={getRating()} readOnly />
        </div>
        {getAuthor() && <p className="square-cover-artist">{getAuthor()}</p>}
        {tracks.length > 0 && (
          <p className="square-cover-highlights">
            <span className="square-cover-highlights-label">HIGHLIGHTS</span>
            {' · '}
            {tracks.join(' · ')}
          </p>
        )}
      </div>
    </div>
  );
}

function SpineCoverCard({ item, getTitle, getRating, getThoughts, gradient }) {
  const metaParts = [
    item.author,
    item.pageCount ? `${item.pageCount}pp` : null,
    item.firstPublishedYear || null,
  ].filter(Boolean);

  return (
    <div className="spine-cover-card">
      <div
        className="spine-cover-tile"
        style={{ background: gradient || gradientForKey(item.id || getTitle()) }}
      />
      <div className="spine-cover-body">
        <div className="spine-cover-heading">
          <h3 className="spine-cover-title">{getTitle()}</h3>
          <StarRating rating={getRating()} readOnly />
        </div>
        {metaParts.length > 0 && (
          <p className="spine-cover-meta">{metaParts.join(' · ')}</p>
        )}
        {getThoughts() && (
          <p className="spine-cover-snippet">{getThoughts()}</p>
        )}
      </div>
    </div>
  );
}

export default function ReviewCard({ item, type, isLast = false, styleVariant, gradient }) {
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

  if (styleVariant === 'spine-cover') {
    return (
      <SpineCoverCard
        item={item}
        getTitle={getTitle}
        getRating={getRating}
        getThoughts={getThoughts}
        gradient={gradient}
      />
    );
  }

  if (styleVariant === 'square-cover') {
    return (
      <SquareCoverCard
        item={item}
        getTitle={getTitle}
        getAuthor={getAuthor}
        getRating={getRating}
        getThoughts={getThoughts}
        gradient={gradient}
      />
    );
  }

  if (styleVariant === 'poster-banner') {
    return (
      <div className="poster-banner-card">
        <div
          className="poster-banner"
          style={{ background: gradient || gradientForKey(item.id || getTitle()) }}
        >
          <h3 className="poster-banner-title">{getTitle()}</h3>
        </div>
        <div className="poster-banner-body">
          <div className="poster-banner-meta">
            <StarRating rating={getRating()} readOnly />
            {item.date && <span className="poster-banner-date">{item.date}</span>}
          </div>
          {getThoughts() && (
            <p className="poster-banner-snippet">{getThoughts()}</p>
          )}
        </div>
      </div>
    );
  }

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