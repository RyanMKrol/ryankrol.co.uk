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
    <div className={`bg-white p-6 ${!isLast ? 'border-b border-gray-200' : ''}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {getTitle()}
      </h3>
      
      <div className="flex items-center mb-3">
        <span className="text-2xl font-bold text-blue-600 mr-2">
          {getRating()}/10
        </span>
        <div className="flex">
          {[...Array(10)].map((_, i) => (
            <span 
              key={i}
              className={`text-lg ${
                i < getRating() ? 'text-yellow-400' : 'text-gray-300'
              }`}
            >
              ★
            </span>
          ))}
        </div>
      </div>
      
      {getThoughts() && (
        <p className="text-gray-700 leading-relaxed mb-3">
          {getThoughts()}
        </p>
      )}
      
      {item.date && (
        <p className="text-sm text-gray-500">
          Reviewed: {item.date}
        </p>
      )}
    </div>
  );
}