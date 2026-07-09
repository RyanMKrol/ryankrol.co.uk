const TTL_DAYS = 90;
const MAX_TEXT_LENGTH = 20000;
const DAY_MS = 24 * 60 * 60 * 1000;

function isExpired(updatedAt, now = new Date()) {
  const updated = updatedAt instanceof Date ? updatedAt : new Date(updatedAt);
  const elapsedMs = now.getTime() - updated.getTime();
  return elapsedMs > TTL_DAYS * DAY_MS;
}

function daysSinceUpdate(updatedAt, now = new Date()) {
  const updated = updatedAt instanceof Date ? updatedAt : new Date(updatedAt);
  const elapsedMs = now.getTime() - updated.getTime();
  return elapsedMs / DAY_MS;
}

function daysRemaining(updatedAt, now = new Date()) {
  return TTL_DAYS - daysSinceUpdate(updatedAt, now);
}

function validateTopOfMindText(value) {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.length > MAX_TEXT_LENGTH) return false;
  return true;
}

export {
  TTL_DAYS,
  MAX_TEXT_LENGTH,
  isExpired,
  daysSinceUpdate,
  daysRemaining,
  validateTopOfMindText,
};
