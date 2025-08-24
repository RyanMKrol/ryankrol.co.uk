import Link from 'next/link'

export default function Home() {
  return (
    <div className="container">
      <div style={{textAlign: 'center', marginBottom: '3rem'}}>
        <h1 style={{fontSize: '3rem', fontWeight: 'bold', color: 'black', marginBottom: '1rem'}}>
          Welcome to ryankrol.co.uk
        </h1>
        <p style={{fontSize: '1.25rem', color: 'gray'}}>
          Reviews, workouts, and random thoughts
        </p>
      </div>

      <nav style={{marginTop: '2rem'}}>
        <ul style={{listStyle: 'none', margin: 0, padding: 0}}>
          <li style={{marginBottom: '1.5rem'}}>
            <Link href="/reviews/books" style={{
              textDecoration: 'none',
              color: '#111827',
              display: 'block',
              padding: '0.75rem 0',
              borderBottom: '1px solid #e5e7eb',
              fontSize: '1.125rem',
              fontWeight: '500',
              transition: 'color 0.2s'
            }}>
              📚 Books
            </Link>
          </li>
          <li style={{marginBottom: '1.5rem'}}>
            <Link href="/reviews/movies" style={{
              textDecoration: 'none',
              color: '#111827',
              display: 'block',
              padding: '0.75rem 0',
              borderBottom: '1px solid #e5e7eb',
              fontSize: '1.125rem',
              fontWeight: '500',
              transition: 'color 0.2s'
            }}>
              🎬 Movies
            </Link>
          </li>
          <li style={{marginBottom: '1.5rem'}}>
            <Link href="/reviews/tv" style={{
              textDecoration: 'none',
              color: '#111827',
              display: 'block',
              padding: '0.75rem 0',
              borderBottom: '1px solid #e5e7eb',
              fontSize: '1.125rem',
              fontWeight: '500',
              transition: 'color 0.2s'
            }}>
              📺 TV Shows
            </Link>
          </li>
          <li style={{marginBottom: '1.5rem'}}>
            <Link href="/reviews/albums" style={{
              textDecoration: 'none',
              color: '#111827',
              display: 'block',
              padding: '0.75rem 0',
              borderBottom: '1px solid #e5e7eb',
              fontSize: '1.125rem',
              fontWeight: '500',
              transition: 'color 0.2s'
            }}>
              🎵 Albums
            </Link>
          </li>
          <li>
            <Link href="/workouts" style={{
              textDecoration: 'none',
              color: '#111827',
              display: 'block',
              padding: '0.75rem 0',
              fontSize: '1.125rem',
              fontWeight: '500',
              transition: 'color 0.2s'
            }}>
              🏋️ Workouts
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  )
}