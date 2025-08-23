import Link from 'next/link'

export default function Reviews() {
  return (
    <div className="min-h-screen bg-gray-100 py-6">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Reviews</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/reviews/books" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">📚 Books</h2>
            <p className="text-gray-600">Explore book reviews and ratings</p>
          </Link>
          
          <Link href="/reviews/movies" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">🎬 Movies</h2>
            <p className="text-gray-600">Check out movie reviews and ratings</p>
          </Link>
          
          <Link href="/reviews/tv" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">📺 TV Shows</h2>
            <p className="text-gray-600">Discover TV show reviews and ratings</p>
          </Link>
        </div>
      </div>
    </div>
  )
}