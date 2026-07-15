import { Fragment } from 'react';
import CoverTile, { gradientForKey } from './CoverTile';
import StarRating from './StarRating';
import Markdown from './Markdown';
import { formatReviewDate } from '../lib/dateFormat';
import { useExpandableText } from '../hooks/useExpandableText';

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
  const reviewText = item.review_text || '';
  const { displayText, truncated, expanded, toggle } = useExpandableText(reviewText, 260);

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
        {item.date && <p className="square-cover-date">{formatReviewDate(item.date)}</p>}
        {tracks.length > 0 && (
          <p className="square-cover-highlights">
            <span className="square-cover-highlights-label">HIGHLIGHTS</span>
            {' · '}
            {tracks.map((track, index) => (
              <Fragment key={index}>
                {index > 0 && ' · '}
                <Markdown inline>{track}</Markdown>
              </Fragment>
            ))}
          </p>
        )}
        {reviewText && (
          <div className="square-cover-snippet">
            <Markdown>{displayText}</Markdown>
          </div>
        )}
        {truncated && (
          <button
            type="button"
            className="review-expand-btn"
            onClick={toggle}
          >
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>
    </div>
  );
}

function SpineCoverCard({ item, getTitle, getRating, getThoughts, gradient }) {
  const fullText = getThoughts();
  const { displayText, truncated, expanded, toggle } = useExpandableText(fullText, 260);

  const metaParts = [
    item.author,
    item.pageCount ? `${item.pageCount}pp` : null,
    item.firstPublishedYear || null,
    item.editedDate ? `Updated ${formatReviewDate(item.editedDate)}` : (item.date ? formatReviewDate(item.date) : null),
  ].filter(Boolean);

  const title = getTitle();
  const rating = getRating();
  const metaText = metaParts.join(' · ');
  const tileStyle = { background: gradient || gradientForKey(item.id || title) };

  return (
    <div className="spine-cover-card spine-v4-card">
      <div className="spine-cover-tile" style={tileStyle} />
      <div className="spine-cover-body spine-v4-body">
        <h3 className="spine-cover-title spine-v4-title">{title}</h3>
        <p className="spine-v4-meta-line">
          <span className="spine-v4-meta-label">rating</span>
          <span className="spine-v4-meta-value">{rating}/5</span>
          {metaText && (
            <>
              <span className="spine-v4-meta-label">details</span>
              <span className="spine-v4-meta-value">{metaText}</span>
            </>
          )}
        </p>
        <hr className="spine-v4-rule" />
        {fullText && (
          <div className="spine-cover-snippet spine-v4-snippet">
            <Markdown>{displayText}</Markdown>
          </div>
        )}
        {truncated && (
          <button
            type="button"
            className="review-expand-btn"
            onClick={toggle}
          >
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>
    </div>
  );
}

function PosterBannerCard({ item, getTitle, getRating, getThoughts, formatReviewDate, gradient }) {
  const fullThoughts = getThoughts();
  const { displayText, truncated, expanded, toggle } = useExpandableText(fullThoughts, 260);

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
          {item.date && <span className="poster-banner-date">{formatReviewDate(item.date)}</span>}
        </div>
        {fullThoughts && (
          <div className="poster-banner-snippet">
            <Markdown>{displayText}</Markdown>
          </div>
        )}
        {truncated && (
          <button
            type="button"
            className="review-expand-btn"
            onClick={toggle}
          >
            {expanded ? 'Show less' : 'Read more'}
          </button>
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
      <PosterBannerCard
        item={item}
        getTitle={getTitle}
        getRating={getRating}
        getThoughts={getThoughts}
        formatReviewDate={formatReviewDate}
        gradient={gradient}
      />
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
        <div className="review-text">
          {getThoughtsLabel() && <strong>{getThoughtsLabel()}: </strong>}
          <Markdown>{getThoughts()}</Markdown>
        </div>
      )}
      
      {item.date && (
        <p className="review-date">
          Date: {formatReviewDate(item.date)}
        </p>
      )}

      {item.editedDate && (
        <p className="review-date">
          Updated: {formatReviewDate(item.editedDate)}
        </p>
      )}
    </div>
  );
}