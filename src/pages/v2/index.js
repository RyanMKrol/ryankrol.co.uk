import Link from 'next/link';
import V2Layout from '../../components/v2/V2Layout';

const CARDS = [
  {
    label: 'Reviews',
    href: '/v2/reviews/movies',
    blurb:
      'Movies, TV, books, albums, and perfumes — everything watched, read, listened to, or worn, rated and written up.',
  },
  {
    label: 'Vinyl',
    href: '/v2/vinyl',
    blurb: 'The record shelf, catalogued title by title, artist by artist.',
  },
  {
    label: 'Workouts',
    href: '/v2/workouts',
    blurb: 'Training history pulled from Hevy — volume, estimated 1RMs, and progress over time.',
  },
  {
    label: 'Listening',
    href: '/v2/listening',
    blurb: 'What has actually been on repeat, straight from Last.fm.',
  },
  {
    label: 'Projects',
    href: '/v2/projects',
    blurb: 'Whatever is currently open in an editor somewhere, pulled live from GitHub.',
  },
];

export default function V2Home() {
  const [featured, ...rest] = CARDS;

  return (
    <V2Layout>
      <Link href={featured.href} className="v2-hero">
        <span className="v2-hero-kicker">Featured section</span>
        <h1 className="v2-hero-title">{featured.label}</h1>
        <p className="v2-hero-blurb">{featured.blurb}</p>
      </Link>

      <div className="v2-masonry">
        {rest.map((card, i) => (
          <Link key={card.href} href={card.href} className="v2-card" data-tall={i % 2 === 0}>
            <h2 className="v2-card-title">{card.label}</h2>
            <p className="v2-card-blurb">{card.blurb}</p>
          </Link>
        ))}
      </div>

      <style jsx>{`
        .v2-hero {
          display: block;
          text-decoration: none;
          color: inherit;
          border: 1px solid #d8d3c4;
          background: #fff;
          padding: 40px;
          margin-bottom: 32px;
        }

        .v2-hero-kicker {
          font-variant: small-caps;
          letter-spacing: 0.08em;
          font-size: 0.8rem;
          color: #8a8474;
        }

        .v2-hero-title {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 3.5rem;
          margin: 8px 0 12px;
        }

        .v2-hero-blurb {
          font-size: 1.1rem;
          line-height: 1.6;
          max-width: 60ch;
          color: #4b473f;
          margin: 0;
        }

        .v2-masonry {
          columns: 2;
          column-gap: 20px;
        }

        @media (max-width: 700px) {
          .v2-masonry {
            columns: 1;
          }
          .v2-hero-title {
            font-size: 2.25rem;
          }
        }

        .v2-card {
          display: block;
          break-inside: avoid;
          margin-bottom: 20px;
          text-decoration: none;
          color: inherit;
          border: 1px solid #d8d3c4;
          background: #fff;
          padding: 24px;
        }

        .v2-card[data-tall='true'] {
          padding-bottom: 48px;
        }

        .v2-card-title {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 1.6rem;
          margin: 0 0 8px;
        }

        .v2-card-blurb {
          font-size: 0.95rem;
          line-height: 1.55;
          color: #4b473f;
          margin: 0;
        }
      `}</style>
    </V2Layout>
  );
}
