const MAX_TEXT_LENGTH = 500;

function validateHotTakeText(value) {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.length > MAX_TEXT_LENGTH) return false;
  return true;
}

function parseUkDate(dateString) {
  if (!dateString) return null;
  const [day, month, year] = dateString.split('-').map(Number);
  if (!day || !month || !year) return null;
  return new Date(year, month - 1, day);
}

function sortByDateDesc(items) {
  return [...items].sort((a, b) => (parseUkDate(b.date) ?? 0) - (parseUkDate(a.date) ?? 0));
}

export { validateHotTakeText, parseUkDate, sortByDateDesc, MAX_TEXT_LENGTH };
