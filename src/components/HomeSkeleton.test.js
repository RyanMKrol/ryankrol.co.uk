import { render } from '@testing-library/react';
import {
  StatBlockSkeleton,
  TileGridSkeleton,
  CardRowSkeleton,
  GymPanelStatsSkeleton,
  ShelfListSkeleton,
  HotTakesPanelSkeleton,
  TopOfMindSkeleton,
} from './HomeSkeleton';

describe('StatBlockSkeleton', () => {
  it('renders the real (borderless) stat-block markup with invisible-text shimmer sizers', () => {
    const { container } = render(<StatBlockSkeleton label="movies" />);
    const block = container.querySelector('.collection-stat-block.skeleton-stat-block');
    expect(block).toBeInTheDocument();
    // Must NOT be the bordered neutral variant — the loaded accent blocks have no border,
    // and a border would make the skeleton taller than the content it stands in for.
    expect(block.classList.contains('neutral')).toBe(false);
    // Value and label placeholders use the real typography classes so line boxes match.
    expect(container.querySelector('.collection-stat-value .skeleton-text')).toBeInTheDocument();
    expect(container.querySelector('.collection-stat-label .skeleton-text')).toHaveTextContent('movies');
  });
});

describe('TileGridSkeleton', () => {
  it('defaults to 18 tiles matching the wall grid shape', () => {
    const { container } = render(<TileGridSkeleton />);
    expect(container.querySelectorAll('.cover-tile-wrap').length).toBe(18);
  });

  it('renders a custom count', () => {
    const { container } = render(<TileGridSkeleton count={4} />);
    expect(container.querySelectorAll('.cover-tile-wrap').length).toBe(4);
  });

  it('mirrors the real CoverTile caption structure so tile heights match', () => {
    const { container } = render(<TileGridSkeleton count={1} />);
    expect(container.querySelector('.cover-tile-caption .cover-tile-title .skeleton-text')).toBeInTheDocument();
    expect(container.querySelector('.cover-tile-caption .cover-tile-subtitle .skeleton-text')).toBeInTheDocument();
  });
});

describe('CardRowSkeleton', () => {
  it('defaults to 3 card rows', () => {
    const { container } = render(<CardRowSkeleton />);
    expect(container.querySelectorAll('.home-latest-card').length).toBe(3);
  });

  it('mirrors the real card structure: title text, star-sized spacer, three-line snippet', () => {
    const { container } = render(<CardRowSkeleton count={1} />);
    expect(container.querySelector('.home-latest-title .home-latest-title-text .skeleton-text')).toBeInTheDocument();
    // The stars set the title row's height (1.3rem glyphs), so the skeleton reserves them too.
    expect(container.querySelector('.home-latest-title .stars .star')).toBeInTheDocument();
    expect(container.querySelectorAll('.home-latest-snippet .skeleton-snippet-line').length).toBe(3);
  });
});

describe('GymPanelStatsSkeleton', () => {
  it('renders three stat placeholders using the real stat classes plus a sparkline placeholder', () => {
    const { container } = render(<GymPanelStatsSkeleton />);
    expect(container.querySelectorAll('.home-gym-stats .home-gym-stat-value').length).toBe(3);
    expect(container.querySelectorAll('.home-gym-stats .home-gym-stat-label').length).toBe(3);
    expect(container.querySelector('.home-sparkline .skeleton-sparkline-fill')).toBeInTheDocument();
  });
});

describe('TopOfMindSkeleton', () => {
  it('renders the gold panel, a clamped body with three lines, and a toggle-row placeholder', () => {
    const { container } = render(<TopOfMindSkeleton />);
    // Same panel + clamped-body classes the real TopOfMind uses, so the two are the same size.
    expect(container.querySelector('.home-top-of-mind-panel')).toBeInTheDocument();
    expect(container.querySelector('.home-top-of-mind-body-clamped')).toBeInTheDocument();
    expect(container.querySelectorAll('.home-top-of-mind-skeleton-line').length).toBe(3);
    expect(container.querySelector('.home-top-of-mind-toggle-skeleton')).toBeInTheDocument();
  });
});

describe('ShelfListSkeleton', () => {
  it('defaults to 5 rows using the real shelf-item class', () => {
    const { container } = render(<ShelfListSkeleton />);
    expect(container.querySelectorAll('.home-shelf-item').length).toBe(5);
  });

  it('renders a custom count', () => {
    const { container } = render(<ShelfListSkeleton count={2} />);
    expect(container.querySelectorAll('.home-shelf-item').length).toBe(2);
  });
});

describe('HotTakesPanelSkeleton', () => {
  it('renders 3 two-line take slots plus date and view-all placeholders', () => {
    const { container } = render(<HotTakesPanelSkeleton />);
    expect(container.querySelectorAll('.home-hot-takes-item').length).toBe(3);
    expect(container.querySelectorAll('.home-hot-takes-item .home-hot-takes-text .skeleton-snippet-line').length).toBe(6);
    expect(container.querySelectorAll('.home-hot-takes-item .home-hot-takes-date .skeleton-text').length).toBe(3);
    expect(container.querySelector('.home-hot-takes-viewall .skeleton-text')).toBeInTheDocument();
  });
});
