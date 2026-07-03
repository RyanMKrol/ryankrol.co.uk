import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Header from '../components/Header'
import NowPlaying from '../components/NowPlaying'
import StatBlock from '../components/StatBlock'
import CoverTile, { gradientForKey } from '../components/CoverTile'
import { tmdbPosterUrl } from '../lib/tmdb'

const QUICK_LINKS = [
  { href: '/vinyl', label: '~/vinyl' },
  { href: '/listening', label: '~/listening' },
  { href: '/projects', label: '~/projects' },
]

function parseUkDate(dateString) {
  if (!dateString) return null
  const [day, month, year] = dateString.split('-').map(Number)
  if (!day || !month || !year) return null
  return new Date(year, month - 1, day)
}

function sortByDateDesc(items) {
  return [...items].sort((a, b) => (parseUkDate(b.date) ?? 0) - (parseUkDate(a.date) ?? 0))
}

function sortByRatingDesc(items) {
  return [...items].sort((a, b) => (b.rating || 0) - (a.rating || 0))
}

export default function Home() {
  const [movies, setMovies] = useState([])
  const [tv, setTv] = useState([])
  const [books, setBooks] = useState([])
  const [albums, setAlbums] = useState([])
  const [vinyl, setVinyl] = useState([])
  const [workoutStats, setWorkoutStats] = useState(null)

  useEffect(() => {
    async function fetchJson(url) {
      const response = await fetch(url)
      if (!response.ok) return null
      return response.json()
    }

    async function fetchAll() {
      const [moviesData, tvData, booksData, albumsData, vinylData, statsData] = await Promise.all([
        fetchJson('/api/reviews/movies'),
        fetchJson('/api/reviews/tv'),
        fetchJson('/api/reviews/books'),
        fetchJson('/api/reviews/albums'),
        fetchJson('/api/vinyl'),
        fetchJson('/api/workouts/stats'),
      ])

      setMovies(moviesData || [])
      setTv(tvData || [])
      setBooks(booksData || [])
      setAlbums(albumsData || [])
      setVinyl(vinylData || [])
      setWorkoutStats(statsData)
    }

    fetchAll()
  }, [])

  const totalRated = movies.length + tv.length + books.length + albums.length + vinyl.length + (workoutStats?.totalWorkouts || 0)

  const wallItems = [
    ...sortByRatingDesc(movies).slice(0, 6).map((m) => ({
      key: `movie-${m.id}`,
      title: m.title,
      imageUrl: tmdbPosterUrl(m.posterPath),
    })),
    ...sortByRatingDesc(albums).slice(0, 6).map((a) => ({
      key: `album-${a.id}`,
      title: a.title,
      imageUrl: a.thumbnail || null,
    })),
    ...vinyl.slice(0, 6).map((v) => ({
      key: `vinyl-${v.id}`,
      title: v.title,
      imageUrl: v.thumbnail || null,
    })),
  ].slice(0, 18)

  const latestTakes = sortByDateDesc([
    ...movies.map((m) => ({ ...m, kind: 'movie' })),
    ...tv.map((t) => ({ ...t, kind: 'tv' })),
    ...books.map((b) => ({ ...b, kind: 'book' })),
    ...albums.map((a) => ({ ...a, kind: 'album', review_text: a.highlights })),
  ]).slice(0, 3)

  const recentActivity = workoutStats?.recentActivity || []
  const chronological = [...recentActivity].reverse()
  const maxVolume = chronological.reduce((max, w) => Math.max(max, w.totalVolume || 0), 0)
  const bestSessionVolume = maxVolume ? Math.round(maxVolume) : null

  const shelfItems = vinyl.slice(0, 4)

  return (
    <>
      <Head>
        <title>ryankrol.co.uk</title>
      </Head>

      <div className="container home-container">
        <Header />

        <section className="home-hero">
          <span className="collection-badge home-hero-badge">✦ A HOME FOR MY TASTE</span>
          <div className="home-hero-row">
            <div className="home-hero-copy">
              <h1 className="home-hero-title">Howdy.</h1>
              <p className="home-hero-tagline">
                A running record of everything I watch, read, hear, spin and lift.{' '}
                <strong>Content consumption &amp; gym attendance</strong>, kept honestly.
              </p>
            </div>
            <div className="home-hero-meta">
              <p>logging since 2019</p>
              <p>{totalRated} things rated</p>
              <p>updated today</p>
            </div>
          </div>
          <div className="home-hero-now-playing">
            <NowPlaying />
          </div>
        </section>

        <section className="home-stats">
          <StatBlock value={movies.length} label="movies" accentColor="var(--accent-movies)" />
          <StatBlock value={tv.length} label="tv shows" accentColor="var(--accent-tv)" />
          <StatBlock value={books.length} label="books" accentColor="var(--accent-books)" />
          <StatBlock value={albums.length} label="albums" accentColor="var(--accent-albums)" />
          <StatBlock value={vinyl.length} label="vinyl" accentColor="var(--accent-vinyl)" />
          <StatBlock value={workoutStats?.totalWorkouts ?? 0} label="workouts" accentColor="var(--accent-workouts)" />
        </section>

        <section className="home-wall">
          <h2 className="home-section-title">The collection wall</h2>
          <div className="home-wall-grid">
            {wallItems.map((item) => (
              <CoverTile key={item.key} title={item.title} imageUrl={item.imageUrl} id={item.key} />
            ))}
          </div>
        </section>

        <section className="home-quicklinks">
          {QUICK_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="home-quicklink">
              {link.label}
              <span aria-hidden="true">&rarr;</span>
            </Link>
          ))}
        </section>

        <section className="home-lower">
          <div className="home-latest">
            <h2 className="home-section-title">Latest takes</h2>
            {latestTakes.map((item) => (
              <div key={`${item.kind}-${item.id}`} className="home-latest-card">
                <div
                  className="home-latest-thumb"
                  style={!(item.thumbnail || tmdbPosterUrl(item.posterPath)) ? { background: gradientForKey(`${item.kind}-${item.id}`) } : undefined}
                >
                  {(item.thumbnail || tmdbPosterUrl(item.posterPath)) && (
                    <img src={item.thumbnail || tmdbPosterUrl(item.posterPath)} alt="" />
                  )}
                </div>
                <div className="home-latest-body">
                  <h3 className="home-latest-title">
                    {item.title}
                    <span className="stars">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={`star ${i < (item.rating || 0) ? 'filled' : 'empty'}`}>★</span>
                      ))}
                    </span>
                  </h3>
                  <p className="home-latest-snippet">{item.review_text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="home-rail">
            <div className="home-gym-panel">
              <p className="home-gym-panel-title">This year at the gym</p>
              <div className="home-gym-stats">
                <div>
                  <div className="home-gym-stat-value">{workoutStats?.totalWorkouts ?? 0}</div>
                  <div className="home-gym-stat-label">sessions</div>
                </div>
                <div>
                  <div className="home-gym-stat-value">
                    {bestSessionVolume ?? '—'}
                    {bestSessionVolume && <span className="home-gym-stat-unit">kg</span>}
                  </div>
                  <div className="home-gym-stat-label">best session vol</div>
                </div>
              </div>
              <div className="home-sparkline">
                {chronological.map((w, i) => (
                  <div
                    key={i}
                    className="home-sparkline-bar"
                    style={{ height: maxVolume ? `${Math.max(8, ((w.totalVolume || 0) / maxVolume) * 100)}%` : '8%' }}
                  />
                ))}
              </div>
            </div>

            <div className="home-shelf-panel">
              <p className="home-shelf-panel-title">On the shelf &middot; {vinyl.length} records</p>
              {shelfItems.map((record, i) => (
                <div key={record.id || i} className="home-shelf-item">
                  <span>{record.title}</span>
                  <span>{record.artist}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
