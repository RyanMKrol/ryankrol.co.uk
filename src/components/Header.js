import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Pill from './Pill';
import NowPlaying from './NowPlaying';

const NAV_SECTIONS = [
  { key: 'books', label: 'books', href: '/reviews/books', prefixes: ['/reviews/books'] },
  { key: 'movies', label: 'movies', href: '/reviews/movies', prefixes: ['/reviews/movies'] },
  { key: 'tv', label: 'tv', href: '/reviews/tv', prefixes: ['/reviews/tv'] },
  { key: 'albums', label: 'albums', href: '/reviews/albums', prefixes: ['/reviews/albums'] },
  { key: 'perfumes', label: 'perfumes', href: '/reviews/perfumes', prefixes: ['/reviews/perfumes'] },
  { key: 'vinyl', label: 'vinyl', href: '/vinyl', prefixes: ['/vinyl'] },
  { key: 'workouts', label: 'workouts', href: '/workouts', prefixes: ['/workouts', '/exercises'] },
  { key: 'listening', label: 'listening', href: '/listening', prefixes: ['/listening'] },
  { key: 'projects', label: 'projects', href: '/projects', prefixes: ['/projects'] },
];

function getActiveSection(pathname) {
  const match = NAV_SECTIONS.find((section) =>
    section.prefixes.some((prefix) => pathname.startsWith(prefix))
  );
  return match?.key;
}

export default function Header() {
  const router = useRouter();
  const activeSection = getActiveSection(router.pathname);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="header-content">
        <Link href="/" className="wordmark">
          <span className="wordmark-avatar" aria-hidden="true">r</span>
          <span className="wordmark-text">ryan krol</span>
        </Link>

        <nav className="collection-nav-pills">
          {NAV_SECTIONS.map((section) => (
            <Link key={section.key} href={section.href}>
              <Pill
                active={activeSection === section.key}
                accentColor={`var(--accent-${section.key})`}
              >
                {section.label}
              </Pill>
            </Link>
          ))}
        </nav>

        <div className="header-right">
          <div className="header-now-playing">
            <NowPlaying />
          </div>
          <button
            type="button"
            className="nav-menu-toggle"
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            ☰
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="nav-mobile-menu">
          {NAV_SECTIONS.map((section) => (
            <Link
              key={section.key}
              href={section.href}
              className={`nav-mobile-link${activeSection === section.key ? ' active' : ''}`}
              style={activeSection === section.key ? { color: `var(--accent-${section.key})` } : undefined}
              onClick={() => setMenuOpen(false)}
            >
              {section.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
