import { useState, useEffect } from 'react';
import Head from 'next/head';

const SAMPLE_AXES = [
  { key: 'weight', label: 'Weight' },
  { key: '1rm', label: 'Est. 1RM' },
  { key: 'volume', label: 'Set volume' },
];

function CompactTint({ label }) {
  return (
    <span
      className="pr-variant-compact"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--accent-workouts) 22%, transparent)',
        border: '1px solid currentColor',
        color: 'var(--accent-workouts)',
      }}
    >
      <span aria-hidden="true">🏅</span>
      <span> {label}</span>
    </span>
  );
}

function DotIndicator({ label }) {
  return (
    <span className="pr-variant-dot" style={{ color: 'var(--accent-workouts)' }}>
      <span className="pr-variant-dot-mark" style={{ backgroundColor: 'var(--accent-workouts)' }} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

function OutlineChip({ label }) {
  return (
    <span
      className="pr-variant-outline"
      style={{
        backgroundColor: 'var(--color-card)',
        color: 'var(--accent-workouts)',
        border: '1px solid var(--color-border-strong)',
      }}
    >
      {label}
    </span>
  );
}

const VARIANTS = [
  {
    name: 'Compact tint',
    description: 'Existing soft-tint + currentColor-border pill, shrunk padding/font, medal kept, no "PR" suffix.',
    Component: CompactTint,
  },
  {
    name: 'Dot indicator',
    description: 'Medal replaced by a small colored dot, no border, smaller font, label only.',
    Component: DotIndicator,
  },
  {
    name: 'Outline chip',
    description: "Badge's outline variant instead of soft tint, smaller pill, no emoji, label only.",
    Component: OutlineChip,
  },
];

export default function PrBadgeVariantsDevPage() {
  const [isLocalhost, setIsLocalhost] = useState(false);

  useEffect(() => {
    const hostname = window.location.hostname;
    setIsLocalhost(hostname === 'localhost' || hostname === '127.0.0.1');
  }, []);

  if (!isLocalhost) {
    return (
      <div className="container" style={{ maxWidth: '400px' }}>
        <h1>🔒 Localhost only</h1>
        <p>This dev tool is only available when running the app locally.</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>PR Badge Variants - ryankrol.co.uk</title>
      </Head>
      <div className="container" style={{ maxWidth: '720px' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>PR badge variants</h1>
        <p style={{ marginBottom: '2rem', color: 'var(--color-text-muted)' }}>
          Side-by-side comparison of smaller/lighter restyle options for the personal-best pill,
          for review only — none of this is wired into the real workouts pages.
        </p>

        {VARIANTS.map(({ name, description, Component }) => (
          <section key={name} style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ marginBottom: '0.25rem' }}>{name}</h2>
            <p style={{ marginBottom: '0.75rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
              {description}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {SAMPLE_AXES.map((axis) => (
                <Component key={axis.key} label={axis.label} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
