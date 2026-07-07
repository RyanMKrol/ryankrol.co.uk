import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Pill from './Pill';
import NowPlaying from './NowPlaying';
import { shouldShowScrollFade } from '../lib/scrollFade';

const NAV_SECTIONS = [
  { key: 'books', label: 'books', href: '/reviews/books', prefixes: ['/reviews/books'] },
  { key: 'movies', label: 'movies', href: '/reviews/movies', prefixes: ['/reviews/movies'] },
  { key: 'tv', label: 'tv', href: '/reviews/tv', prefixes: ['/reviews/tv'] },
  { key: 'albums', label: 'albums', href: '/reviews/albums', prefixes: ['/reviews/albums'] },
  { key: 'perfumes', label: 'perfumes', href: '/reviews/perfumes', prefixes: ['/reviews/perfumes'] },
  { key: 'vinyl', label: 'vinyl', href: '/vinyl', prefixes: ['/vinyl'] },
  { key: 'workouts', label: 'workouts', href: '/workouts', prefixes: ['/workouts', '/exercises', '/programmes'] },
  { key: 'listening', label: 'listening', href: '/listening', prefixes: ['/listening'] },
  { key: 'projects', label: 'projects', href: '/projects', prefixes: ['/projects'] },
  { key: 'hot-takes', label: 'hot takes', href: '/hot-takes', prefixes: ['/hot-takes'] },
];

function getActiveSection(pathname) {
  const match = NAV_SECTIONS.find((section) =>
    section.prefixes.some((prefix) => pathname.startsWith(prefix))
  );
  return match?.key;
}

// Below this much total pointer movement, a mousedown->mouseup over a nav pill still counts as a
// plain click (navigates); above it, it was a drag-to-scroll gesture and the click is suppressed.
const DRAG_CLICK_THRESHOLD_PX = 5;

export default function Header() {
  const router = useRouter();
  const activeSection = getActiveSection(router.pathname);
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef(null);
  const [showNavFade, setShowNavFade] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ isDragging: false, startX: 0, startScrollLeft: 0, totalMovement: 0 });
  const suppressClickRef = useRef(false);
  const dragHandlersRef = useRef({ move: null, up: null });

  useEffect(() => {
    return () => {
      if (dragHandlersRef.current.move) window.removeEventListener('mousemove', dragHandlersRef.current.move);
      if (dragHandlersRef.current.up) window.removeEventListener('mouseup', dragHandlersRef.current.up);
    };
  }, []);

  const handleNavMouseDown = (e) => {
    const nav = navRef.current;
    if (!nav) return;
    e.preventDefault();

    const drag = dragRef.current;
    drag.isDragging = true;
    drag.startX = e.clientX;
    drag.startScrollLeft = nav.scrollLeft;
    drag.totalMovement = 0;
    setIsDragging(true);

    const handleMouseMove = (moveEvent) => {
      if (!dragRef.current.isDragging) return;
      const deltaX = moveEvent.clientX - dragRef.current.startX;
      nav.scrollLeft = dragRef.current.startScrollLeft - deltaX;
      dragRef.current.totalMovement = Math.max(dragRef.current.totalMovement, Math.abs(deltaX));
    };

    const handleMouseUp = () => {
      dragRef.current.isDragging = false;
      setIsDragging(false);
      if (dragRef.current.totalMovement > DRAG_CLICK_THRESHOLD_PX) {
        suppressClickRef.current = true;
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      dragHandlersRef.current = { move: null, up: null };
    };

    dragHandlersRef.current = { move: handleMouseMove, up: handleMouseUp };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleNavClickCapture = (e) => {
    if (suppressClickRef.current) {
      e.preventDefault();
      e.stopPropagation();
      suppressClickRef.current = false;
    }
  };

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return undefined;

    const updateFade = () => {
      setShowNavFade(
        shouldShowScrollFade({
          scrollWidth: nav.scrollWidth,
          clientWidth: nav.clientWidth,
          scrollLeft: nav.scrollLeft,
        })
      );
    };

    updateFade();
    nav.addEventListener('scroll', updateFade);
    window.addEventListener('resize', updateFade);

    const resizeObserver = new ResizeObserver(updateFade);
    resizeObserver.observe(nav);

    return () => {
      nav.removeEventListener('scroll', updateFade);
      window.removeEventListener('resize', updateFade);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <header className="site-header">
      <div className="header-content">
        <Link href="/" className="wordmark">
          <span className="wordmark-avatar" aria-hidden="true">r</span>
          <span className="wordmark-text">ryan krol</span>
        </Link>

        <nav
          ref={navRef}
          className={`collection-nav-pills${showNavFade ? ' has-scroll-fade' : ''}${isDragging ? ' is-dragging' : ''}`}
          onMouseDown={handleNavMouseDown}
          onClickCapture={handleNavClickCapture}
        >
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
