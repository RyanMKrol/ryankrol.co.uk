export function truncateReviewText(text, maxLength = 260) {
  if (text.length <= maxLength) {
    return { text, truncated: false };
  }

  let cutIndex = -1;
  for (let i = maxLength; i >= 0; i -= 1) {
    if (/\s/.test(text[i])) {
      cutIndex = i;
      break;
    }
  }

  const cut = cutIndex === -1 ? text.slice(0, maxLength) : text.slice(0, cutIndex);

  return { text: `${cut.trimEnd()}…`, truncated: true };
}
