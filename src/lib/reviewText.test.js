import { truncateReviewText } from './reviewText';

describe('truncateReviewText', () => {
  it('returns short text unchanged', () => {
    const result = truncateReviewText('A short review.', 260);
    expect(result).toEqual({ text: 'A short review.', truncated: false });
  });

  it('returns empty string unchanged', () => {
    const result = truncateReviewText('', 260);
    expect(result).toEqual({ text: '', truncated: false });
  });

  it('truncates long text at a word boundary with an ellipsis', () => {
    const words = Array.from({ length: 100 }, (_, i) => `word${i}`);
    const text = words.join(' ');
    const result = truncateReviewText(text, 50);

    expect(result.truncated).toBe(true);
    expect(result.text.endsWith('…')).toBe(true);
    expect(result.text).not.toMatch(/\s…$/);
    const withoutEllipsis = result.text.slice(0, -1);
    expect(text.startsWith(withoutEllipsis)).toBe(true);
    expect(withoutEllipsis.length).toBeLessThanOrEqual(50);
  });

  it('hard-cuts at maxLength when there is no whitespace in range', () => {
    const text = 'a'.repeat(300);
    const result = truncateReviewText(text, 260);

    expect(result.truncated).toBe(true);
    expect(result.text).toBe(`${'a'.repeat(260)}…`);
  });

  it('respects a custom maxLength', () => {
    const text = 'one two three four five six seven eight nine ten';
    const result = truncateReviewText(text, 10);

    expect(result.truncated).toBe(true);
    expect(result.text.endsWith('…')).toBe(true);
    expect(result.text.length).toBeLessThanOrEqual(11);
  });
});
