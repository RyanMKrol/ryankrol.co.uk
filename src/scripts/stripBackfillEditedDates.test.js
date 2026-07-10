const { shouldStrip, BACKFILL_EDITED_DATES } = require('./stripBackfillEditedDates');

describe('shouldStrip', () => {
  it.each(BACKFILL_EDITED_DATES)('returns true when editedDate is the known backfill artifact date %s', (date) => {
    expect(shouldStrip({ id: '1', editedDate: date })).toBe(true);
  });

  it('returns false when editedDate is a different date (a genuine edit to preserve)', () => {
    expect(shouldStrip({ id: '2', editedDate: '06-07-2026' })).toBe(false);
  });

  it('returns false when editedDate is absent', () => {
    expect(shouldStrip({ id: '3' })).toBe(false);
  });
});
