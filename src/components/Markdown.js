import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const INLINE_ELEMENTS = ['p', 'strong', 'em', 'a', 'del', 'code'];

const inlineComponents = {
  p: ({ children }) => <>{children}</>,
};

// CommonMark collapses any run of blank lines down to a single paragraph
// break, so a user's intentional extra blank line has no visible effect.
// Turn each run of N>=2 consecutive blank lines into the normal paragraph
// break plus (N-1) standalone "gap paragraphs" (a lone non-breaking space)
// so the extra vertical space actually renders.
export function preserveBlankLines(src) {
  if (typeof src !== 'string') return src;

  const lines = src.split('\n');
  const result = [];
  let i = 0;

  while (i < lines.length) {
    if (lines[i].trim() === '') {
      let j = i;
      while (j < lines.length && lines[j].trim() === '') j += 1;
      const blankCount = j - i;

      result.push('');
      for (let k = 1; k < blankCount; k += 1) {
        result.push(' ');
        result.push('');
      }

      i = j;
    } else {
      result.push(lines[i]);
      i += 1;
    }
  }

  return result.join('\n');
}

// CommonMark collapses a single typed Enter (one newline, no blank line) into
// a plain space when rendering a paragraph. Append a hard-break marker (two
// trailing spaces) to any line immediately followed by another non-blank
// line, so that soft break renders as a visible line break instead. Blank
// lines are left untouched — they start a real paragraph break, handled by
// preserveBlankLines.
export function preserveSingleNewlines(src) {
  if (typeof src !== 'string') return src;

  const lines = src.split('\n');
  const result = lines.map((line, i) => {
    if (line.trim() === '') return line;
    const nextLine = lines[i + 1];
    if (nextLine === undefined || nextLine.trim() === '') return line;
    return `${line}  `;
  });

  return result.join('\n');
}

export default function Markdown({ children, inline = false }) {
  if (!children) return null;

  if (inline) {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        allowedElements={INLINE_ELEMENTS}
        unwrapDisallowed
        components={inlineComponents}
      >
        {children}
      </ReactMarkdown>
    );
  }

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]}>
      {preserveBlankLines(preserveSingleNewlines(children))}
    </ReactMarkdown>
  );
}
