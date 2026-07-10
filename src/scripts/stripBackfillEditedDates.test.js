const { shouldStrip, BACKFILL_EDITED_DATE } = require('./stripBackfillEditedDates');

describe('shouldStrip', () => {
  it('returns true when editedDate matches the known backfill artifact date', () => {
    expect(shouldStrip({ id: '1', editedDate: BACKFILL_EDITED_DATE })).toBe(true);
  });

  it('returns false when editedDate is a different date (a genuine edit to preserve)', () => {
    expect(shouldStrip({ id: '2', editedDate: '06-07-2026' })).toBe(false);
  });

  it('returns false when editedDate is absent', () => {
    expect(shouldStrip({ id: '3' })).toBe(false);
  });
});
