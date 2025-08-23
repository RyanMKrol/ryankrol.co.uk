import Link from 'next/link'

export default function Home() {
  return (
    <div className="container">
      <div style={{textAlign: 'center', marginBottom: '3rem'}}>
        <h1 style={{fontSize: '3rem', fontWeight: 'bold', color: 'black', marginBottom: '1rem'}}>
          Welcome to ryankrol.co.uk
        </h1>
        <p style={{fontSize: '1.25rem', color: 'gray'}}>
          Your personal space for reviews and more
        </p>
      </div>

      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem'}}>
        <Link href="/reviews" style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          textDecoration: 'none',
          color: 'inherit',
          transition: 'box-shadow 0.2s'
        }}>
          <div style={{textAlign: 'center'}}>
            <div style={{fontSize: '2.5rem', marginBottom: '0.75rem'}}>📝</div>
            <h2 style={{fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem'}}>All Reviews</h2>
            <p style={{color: '#6b7280', fontSize: '0.875rem'}}>Browse all reviews</p>
          </div>
        </Link>
        
        <Link href="/reviews/books" style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          textDecoration: 'none',
          color: 'inherit',
          transition: 'box-shadow 0.2s'
        }}>
          <div style={{textAlign: 'center'}}>
            <div style={{fontSize: '2.5rem', marginBottom: '0.75rem'}}>📚</div>
            <h2 style={{fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem'}}>Books</h2>
            <p style={{color: '#6b7280', fontSize: '0.875rem'}}>Book reviews & ratings</p>
          </div>
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
          <div style={{textAlign: 'center'}}>
            <div style={{fontSize: '2.5rem', marginBottom: '0.75rem'}}>🎬</div>
            <h2 style={{fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem'}}>Movies</h2>
            <p style={{color: '#6b7280', fontSize: '0.875rem'}}>Movie reviews & ratings</p>
          </div>
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
          <div style={{textAlign: 'center'}}>
            <div style={{fontSize: '2.5rem', marginBottom: '0.75rem'}}>📺</div>
            <h2 style={{fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem'}}>TV Shows</h2>
            <p style={{color: '#6b7280', fontSize: '0.875rem'}}>TV show reviews & ratings</p>
          </div>
        </Link>
      </div>
    </div>
  )
}