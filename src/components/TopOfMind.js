import { useState, useRef, useEffect, useCallback } from 'react';
import Markdown from './Markdown';

/**
 * Home-page "Top of mind" panel. The collapsed body is clamped to a FIXED height
 * (a known number of lines — see `--tom-clamp-height` in globals.css) that exactly
 * matches `TopOfMindSkeleton`, so the skeleton → loaded swap causes no layout shift
 * regardless of the note's length. A "See more" toggle reveals the full note when
 * (and only when) the clamped body actually overflows; the toggle row reserves its
 * height whether or not the button is present, so short notes don't shift up either.
 */
export default function TopOfMind({ text }) {
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  const bodyRef = useRef(null);

  // Measure only while collapsed: compare the clamped box's rendered height
  // (clientHeight) against its full content height (scrollHeight). Once expanded
  // we keep the last known `overflowing` so the toggle stays as "See less".
  const measure = useCallback(() => {
    const el = bodyRef.current;
    if (!el || expanded) return;
    setOverflowing(el.scrollHeight > el.clientHeight + 1);
  }, [expanded]);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure, text]);

  const clamped = !expanded;

  return (
    <section className="home-top-of-mind-panel">
      <div className="home-top-of-mind-panel-inner">
        <span className="home-top-of-mind-panel-label">Top of mind</span>
        <div
          ref={bodyRef}
          className={
            `home-top-of-mind-body ${clamped ? 'home-top-of-mind-body-clamped' : 'home-top-of-mind-body-expanded'}` +
            (clamped && overflowing ? ' home-top-of-mind-body-faded' : '')
          }
        >
          <Markdown>{text}</Markdown>
        </div>
        <div className="home-top-of-mind-toggle-row">
          {overflowing && (
            <button
              type="button"
              className="home-top-of-mind-toggle"
              onClick={() => setExpanded((e) => !e)}
              aria-expanded={expanded}
            >
              {expanded ? 'See less' : 'See more'}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
