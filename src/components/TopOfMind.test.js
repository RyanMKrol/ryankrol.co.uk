import { render, screen, fireEvent } from '@testing-library/react';
import TopOfMind from './TopOfMind';

// jsdom has no layout engine, so scrollHeight/clientHeight are both 0 by default.
// Mock them to drive the overflow-detection branch (scrollHeight > clientHeight).
function mockBodyMetrics({ scrollHeight, clientHeight }) {
  Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
    configurable: true,
    get() {
      return this.classList.contains('home-top-of-mind-body') ? scrollHeight : 0;
    },
  });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    get() {
      return this.classList.contains('home-top-of-mind-body') ? clientHeight : 0;
    },
  });
}

afterEach(() => {
  delete HTMLElement.prototype.scrollHeight;
  delete HTMLElement.prototype.clientHeight;
});

describe('TopOfMind', () => {
  it('renders the note text inside the gold panel', () => {
    mockBodyMetrics({ scrollHeight: 50, clientHeight: 50 });
    render(<TopOfMind text="A short thought" />);
    expect(screen.getByText('A short thought')).toBeInTheDocument();
    expect(document.querySelector('.home-top-of-mind-panel')).toBeInTheDocument();
  });

  it('shows no "See more" toggle when the content fits the clamp', () => {
    mockBodyMetrics({ scrollHeight: 50, clientHeight: 50 });
    render(<TopOfMind text="A short thought" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    // The toggle row is still present (it reserves height for a stable layout).
    expect(document.querySelector('.home-top-of-mind-toggle-row')).toBeInTheDocument();
  });

  it('shows "See more" when the content overflows and toggles to "See less" on click', () => {
    mockBodyMetrics({ scrollHeight: 200, clientHeight: 80 });
    render(<TopOfMind text="A much longer thought that overflows the three-line clamp" />);

    const button = screen.getByRole('button', { name: 'See more' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(document.querySelector('.home-top-of-mind-body-clamped')).toBeInTheDocument();

    fireEvent.click(button);

    expect(screen.getByRole('button', { name: 'See less' })).toHaveAttribute('aria-expanded', 'true');
    expect(document.querySelector('.home-top-of-mind-body-expanded')).toBeInTheDocument();
    expect(document.querySelector('.home-top-of-mind-body-clamped')).not.toBeInTheDocument();
  });
});
