export function formatEnglishDate(date) {
  if (!date) return '';

  const parsed = date instanceof Date ? date : new Date(date);

  if (Number.isNaN(parsed.getTime())) return '';

  return parsed.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatReviewDate(dateString) {
  if (!dateString) return '';

  const parts = dateString.split('-');
  if (parts.length !== 3) return '';

  const [day, month, year] = parts.map(Number);
  if ([day, month, year].some(Number.isNaN)) return '';

  return formatEnglishDate(new Date(year, month - 1, day));
}
