import Link from 'next/link'
import NowPlaying from '../components/NowPlaying'

export default function Home() {
  return (
    <div className="container">
      <div style={{textAlign: 'center', marginBottom: '2rem'}}>
        <h1 style={{fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem'}} className="page-title">
          Howdy!
        </h1>
        <p className="text-muted" style={{fontSize: '1.25rem'}}>
          Content consumption and gym attendance
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
            <h2 className="home-section-title">
              My Ratings
            </h2>
            <ul style={{listStyle: 'none', margin: 0, padding: 0, paddingLeft: '2rem'}}>
              <li style={{marginBottom: '1rem'}}>
                <Link href="/reviews/books" className="home-nav-link">
                  📚 Books
                </Link>
              </li>
              <li style={{marginBottom: '1rem'}}>
                <Link href="/reviews/movies" className="home-nav-link">
                  🎬 Movies
                </Link>
              </li>
              <li style={{marginBottom: '1rem'}}>
                <Link href="/reviews/tv" className="home-nav-link">
                  📺 TV Shows
                </Link>
              </li>
              <li style={{marginBottom: '1rem'}}>
                <Link href="/reviews/albums" className="home-nav-link">
                  🎵 Albums
                </Link>
              </li>
            </ul>
          </li>
          <li style={{marginBottom: '1.5rem'}}>
            <Link href="/workouts" className="home-nav-link-large">
              🏋️ My Workouts
            </Link>
          </li>
          <li style={{marginBottom: '1.5rem'}}>
            <Link href="/listening" className="home-nav-link-large">
              🎧 My Listening History
            </Link>
          </li>
          <li style={{marginBottom: '1.5rem'}}>
            <Link href="/projects" className="home-nav-link-large">
              💻 My Projects
            </Link>
          </li>
          <li>
            <Link href="/vinyl" className="home-nav-link-large no-border">
              💿 My Vinyl
            </Link>
          </li>
        </ul>
      </nav>

      <div style={{marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--color-border)'}}>
        <h2 className="home-section-title" style={{marginBottom: '1rem'}}>
          Connect
        </h2>
        <div style={{display: 'flex', flexWrap: 'wrap', gap: '1.5rem'}}>
          <a
            href="https://instagram.com/_ryankrol"
            target="_blank"
            rel="noopener noreferrer"
            className="home-social-link"
          >
            📷 Instagram
          </a>
          <a
            href="https://facebook.com/krol.ryan"
            target="_blank"
            rel="noopener noreferrer"
            className="home-social-link"
          >
            📘 Facebook
          </a>
          <a
            href="https://github.com/RyanMKrol"
            target="_blank"
            rel="noopener noreferrer"
            className="home-social-link"
          >
            💻 GitHub
          </a>
          <a
            href="https://linkedin.com/in/ryan-krol-265308a2/"
            target="_blank"
            rel="noopener noreferrer"
            className="home-social-link"
          >
            💼 LinkedIn
          </a>
          <a
            href="https://last.fm/user/somethingmeaty"
            target="_blank"
            rel="noopener noreferrer"
            className="home-social-link"
          >
            🎧 Last.fm
          </a>
        </div>
      </div>
    </div>
  )
}
