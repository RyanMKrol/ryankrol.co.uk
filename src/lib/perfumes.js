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

const VALID_APPLICATION_SPOTS = [
  'Wrists',
  'Elbows',
  'Clavicles',
  'Beard',
  'Back of neck',
  'Behind ears',
  'Clothes',
];

function validateApplicationSpots(value) {
  return (
    Array.isArray(value) &&
    value.every(
      (entry) =>
        entry !== null &&
        typeof entry === 'object' &&
        VALID_APPLICATION_SPOTS.includes(entry.spot) &&
        Number.isInteger(entry.sprays) &&
        entry.sprays > 0,
    )
  );
}

function validateFragranticaUrl(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    return false;
  }

  if (!/^https?:\/\//.test(value)) {
    return false;
  }

  try {
    return Boolean(new URL(value));
  } catch (error) {
    return false;
  }
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
  validateApplicationSpots,
  validateFragranticaUrl,
  perfumeId,
};
