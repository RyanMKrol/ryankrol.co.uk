import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const INLINE_ELEMENTS = ['p', 'strong', 'em', 'a', 'del', 'code'];

const inlineComponents = {
  p: ({ children }) => <>{children}</>,
};

// CommonMark collapses a single typed Enter (one newline, no blank line) into
// a plain space when rendering a paragraph. Append a hard-break marker (two
// trailing spaces) to any line immediately followed by another non-blank
// line, so that soft break renders as a visible line break instead. Blank
// lines are left untouched — they start a real paragraph break, which
// ReactMarkdown renders as a separate paragraph (spaced by `.markdown-body p`
// in globals.css). Runs of extra blank lines collapse to one paragraph break,
// standard CommonMark — real paragraph margins carry the spacing now.
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

  // Wrap block-mode output in a scoping hook so paragraph spacing can be
  // restored without a bare `p { margin }` rule (the global `* { margin: 0 }`
  // reset in globals.css otherwise collapses every paragraph gap to nothing —
  // see the `.markdown-body p` rule). The wrapper is inert layout-wise; all
  // snippet/table styling uses descendant selectors that pass through it.
  return (
    <div className="markdown-body">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {preserveSingleNewlines(children)}
      </ReactMarkdown>
    </div>
  );
}
