import Link from 'next/link';

export const V1_SECTIONS = [
  { label: 'Movies', href: '/v1/reviews/movies', count: 0 },
  { label: 'TV', href: '/v1/reviews/tv', count: 0 },
  { label: 'Books', href: '/v1/reviews/books', count: 0 },
  { label: 'Albums', href: '/v1/reviews/albums', count: 0 },
  { label: 'Vinyl', href: '/v1/vinyl', count: 0 },
  { label: 'Workouts', href: '/v1/workouts', count: 0 },
  { label: 'Listening', href: '/v1/listening', count: 0 },
  { label: 'Projects', href: '/v1/projects', count: 0 },
];

export default function V1Layout({ breadcrumb = '~', children }) {
  return (
    <div className="v1-shell">
      <aside className="v1-sidebar">
        <div className="v1-sidebar-title">ryankrol.co.uk</div>
        <nav className="v1-sidebar-nav">
          {V1_SECTIONS.map((section) => (
            <Link key={section.href} href={section.href} className="v1-sidebar-row">
              <span>{section.label}</span>
              <span className="v1-sidebar-count">{section.count}</span>
            </Link>
          ))}
        </nav>
        <div className="v1-sidebar-status">● online · cache: 12m ago</div>
      </aside>

      <div className="v1-main">
        <header className="v1-header">
          <span className="v1-breadcrumb">{breadcrumb}</span>
          <input className="v1-search" type="search" placeholder="search…" aria-label="search" />
        </header>
        <main className="v1-content">{children}</main>
      </div>

      <style jsx global>{`
        .v1-shell,
        .v1-shell * {
          box-sizing: border-box;
        }
      `}</style>

      <style jsx>{`
        .v1-shell {
          display: flex;
          min-height: 100vh;
          background: #0d0f10;
          color: #d8dcdd;
          font-family: 'JetBrains Mono', monospace;
          font-size: 14px;
        }

        .v1-sidebar {
          width: 220px;
          flex: 0 0 220px;
          background: #131618;
          border-right: 1px solid #24292b;
          display: flex;
          flex-direction: column;
          position: sticky;
          top: 0;
          height: 100vh;
        }

        @media (max-width: 900px) {
          .v1-sidebar {
            width: 56px;
            flex-basis: 56px;
          }
          .v1-sidebar-row span:first-child {
            display: none;
          }
          .v1-sidebar-title {
            display: none;
          }
          .v1-sidebar-count {
            display: none;
          }
        }

        .v1-sidebar-title {
          padding: 14px 12px;
          font-weight: 700;
          color: #6ee7b7;
          border-bottom: 1px solid #24292b;
        }

        .v1-sidebar-nav {
          flex: 1;
          overflow-y: auto;
        }

        .v1-sidebar-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          text-decoration: none;
          color: #d8dcdd;
          border-bottom: 1px solid #1c2022;
        }

        .v1-sidebar-row:hover {
          background: #1c2022;
        }

        .v1-sidebar-count {
          color: #6b7280;
          font-variant-numeric: tabular-nums;
        }

        .v1-sidebar-status {
          padding: 8px 12px;
          font-size: 12px;
          color: #6b7280;
          border-top: 1px solid #24292b;
        }

        .v1-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .v1-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 16px;
          border-bottom: 1px solid #24292b;
        }

        .v1-breadcrumb {
          color: #6b7280;
        }

        .v1-search {
          background: #131618;
          border: 1px solid #24292b;
          color: #d8dcdd;
          font-family: inherit;
          font-size: 13px;
          padding: 4px 8px;
          width: 220px;
        }

        .v1-content {
          flex: 1;
          padding: 16px;
          overflow-x: auto;
        }
      `}</style>
    </div>
  );
}
