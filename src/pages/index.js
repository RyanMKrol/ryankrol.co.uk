import { useState, useEffect, useMemo } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import NowPlaying from '../components/NowPlaying'
import StatBlock from '../components/StatBlock'
import CoverTile, { assignGradients } from '../components/CoverTile'
import TopOfMind from '../components/TopOfMind'
import { StatBlockSkeleton, TileGridSkeleton, CardRowSkeleton, GymPanelStatsSkeleton, ListRowSkeleton, TopOfMindSkeleton } from '../components/HomeSkeleton'
import { tmdbPosterUrl } from '../lib/tmdb'
import { formatReviewDate } from '../lib/dateFormat'
import { isExpired } from '../lib/topOfMind'

const WALL_KIND_HREF = {
  movie: '/reviews/movies',
  tv: '/reviews/tv',
  book: '/reviews/books',
  album: '/reviews/albums',
  vinyl: '/vinyl',
}

function parseUkDate(dateString) {
  if (!dateString) return null
  const [day, month, year] = dateString.split('-').map(Number)
  if (!day || !month || !year) return null
  return new Date(year, month - 1, day)
}

function sortByDateDesc(items) {
  return [...items].sort((a, b) => (parseUkDate(b.date) ?? 0) - (parseUkDate(a.date) ?? 0))
}

function pickRandomSample(items, count) {
  const pool = [...items]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, count)
}

export default function Home() {
  const [movies, setMovies] = useState([])
  const [tv, setTv] = useState([])
  const [books, setBooks] = useState([])
  const [albums, setAlbums] = useState([])
  const [vinyl, setVinyl] = useState([])
  const [workoutStats, setWorkoutStats] = useState(null)
  const [shelfItems, setShelfItems] = useState([])
  const [hotTakes, setHotTakes] = useState([])
  const [topOfMind, setTopOfMind] = useState(null)

  const [moviesLoading, setMoviesLoading] = useState(true)
  const [tvLoading, setTvLoading] = useState(true)
  const [booksLoading, setBooksLoading] = useState(true)
  const [albumsLoading, setAlbumsLoading] = useState(true)
  const [vinylLoading, setVinylLoading] = useState(true)
  const [workoutStatsLoading, setWorkoutStatsLoading] = useState(true)
  const [hotTakesLoading, setHotTakesLoading] = useState(true)
  const [topOfMindLoading, setTopOfMindLoading] = useState(true)

  useEffect(() => {
    async function fetchJson(url) {
      const response = await fetch(url)
      if (!response.ok) return null
      return response.json()
    }

    fetchJson('/api/reviews/movies').then((data) => { setMovies(data || []); setMoviesLoading(false) })
    fetchJson('/api/reviews/tv').then((data) => { setTv(data || []); setTvLoading(false) })
    fetchJson('/api/reviews/books').then((data) => { setBooks(data || []); setBooksLoading(false) })
    fetchJson('/api/reviews/albums').then((data) => { setAlbums(data || []); setAlbumsLoading(false) })
    fetchJson('/api/vinyl').then((data) => {
      const vinylData = data || []
      setVinyl(vinylData)
      setShelfItems(pickRandomSample(vinylData, 5))
      setVinylLoading(false)
    })
    fetchJson('/api/workouts/stats').then((data) => { setWorkoutStats(data); setWorkoutStatsLoading(false) })
    fetchJson('/api/hot-takes').then((data) => { setHotTakes(data || []); setHotTakesLoading(false) })
    fetchJson('/api/top-of-mind').then((data) => { setTopOfMind(data && data.text ? data : null); setTopOfMindLoading(false) })
  }, [])

  const showTopOfMind = !topOfMindLoading && !!topOfMind && !isExpired(topOfMind.updatedAt)

  const wallLoading = moviesLoading || tvLoading || booksLoading || albumsLoading || vinylLoading
  const latestTakesLoading = moviesLoading || tvLoading || booksLoading || albumsLoading

  const totalRated = movies.length + tv.length + books.length + albums.length + vinyl.length + (workoutStats?.totalWorkouts || 0)

  const wallItems = useMemo(() => {
    const wallCandidates = [
      movies.map((m) => ({ key: `movie-${m.id}`, title: m.title, imageUrl: tmdbPosterUrl(m.posterPath), kind: 'movie', href: WALL_KIND_HREF.movie })),
      tv.map((t) => ({ key: `tv-${t.id}`, title: t.title, imageUrl: tmdbPosterUrl(t.posterPath), kind: 'tv', href: WALL_KIND_HREF.tv })),
      books.map((b) => ({ key: `book-${b.id}`, title: b.title, imageUrl: b.coverUrl || null, kind: 'book', href: WALL_KIND_HREF.book, subtitle: b.author || null })),
      albums.map((a) => ({ key: `album-${a.id}`, title: a.title, imageUrl: a.thumbnail || null, kind: 'album', href: WALL_KIND_HREF.album, subtitle: a.artist || null })),
      vinyl.map((v) => ({ key: `vinyl-${v.id}`, title: v.title, imageUrl: v.thumbnail || null, kind: 'vinyl', href: WALL_KIND_HREF.vinyl, subtitle: v.artist || null })),
    ]

    const sampled = pickRandomSample(
      wallCandidates.flatMap((pool) => pickRandomSample(pool, 4)),
      18
    )

    const gradientKeys = sampled.filter((item) => !item.imageUrl).map((item) => item.key)
    const gradients = assignGradients(gradientKeys)
    let gradientIndex = 0
    return sampled.map((item) => (
      item.imageUrl ? item : { ...item, gradient: gradients[gradientIndex++] }
    ))
  }, [movies, tv, books, albums, vinyl])

  const latestTakes = useMemo(() => {
    const items = sortByDateDesc([
      ...movies.map((m) => ({ ...m, kind: 'movie' })),
      ...tv.map((t) => ({ ...t, kind: 'tv' })),
      ...books.map((b) => ({ ...b, kind: 'book' })),
      ...albums.map((a) => ({ ...a, kind: 'album', review_text: a.highlights })),
    ]).slice(0, 3)

    const gradientKeys = items
      .filter((item) => !(item.thumbnail || tmdbPosterUrl(item.posterPath)))
      .map((item) => `${item.kind}-${item.id}`)
    const gradients = assignGradients(gradientKeys)
    let gradientIndex = 0
    return items.map((item) => (
      (item.thumbnail || tmdbPosterUrl(item.posterPath))
        ? item
        : { ...item, gradient: gradients[gradientIndex++] }
    ))
  }, [movies, tv, books, albums])

  const latestHotTakes = hotTakes.slice(0, 3)

  const monthlyVolume = workoutStats?.monthlyVolume || []
  const maxMonthlyVolume = monthlyVolume.reduce((max, m) => Math.max(max, m.totalVolume || 0), 0)
  const bestSessionVolume = workoutStats?.bestSessionVolume || null
  const totalVolume = workoutStats?.totalVolume ?? null

  const handleShelfRefresh = () => {
    setShelfItems(pickRandomSample(vinyl, 5))
  }

  return (
    <>
      <Head>
        <title>ryankrol.co.uk</title>
      </Head>

      <div className="container home-container">

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

        {topOfMindLoading ? (
          <TopOfMindSkeleton />
        ) : showTopOfMind ? (
          <TopOfMind text={topOfMind.text} />
        ) : null}

        <section className="home-stats">
          {moviesLoading ? <StatBlockSkeleton /> : <StatBlock value={movies.length} label="movies" accentColor="var(--accent-movies)" />}
          {tvLoading ? <StatBlockSkeleton /> : <StatBlock value={tv.length} label="tv shows" accentColor="var(--accent-tv)" />}
          {booksLoading ? <StatBlockSkeleton /> : <StatBlock value={books.length} label="books" accentColor="var(--accent-books)" />}
          {albumsLoading ? <StatBlockSkeleton /> : <StatBlock value={albums.length} label="albums" accentColor="var(--accent-albums)" />}
          {vinylLoading ? <StatBlockSkeleton /> : <StatBlock value={vinyl.length} label="vinyl" accentColor="var(--accent-vinyl)" />}
          {workoutStatsLoading ? <StatBlockSkeleton /> : <StatBlock value={workoutStats?.totalWorkouts ?? 0} label="workouts" accentColor="var(--accent-workouts)" />}
        </section>

        <section className="home-wall">
          <h2 className="home-section-title">A slice of everything</h2>
          {wallLoading ? (
            <TileGridSkeleton count={18} />
          ) : (
            <div className="home-wall-grid">
              {wallItems.map((item) => (
                <Link key={item.key} href={{ pathname: item.href, query: { q: item.title } }} className="home-wall-tile-link">
                  <CoverTile title={item.title} imageUrl={item.imageUrl} id={item.key} subtitle={item.subtitle} gradient={item.gradient} />
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="home-lower">
          <div className="home-latest">
            <h2 className="home-section-title">Latest takes</h2>
            {latestTakesLoading && <CardRowSkeleton count={3} />}
            {!latestTakesLoading && latestTakes.map((item) => (
              <div key={`${item.kind}-${item.id}`} className="home-latest-card">
                <div
                  className="home-latest-thumb"
                  style={!(item.thumbnail || tmdbPosterUrl(item.posterPath)) ? { background: item.gradient } : undefined}
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
              <Link href="/workouts" className="home-gym-panel-title home-gym-panel-link">This year at the gym</Link>
              {workoutStatsLoading ? (
                <GymPanelStatsSkeleton />
              ) : (
                <>
                  <div className="home-gym-stats">
                    <div>
                      <div className="home-gym-stat-value">{(workoutStats?.totalWorkouts ?? 0).toLocaleString()}</div>
                      <div className="home-gym-stat-label">sessions</div>
                    </div>
                    <div>
                      <div className="home-gym-stat-value">
                        {totalVolume?.toLocaleString() ?? '—'}
                        {totalVolume && <span className="home-gym-stat-unit">kg</span>}
                      </div>
                      <div className="home-gym-stat-label">total volume</div>
                    </div>
                    <div>
                      <div className="home-gym-stat-value">
                        {bestSessionVolume?.toLocaleString() ?? '—'}
                        {bestSessionVolume && <span className="home-gym-stat-unit">kg</span>}
                      </div>
                      <div className="home-gym-stat-label">best session vol</div>
                    </div>
                  </div>
                  <div className="home-sparkline">
                    {monthlyVolume.map((m) => (
                      <div key={m.month} className="home-sparkline-bar-wrap">
                        <span className="home-sparkline-tooltip">{m.label} &middot; {m.totalVolume}kg</span>
                        <div
                          className="home-sparkline-bar"
                          style={{ height: maxMonthlyVolume ? `${Math.max(8, (m.totalVolume / maxMonthlyVolume) * 100)}%` : '8%' }}
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="home-shelf-panel">
              <div className="home-shelf-panel-header">
                <Link href="/vinyl" className="home-shelf-panel-title home-shelf-panel-link">
                  On the shelf {!vinylLoading && <>&middot; {vinyl.length} records</>}
                </Link>
                <button
                  type="button"
                  className="home-shelf-refresh"
                  onClick={handleShelfRefresh}
                  aria-label="Skim through my collection — show a different random 5 records"
                  disabled={vinylLoading}
                >
                  &#8635; Skim the shelf
                </button>
              </div>
              {vinylLoading && <ListRowSkeleton count={5} />}
              {!vinylLoading && shelfItems.map((record, i) => (
                <div key={record.id || i} className="home-shelf-item">
                  <span>{record.title}</span>
                  <span>{record.artist}</span>
                </div>
              ))}
            </div>

            <div className="home-hot-takes-panel">
              <div className="home-hot-takes-panel-header">
                <Link href="/hot-takes" className="home-hot-takes-panel-title home-hot-takes-panel-link">
                  Hot takes
                </Link>
              </div>
              {hotTakesLoading && <ListRowSkeleton count={3} />}
              {!hotTakesLoading && latestHotTakes.length === 0 && (
                <p className="home-hot-takes-empty">No hot takes yet.</p>
              )}
              {!hotTakesLoading && latestHotTakes.map((take) => (
                <div key={take.id} className="home-hot-takes-item">
                  <span className="home-hot-takes-text">{take.text}</span>
                  <span className="home-hot-takes-date">{formatReviewDate(take.date)}</span>
                </div>
              ))}
              {!hotTakesLoading && latestHotTakes.length > 0 && (
                <Link href="/hot-takes" className="home-hot-takes-viewall">View all &rarr;</Link>
              )}
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
