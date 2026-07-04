const GRADIENT_PAIRS = [
  ['#FF5C39', '#FFA98C'], // coral
  ['#4B4DED', '#9C9DF5'], // indigo
  ['#159A8C', '#6FCBC0'], // teal
  ['#F4A72C', '#FBD285'], // marigold
  ['#F25CA2', '#F9AACD'], // pink
  ['#7A5AF8', '#C3B6FC'], // grape
  ['#2FA96B', '#8FD3AE'], // green
  ['#8A837A', '#D8D2C8'], // neutral
  ['#1A1714', '#5A544C'], // neutral dark
];

function hashString(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function gradientForKey(key) {
  const [from, to] = GRADIENT_PAIRS[hashString(String(key)) % GRADIENT_PAIRS.length];
  return `linear-gradient(135deg, ${from}, ${to})`;
}

export function assignGradients(keys) {
  const recentIndices = [];
  return keys.map((key) => {
    const preferred = hashString(String(key)) % GRADIENT_PAIRS.length;
    let chosen = preferred;
    if (recentIndices.includes(preferred)) {
      chosen = preferred;
      for (let offset = 1; offset < GRADIENT_PAIRS.length; offset++) {
        const candidate = (preferred + offset) % GRADIENT_PAIRS.length;
        if (!recentIndices.includes(candidate)) {
          chosen = candidate;
          break;
        }
      }
    }

    recentIndices.push(chosen);
    if (recentIndices.length > 4) recentIndices.shift();

    const [from, to] = GRADIENT_PAIRS[chosen];
    return `linear-gradient(135deg, ${from}, ${to})`;
  });
}

export default function CoverTile({ title, subtitle, imageUrl, id, aspectRatio = '1 / 1', gradient }) {
  const tileStyle = imageUrl
    ? { aspectRatio }
    : { aspectRatio, background: gradient || gradientForKey(id || title || '') };

  return (
    <div className="cover-tile-wrap">
      <div className="cover-tile" style={tileStyle}>
        {imageUrl && (
          <img className="cover-tile-image" src={imageUrl} alt={title || ''} />
        )}
      </div>
      {(title || subtitle) && (
        <div className="cover-tile-caption">
          {title && <p className="cover-tile-title">{title}</p>}
          {subtitle && <p className="cover-tile-subtitle">{subtitle}</p>}
        </div>
      )}
    </div>
  );
}
