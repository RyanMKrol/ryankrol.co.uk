import { render } from '@testing-library/react';
import {
  StatBlockSkeleton,
  TileGridSkeleton,
  CardRowSkeleton,
  GymPanelStatsSkeleton,
  ListRowSkeleton,
} from './HomeSkeleton';

describe('StatBlockSkeleton', () => {
  it('renders a placeholder stat block with shimmer pieces', () => {
    const { container } = render(<StatBlockSkeleton />);
    expect(container.querySelector('.collection-stat-block.skeleton-stat-block')).toBeInTheDocument();
    expect(container.querySelectorAll('.skeleton-shimmer').length).toBe(2);
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
});

describe('CardRowSkeleton', () => {
  it('defaults to 3 card rows', () => {
    const { container } = render(<CardRowSkeleton />);
    expect(container.querySelectorAll('.home-latest-card').length).toBe(3);
  });
});

describe('GymPanelStatsSkeleton', () => {
  it('renders the two stat placeholders plus a sparkline placeholder', () => {
    const { container } = render(<GymPanelStatsSkeleton />);
    expect(container.querySelectorAll('.skeleton-gym-stat').length).toBe(2);
    expect(container.querySelector('.skeleton-sparkline')).toBeInTheDocument();
  });
});

describe('ListRowSkeleton', () => {
  it('defaults to 3 rows', () => {
    const { container } = render(<ListRowSkeleton />);
    expect(container.querySelectorAll('.skeleton-list-row').length).toBe(3);
  });

  it('renders a custom count', () => {
    const { container } = render(<ListRowSkeleton count={5} />);
    expect(container.querySelectorAll('.skeleton-list-row').length).toBe(5);
  });
});
