import ReviewCard from '../../components/ReviewCard';
import MasonryColumns from '../../components/MasonryColumns';
import useResponsiveColumnCount from '../../hooks/useResponsiveColumnCount';

// Workshop-only preview (T373) — NOT linked from the public nav. Renders all 5 candidate
// spine-cover book-card designs stacked against two example books chosen to exercise the two
// behaviours the winner must get right: a long body that truncates into a "Read more" expand
// state, and a Markdown ORDERED list rendering with a proper left indent.
const ULTRA_PROCESSED_PEOPLE = {
  id: 'dev-ultra-processed-people',
  title: 'Ultra-Processed People',
  author: 'Chris van Tulleken',
  rating: 4,
  review_text:
    'A genuinely unsettling read that reframes a huge share of the modern food supply as something '
    + 'closer to an industrial product than a meal. The personal experiment chapters land hardest — '
    + 'watching the author track his own appetite and mood on an all-UPF diet makes the epidemiology '
    + 'feel real rather than abstract. Dense in places, and it occasionally repeats its central '
    + 'argument more than it needs to, but the core claim (that these products are engineered to '
    + 'be eaten quickly, in large quantities, and forgettably) is the kind of thing you cannot unread '
    + 'once you have read it.',
  date: '12-03-2026',
  firstPublishedYear: 2023,
  pageCount: 384,
};

const HORUS_HERESY_GARRO = {
  id: 'dev-horus-heresy-garro',
  title: 'The Horus Heresy 42: Garro',
  author: 'James Swallow',
  rating: 4,
  review_text:
    'A tighter, more focused entry than most of the series. What works:\n\n'
    + '1. Garro himself — one of the few characters in the whole saga who reads as an actual person\n'
    + '2. The pacing, which never sags across the collected novellas\n'
    + '3. The ending, which earns its weight instead of just gesturing at scale',
  date: '04-06-2025',
  firstPublishedYear: 2013,
  pageCount: 416,
};

const EXAMPLE_BOOKS = [ULTRA_PROCESSED_PEOPLE, HORUS_HERESY_GARRO];

const VARIANTS = [
  { id: 1, name: 'Ledger', description: 'Mono rating line above the title; tight uppercase meta.' },
  { id: 2, name: 'Badge', description: 'Circular rating badge floats over the cover-tile corner.' },
  { id: 3, name: 'Ribbon', description: 'Accent left rule; stars sit inline with the title.' },
  { id: 4, name: 'Mono Label', description: 'label:value metadata pairs, separated by a rule.' },
  { id: 5, name: 'Serif Feature', description: 'Larger serif title; stars demoted below the meta line.' },
];

export default function BookCardDesigns() {
  // Mirror the real books page (src/pages/reviews/books/index.js): two columns on desktop,
  // collapsing to one below 700px, so each design is evaluated in the same layout it ships into.
  const columnCount = useResponsiveColumnCount(2, 700);

  return (
    <div className="review-container">
      <h1 className="page-title">book card design workshop</h1>
      <p className="collection-review-meta">
        Internal preview only (not linked from nav) — five candidate spine-cover designs, each
        rendered against a long body (read-more) and a Markdown ordered-list body, in the same
        two-column layout as the live books page.
      </p>

      {VARIANTS.map((variant) => (
        <section key={variant.id} style={{ marginTop: '2.5rem' }}>
          <h2 className="page-title" style={{ fontSize: '1.25rem' }}>
            {`Variant ${variant.id} — ${variant.name}`}
          </h2>
          <p className="collection-review-meta">{variant.description}</p>
          <div style={{ marginTop: '1rem' }}>
            <MasonryColumns
              items={EXAMPLE_BOOKS}
              columnCount={columnCount}
              className="spine-cover-list"
              columnClassName="spine-cover-list-col"
              renderItem={(book, index) => (
                <ReviewCard
                  key={book.id}
                  item={book}
                  type="book"
                  isLast={index === EXAMPLE_BOOKS.length - 1}
                  styleVariant="spine-cover"
                  designVariant={variant.id}
                />
              )}
            />
          </div>
        </section>
      ))}
    </div>
  );
}
