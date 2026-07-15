import { useState } from 'react';
import { truncateReviewText } from '../lib/reviewText';

export function useExpandableText(fullText, maxLength = 260) {
  const [expanded, setExpanded] = useState(false);
  const { text: previewText, truncated } = truncateReviewText(fullText, maxLength);
  const displayText = expanded ? fullText : previewText;

  const toggle = () => setExpanded((e) => !e);

  return {
    displayText,
    truncated,
    expanded,
    toggle,
  };
}
