import { Fragment, useState } from 'react';
import CoverTile, { gradientForKey } from './CoverTile';
import StarRating from './StarRating';
import Markdown from './Markdown';
import { formatReviewDate } from '../lib/dateFormat';
import { truncateReviewText } from '../lib/reviewText';

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
      </div>
    </div>
  );
}

function SpineCoverCard({ item, getTitle, getRating, getThoughts, gradient, designVariant }) {
  const [expanded, setExpanded] = useState(false);
  const fullText = getThoughts();
  const { text: previewText, truncated } = truncateReviewText(fullText, 260);
  const displayText = expanded ? fullText : previewText;

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
  const expandBtn = truncated && (
    <button
      type="button"
      className="spine-cover-expand-btn"
      onClick={() => setExpanded((e) => !e)}
    >
      {expanded ? 'Show less' : 'Read more'}
    </button>
  );

  // Variant 1 — "Ledger": numeric rating sits above the title as a small mono label,
  // metadata reads as one tight uppercase line.
  if (designVariant === 1) {
    return (
      <div className="spine-cover-card spine-v1-card">
        <div className="spine-cover-tile" style={tileStyle} />
        <div className="spine-cover-body spine-v1-body">
          <p className="spine-v1-rating">{rating}/5 ★</p>
          <h3 className="spine-cover-title spine-v1-title">{title}</h3>
          {metaText && <p className="spine-cover-meta spine-v1-meta">{metaText}</p>}
          {fullText && (
            <div className="spine-cover-snippet spine-v1-snippet">
              <Markdown>{displayText}</Markdown>
            </div>
          )}
          {expandBtn}
        </div>
      </div>
    );
  }

  // Variant 2 — "Badge": a circular rating badge floats over the tile corner,
  // title/meta stay stacked tight beneath it.
  if (designVariant === 2) {
    return (
      <div className="spine-cover-card spine-v2-card">
        <div className="spine-v2-tile-wrap">
          <div className="spine-cover-tile" style={tileStyle} />
          <span className="spine-v2-badge">{rating}</span>
        </div>
        <div className="spine-cover-body spine-v2-body">
          <h3 className="spine-cover-title spine-v2-title">{title}</h3>
          {metaText && <p className="spine-cover-meta spine-v2-meta">{metaText}</p>}
          {fullText && (
            <div className="spine-cover-snippet spine-v2-snippet">
              <Markdown>{displayText}</Markdown>
            </div>
          )}
          {expandBtn}
        </div>
      </div>
    );
  }

  // Variant 3 — "Ribbon": an accent-coloured left rule replaces the tile border,
  // stars sit inline with the title on one line.
  if (designVariant === 3) {
    return (
      <div className="spine-cover-card spine-v3-card">
        <div className="spine-cover-tile" style={tileStyle} />
        <div className="spine-cover-body spine-v3-body">
          <div className="spine-v3-heading">
            <h3 className="spine-cover-title spine-v3-title">{title}</h3>
            <StarRating rating={rating} readOnly />
          </div>
          {metaText && <p className="spine-cover-meta spine-v3-meta">{metaText}</p>}
          {fullText && (
            <div className="spine-cover-snippet spine-v3-snippet">
              <Markdown>{displayText}</Markdown>
            </div>
          )}
          {expandBtn}
        </div>
      </div>
    );
  }

  // Variant 4 — "Mono Label": all-mono metadata rendered as label:value pairs,
  // separated from the snippet by a thin rule.
  if (designVariant === 4) {
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
          {expandBtn}
        </div>
      </div>
    );
  }

  // Variant 5 — "Serif Feature": a larger serif title, stars demoted below the meta line.
  if (designVariant === 5) {
    return (
      <div className="spine-cover-card spine-v5-card">
        <div className="spine-cover-tile" style={tileStyle} />
        <div className="spine-cover-body spine-v5-body">
          <h3 className="spine-cover-title spine-v5-title">{title}</h3>
          {metaText && <p className="spine-cover-meta spine-v5-meta">{metaText}</p>}
          <StarRating rating={rating} readOnly />
          {fullText && (
            <div className="spine-cover-snippet spine-v5-snippet">
              <Markdown>{displayText}</Markdown>
            </div>
          )}
          {expandBtn}
        </div>
      </div>
    );
  }

  return (
    <div className="spine-cover-card">
      <div className="spine-cover-tile" style={tileStyle} />
      <div className="spine-cover-body">
        <div className="spine-cover-heading">
          <h3 className="spine-cover-title">{title}</h3>
          <StarRating rating={rating} readOnly />
        </div>
        {metaText && (
          <p className="spine-cover-meta">{metaText}</p>
        )}
        {fullText && (
          <div className="spine-cover-snippet">
            <Markdown>{displayText}</Markdown>
          </div>
        )}
        {expandBtn}
      </div>
    </div>
  );
}

export default function ReviewCard({ item, type, isLast = false, styleVariant, gradient, designVariant }) {
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
        designVariant={designVariant}
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
            {item.date && <span className="poster-banner-date">{formatReviewDate(item.date)}</span>}
          </div>
          {getThoughts() && (
            <div className="poster-banner-snippet">
              <Markdown>{getThoughts()}</Markdown>
            </div>
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