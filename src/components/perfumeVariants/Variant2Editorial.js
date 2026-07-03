export default function Variant2Editorial({ item }) {
  const hasSeasons = Array.isArray(item.seasons) && item.seasons.length > 0;

  return (
    <div className="perfume-v2-card">
      <p className="perfume-v2-type">{item.type}</p>

      <h3 className="perfume-v2-title">{item.title}</h3>

      {item.designer && (
        <p className="perfume-v2-byline">by {item.designer}</p>
      )}

      {item.description && (
        <blockquote className="perfume-v2-pullquote">
          {item.description}
        </blockquote>
      )}

      {hasSeasons && (
        <p className="perfume-v2-seasons">
          Best worn: {item.seasons.join(', ')}
        </p>
      )}

      <div className="perfume-v2-footer">
        <span className="perfume-v2-rating">{item.rating}/10</span>

        {item.fragranticaUrl && (
          <a
            href={item.fragranticaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="perfume-v2-fragrantica-link"
          >
            Continue reading on Fragrantica →
          </a>
        )}
      </div>
    </div>
  );
}
