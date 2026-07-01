function validatePerfumeRating(value) {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 10;
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

export { validatePerfumeRating, perfumeId };
