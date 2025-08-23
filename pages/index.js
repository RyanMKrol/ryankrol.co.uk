import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 py-6">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Welcome to ryankrol.co.uk
          </h1>
          <p className="text-xl text-gray-600">
            Your personal space for reviews and more
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link href="/reviews" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow group">
            <div className="text-center">
              <div className="text-4xl mb-3">📝</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600">All Reviews</h2>
              <p className="text-gray-600 text-sm">Browse all reviews</p>
            </div>
          </Link>
          
          <Link href="/reviews/books" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow group">
            <div className="text-center">
              <div className="text-4xl mb-3">📚</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600">Books</h2>
              <p className="text-gray-600 text-sm">Book reviews & ratings</p>
            </div>
          </Link>
          
          <Link href="/reviews/movies" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow group">
            <div className="text-center">
              <div className="text-4xl mb-3">🎬</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600">Movies</h2>
              <p className="text-gray-600 text-sm">Movie reviews & ratings</p>
            </div>
          </Link>
          
          <Link href="/reviews/tv" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow group">
            <div className="text-center">
              <div className="text-4xl mb-3">📺</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600">TV Shows</h2>
              <p className="text-gray-600 text-sm">TV show reviews & ratings</p>
            </div>
          </Link>
        </div>

      </div>
    </div>
  )
}