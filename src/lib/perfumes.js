function validatePerfumeRating(value) {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 10;
}

const VALID_SEASONS = ['Winter', 'Spring', 'Summer', 'Autumn', 'Day', 'Night'];

function validateLongevity(value) {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 8;
}

function validateProjection(value) {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 4;
}

function validateSeasons(value) {
  return Array.isArray(value) && value.every((season) => VALID_SEASONS.includes(season));
}

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function perfumeId({ title, designer, type }) {
  return [slugify(title), slugify(designer), slugify(type)].join('__');
}

export {
  validatePerfumeRating,
  validateLongevity,
  validateProjection,
  validateSeasons,
  perfumeId,
};
