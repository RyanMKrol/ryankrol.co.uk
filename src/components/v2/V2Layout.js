import Link from 'next/link';
import NowPlaying from '../NowPlaying';

export const V2_SECTIONS = [
  { label: 'Movies', href: '/v2/reviews/movies' },
  { label: 'TV', href: '/v2/reviews/tv' },
  { label: 'Books', href: '/v2/reviews/books' },
  { label: 'Albums', href: '/v2/reviews/albums' },
  { label: 'Perfumes', href: '/v2/reviews/perfumes' },
  { label: 'Vinyl', href: '/v2/vinyl' },
  { label: 'Workouts', href: '/v2/workouts' },
  { label: 'Listening', href: '/v2/listening' },
  { label: 'Projects', href: '/v2/projects' },
];

export default function V2Layout({ children }) {
  return (
    <div className="v2-shell">
      <header className="v2-masthead">
        <Link href="/v2" className="v2-wordmark">
          ryankrol
        </Link>
        <nav className="v2-section-row" aria-label="sections">
          {V2_SECTIONS.map((section, i) => (
            <span key={section.href} className="v2-section-item">
              {i > 0 && <span className="v2-rule" aria-hidden="true">·</span>}
              <Link href={section.href}>{section.label}</Link>
            </span>
          ))}
        </nav>
      </header>

      <main className="v2-content">{children}</main>

      <footer className="v2-colophon">
        <div className="v2-colophon-col">
          <div className="v2-colophon-title">About</div>
          <p>ryankrol.co.uk — reviews, records, and reps, written up.</p>
        </div>
        <div className="v2-colophon-col">
          <div className="v2-colophon-title">Sections</div>
          <div className="v2-colophon-links">
            {V2_SECTIONS.map((section) => (
              <Link key={section.href} href={section.href}>
                {section.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="v2-colophon-col">
          <div className="v2-colophon-title">Now Playing</div>
          <NowPlaying />
        </div>
      </footer>

      <style jsx global>{`
        .v2-shell,
        .v2-shell * {
          box-sizing: border-box;
        }
      `}</style>

      <style jsx>{`
        .v2-shell {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #faf8f3;
          color: #211f1c;
          font-family: 'Helvetica Neue', Arial, sans-serif;
        }

        .v2-masthead {
          text-align: center;
          padding: 28px 16px 14px;
          border-bottom: 3px double #211f1c;
        }

        .v2-wordmark {
          display: inline-block;
          font-family: Georgia, 'Times New Roman', serif;
          font-weight: 700;
          font-size: 2.75rem;
          letter-spacing: 0.02em;
          color: #211f1c;
          text-decoration: none;
        }

        .v2-section-row {
          margin-top: 12px;
          display: flex;
          justify-content: center;
          gap: 6px;
          overflow-x: auto;
          white-space: nowrap;
          padding: 4px 8px;
          -webkit-overflow-scrolling: touch;
        }

        .v2-section-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          font-variant: small-caps;
          letter-spacing: 0.08em;
        }

        .v2-section-item :global(a) {
          color: #4b473f;
          text-decoration: none;
        }

        .v2-section-item :global(a:hover) {
          color: #211f1c;
          text-decoration: underline;
        }

        .v2-rule {
          color: #b8b2a4;
        }

        .v2-content {
          flex: 1;
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 32px 20px 64px;
        }

        .v2-colophon {
          border-top: 3px double #211f1c;
          background: #211f1c;
          color: #d8d3c4;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          padding: 28px 20px;
        }

        @media (max-width: 700px) {
          .v2-colophon {
            grid-template-columns: 1fr;
          }
          .v2-wordmark {
            font-size: 2rem;
          }
        }

        .v2-colophon-title {
          font-variant: small-caps;
          letter-spacing: 0.08em;
          font-weight: 700;
          margin-bottom: 8px;
          color: #f2efe6;
        }

        .v2-colophon-links {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .v2-colophon-links :global(a) {
          color: #d8d3c4;
          text-decoration: none;
          font-size: 0.9rem;
        }

        .v2-colophon-links :global(a:hover) {
          text-decoration: underline;
        }

        .v2-colophon-col p {
          font-size: 0.9rem;
          line-height: 1.5;
          margin: 0;
        }
      `}</style>
    </div>
  );
}
