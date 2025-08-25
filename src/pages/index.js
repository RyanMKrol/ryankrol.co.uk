import Link from 'next/link'
import NowPlaying from '../components/NowPlaying'

export default function Home() {
  return (
    <div className="container">
      <div style={{textAlign: 'center', marginBottom: '2rem'}}>
        <h1 style={{fontSize: '3rem', fontWeight: 'bold', color: 'black', marginBottom: '1rem'}}>
          Howdy!
        </h1>
        <p style={{fontSize: '1.25rem', color: 'gray'}}>
          Reviews, workouts, and random thoughts
        </p>
      </div>

      <div style={{marginBottom: '2rem', display: 'flex', justifyContent: 'center'}}>
        <div style={{maxWidth: '400px', width: '100%'}}>
          <NowPlaying />
        </div>
      </div>

      <nav style={{marginTop: '2rem'}}>
        <ul style={{listStyle: 'none', margin: 0, padding: 0}}>
          <li style={{marginBottom: '1rem'}}>
            <h2 style={{fontSize: '1.25rem', fontWeight: '600', color: '#374151', marginBottom: '0.75rem'}}>
              My Ratings
            </h2>
            <ul style={{listStyle: 'none', margin: 0, padding: 0, paddingLeft: '2rem'}}>
              <li style={{marginBottom: '1rem'}}>
                <Link href="/reviews/books" style={{
                  textDecoration: 'none',
                  color: '#111827',
                  display: 'block',
                  padding: '0.5rem 0',
                  borderBottom: '1px solid #e5e7eb',
                  fontSize: '1rem',
                  fontWeight: '500',
                  transition: 'color 0.2s'
                }}>
                  📚 Books
                </Link>
              </li>
              <li style={{marginBottom: '1rem'}}>
                <Link href="/reviews/movies" style={{
                  textDecoration: 'none',
                  color: '#111827',
                  display: 'block',
                  padding: '0.5rem 0',
                  borderBottom: '1px solid #e5e7eb',
                  fontSize: '1rem',
                  fontWeight: '500',
                  transition: 'color 0.2s'
                }}>
                  🎬 Movies
                </Link>
              </li>
              <li style={{marginBottom: '1rem'}}>
                <Link href="/reviews/tv" style={{
                  textDecoration: 'none',
                  color: '#111827',
                  display: 'block',
                  padding: '0.5rem 0',
                  borderBottom: '1px solid #e5e7eb',
                  fontSize: '1rem',
                  fontWeight: '500',
                  transition: 'color 0.2s'
                }}>
                  📺 TV Shows
                </Link>
              </li>
              <li style={{marginBottom: '1rem'}}>
                <Link href="/reviews/albums" style={{
                  textDecoration: 'none',
                  color: '#111827',
                  display: 'block',
                  padding: '0.5rem 0',
                  borderBottom: '1px solid #e5e7eb',
                  fontSize: '1rem',
                  fontWeight: '500',
                  transition: 'color 0.2s'
                }}>
                  🎵 Albums
                </Link>
              </li>
            </ul>
          </li>
          <li style={{marginBottom: '1.5rem'}}>
            <Link href="/workouts" style={{
              textDecoration: 'none',
              color: '#111827',
              display: 'block',
              padding: '0.75rem 0',
              borderBottom: '1px solid #e5e7eb',
              fontSize: '1.125rem',
              fontWeight: '500',
              transition: 'color 0.2s'
            }}>
              🏋️ My Workouts
            </Link>
          </li>
          <li style={{marginBottom: '1.5rem'}}>
            <Link href="/listening" style={{
              textDecoration: 'none',
              color: '#111827',
              display: 'block',
              padding: '0.75rem 0',
              borderBottom: '1px solid #e5e7eb',
              fontSize: '1.125rem',
              fontWeight: '500',
              transition: 'color 0.2s'
            }}>
              🎧 My Listening History
            </Link>
          </li>
          <li style={{marginBottom: '1.5rem'}}>
            <Link href="/projects" style={{
              textDecoration: 'none',
              color: '#111827',
              display: 'block',
              padding: '0.75rem 0',
              borderBottom: '1px solid #e5e7eb',
              fontSize: '1.125rem',
              fontWeight: '500',
              transition: 'color 0.2s'
            }}>
              💻 My Projects
            </Link>
          </li>
          <li>
            <Link href="/vinyl" style={{
              textDecoration: 'none',
              color: '#111827',
              display: 'block',
              padding: '0.75rem 0',
              fontSize: '1.125rem',
              fontWeight: '500',
              transition: 'color 0.2s'
            }}>
              🎵 My Vinyl
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  )
}