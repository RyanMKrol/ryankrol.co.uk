import Link from 'next/link'
import Header from '../../components/Header'

export default function Reviews() {
  return (
    <div className="container">
      <Header />
      <h1 className="page-title">Reviews</h1>
      
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem'}}>
        <Link href="/reviews/books" style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          textDecoration: 'none',
          color: 'inherit',
          transition: 'box-shadow 0.2s'
        }}>
          <h2 style={{fontSize: '1.5rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem'}}>📚 Books</h2>
          <p style={{color: '#6b7280'}}>Explore book reviews and ratings</p>
        </Link>
        
        <Link href="/reviews/movies" style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          textDecoration: 'none',
          color: 'inherit',
          transition: 'box-shadow 0.2s'
        }}>
          <h2 style={{fontSize: '1.5rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem'}}>🎬 Movies</h2>
          <p style={{color: '#6b7280'}}>Check out movie reviews and ratings</p>
        </Link>
        
        <Link href="/reviews/tv" style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          textDecoration: 'none',
          color: 'inherit',
          transition: 'box-shadow 0.2s'
        }}>
          <h2 style={{fontSize: '1.5rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem'}}>📺 TV Shows</h2>
          <p style={{color: '#6b7280'}}>Discover TV show reviews and ratings</p>
        </Link>
      </div>
    </div>
  )
}