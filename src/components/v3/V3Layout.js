import Link from 'next/link';

export const V3_SECTIONS = [
  { label: 'Reviews', href: '/v3/reviews/movies' },
  { label: 'Vinyl', href: '/v3/vinyl' },
  { label: 'Workouts', href: '/v3/workouts' },
  { label: 'Listening', href: '/v3/listening' },
  { label: 'Projects', href: '/v3/projects' },
];

export default function V3Layout({ title = 'home', children }) {
  return (
    <div className="v3-shell">
      <div className="v3-utility-bar">
        <Link href="/v3" className="v3-wordmark">
          ryankrol.co.uk
        </Link>
        <span className="v3-title">{title}</span>
        <details className="v3-jump">
          <summary>Jump to ▾</summary>
          <div className="v3-jump-menu">
            {V3_SECTIONS.map((section) => (
              <Link key={section.href} href={section.href}>
                {section.label}
              </Link>
            ))}
          </div>
        </details>
      </div>

      <main className="v3-feed">{children}</main>

      <style jsx global>{`
        .v3-shell,
        .v3-shell * {
          box-sizing: border-box;
        }
      `}</style>

      <style jsx>{`
        .v3-shell {
          min-height: 100vh;
          background: #fdfdfb;
          color: #1a1a1a;
          font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;
          font-size: 14px;
        }

        .v3-utility-bar {
          position: sticky;
          top: 0;
          z-index: 10;
          height: 40px;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 14px;
          background: #fdfdfb;
          border-bottom: 1px solid #dcdcd6;
        }

        .v3-wordmark {
          color: #1a1a1a;
          text-decoration: none;
          font-weight: 600;
        }

        .v3-title {
          flex: 1;
          color: #767672;
        }

        .v3-jump {
          position: relative;
        }

        .v3-jump summary {
          cursor: pointer;
          list-style: none;
          color: #1a1a1a;
        }

        .v3-jump summary::-webkit-details-marker {
          display: none;
        }

        .v3-jump-menu {
          position: absolute;
          right: 0;
          top: 24px;
          display: flex;
          flex-direction: column;
          background: #fdfdfb;
          border: 1px solid #dcdcd6;
          min-width: 140px;
        }

        .v3-jump-menu :global(a) {
          padding: 8px 12px;
          color: #1a1a1a;
          text-decoration: none;
          border-bottom: 1px solid #ececea;
        }

        .v3-jump-menu :global(a:last-child) {
          border-bottom: none;
        }

        .v3-jump-menu :global(a:hover) {
          background: #f1f1ee;
        }

        .v3-feed {
          max-width: 720px;
          margin: 0 auto;
          padding: 0 14px;
        }
      `}</style>
    </div>
  );
}
