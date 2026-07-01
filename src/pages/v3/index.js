import V3Layout, { V3_SECTIONS } from '../../components/v3/V3Layout';
import V3TimelineEntry from '../../components/v3/V3TimelineEntry';

const MOCK_TIMELINE = [
  { date: '28-06-2026', type: 'movie', summary: 'Title — rating (★★★★☆)', detail: 'Full review text goes here once wired up.' },
  { date: '24-06-2026', type: 'vinyl', summary: 'Artist — Album', detail: 'Added to the vinyl collection.' },
  { date: '20-06-2026', type: 'workout', summary: 'Push day — 8 exercises', detail: 'Workout detail goes here.' },
  { date: '15-06-2026', type: 'album', summary: 'Title — rating (★★★☆☆)', detail: 'Full review text goes here once wired up.' },
  { date: '09-06-2026', type: 'tv', summary: 'Title — rating (★★★★★)', detail: 'Full review text goes here once wired up.' },
];

export default function V3Home() {
  return (
    <V3Layout title="home">
      <p className="v3-sort">sorted by date, newest first — change</p>

      {V3_SECTIONS.map((section) => (
        <a key={section.href} href={section.href} className="v3-section-link">
          → {section.label}
        </a>
      ))}

      {MOCK_TIMELINE.map((entry) => (
        <V3TimelineEntry key={`${entry.date}-${entry.summary}`} date={entry.date} type={entry.type} summary={entry.summary}>
          {entry.detail}
        </V3TimelineEntry>
      ))}

      <div className="v3-end">— end of feed —</div>

      <style jsx>{`
        .v3-sort {
          color: #767672;
          margin: 14px 0;
        }

        .v3-section-link {
          display: inline-block;
          margin: 0 12px 12px 0;
          color: #1a1a1a;
        }

        .v3-end {
          padding: 10px 0;
          color: #767672;
          text-align: center;
        }
      `}</style>
    </V3Layout>
  );
}
