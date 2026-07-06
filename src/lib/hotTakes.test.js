import { validateHotTakeText, MAX_TEXT_LENGTH } from './hotTakes';

describe('validateHotTakeText', () => {
  it('accepts a normal short sentence', () => {
    expect(validateHotTakeText('Pineapple belongs on pizza.')).toBe(true);
  });

  it('rejects an empty string', () => {
    expect(validateHotTakeText('')).toBe(false);
  });

  it('rejects a whitespace-only string', () => {
    expect(validateHotTakeText('   ')).toBe(false);
  });

  it('rejects non-string values', () => {
    expect(validateHotTakeText(null)).toBe(false);
    expect(validateHotTakeText(undefined)).toBe(false);
    expect(validateHotTakeText(123)).toBe(false);
    expect(validateHotTakeText({})).toBe(false);
  });

  it('rejects a string over the max length', () => {
    expect(validateHotTakeText('a'.repeat(MAX_TEXT_LENGTH + 1))).toBe(false);
  });

  it('accepts a string exactly at the max length', () => {
    expect(validateHotTakeText('a'.repeat(MAX_TEXT_LENGTH))).toBe(true);
  });
});
