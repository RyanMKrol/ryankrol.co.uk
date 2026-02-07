import Link from 'next/link'
import NowPlaying from '../components/NowPlaying'

export default function Home() {
  return (
    <div className="container" style={{display: 'flex', flexDirection: 'column', minHeight: '100vh'}}>
      <div style={{textAlign: 'center', marginBottom: '2rem'}}>
        <h1 style={{fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem'}} className="page-title">
          Howdy!
        </h1>
        <p className="terminal-prompt">
          <span className="terminal-prompt-char">&gt;</span>
          Content consumption and gym attendance
        </p>
      </div>

      <div style={{marginBottom: '2rem', display: 'flex', justifyContent: 'center'}}>
        <div style={{maxWidth: '400px', width: '100%'}}>
          <NowPlaying />
        </div>
      </div>

      <div className="home-grid">
        <Link href="/reviews/books" className="home-grid-card magenta">
          <div className="home-grid-card-path">~/books</div>
          <div className="home-grid-card-desc">Book reviews and ratings</div>
        </Link>

        <Link href="/reviews/movies" className="home-grid-card magenta">
          <div className="home-grid-card-path">~/movies</div>
          <div className="home-grid-card-desc">Movie reviews and ratings</div>
        </Link>

        <Link href="/reviews/tv" className="home-grid-card magenta">
          <div className="home-grid-card-path">~/tv</div>
          <div className="home-grid-card-desc">TV show reviews and ratings</div>
        </Link>

        <Link href="/reviews/albums" className="home-grid-card magenta">
          <div className="home-grid-card-path">~/albums</div>
          <div className="home-grid-card-desc">Album reviews and ratings</div>
        </Link>

        <Link href="/workouts" className="home-grid-card">
          <div className="home-grid-card-path">~/workouts</div>
          <div className="home-grid-card-desc">Gym sessions and progress</div>
        </Link>

        <Link href="/listening" className="home-grid-card purple">
          <div className="home-grid-card-path">~/listening</div>
          <div className="home-grid-card-desc">Most played albums via Last.fm</div>
        </Link>

        <Link href="/projects" className="home-grid-card gold">
          <div className="home-grid-card-path">~/projects</div>
          <div className="home-grid-card-desc">GitHub repositories</div>
        </Link>

        <Link href="/vinyl" className="home-grid-card pink">
          <div className="home-grid-card-path">~/vinyl</div>
          <div className="home-grid-card-desc">Vinyl record collection</div>
        </Link>
      </div>

      <div style={{marginTop: 'auto', paddingTop: '2rem', borderTop: '1px solid var(--color-border)', textAlign: 'center', paddingBottom: '2rem'}}>
        <div style={{display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.9rem'}}>
          <a
            href="https://instagram.com/_ryankrol"
            target="_blank"
            rel="noopener noreferrer"
            className="home-social-link"
          >
            instagram
          </a>
          <span className="text-muted">/</span>
          <a
            href="https://facebook.com/krol.ryan"
            target="_blank"
            rel="noopener noreferrer"
            className="home-social-link"
          >
            facebook
          </a>
          <span className="text-muted">/</span>
          <a
            href="https://github.com/RyanMKrol"
            target="_blank"
            rel="noopener noreferrer"
            className="home-social-link"
          >
            github
          </a>
          <span className="text-muted">/</span>
          <a
            href="https://linkedin.com/in/ryan-krol-265308a2/"
            target="_blank"
            rel="noopener noreferrer"
            className="home-social-link"
          >
            linkedin
          </a>
          <span className="text-muted">/</span>
          <a
            href="https://last.fm/user/somethingmeaty"
            target="_blank"
            rel="noopener noreferrer"
            className="home-social-link"
          >
            last.fm
          </a>
        </div>
      </div>
    </div>
  )
}
