import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const INLINE_ELEMENTS = ['p', 'strong', 'em', 'a', 'del', 'code'];

const inlineComponents = {
  p: ({ children }) => <>{children}</>,
};

export default function Markdown({ children, inline = false }) {
  if (!children) return null;

  if (inline) {
    return (
      <ReactMarkdown allowedElements={INLINE_ELEMENTS} unwrapDisallowed components={inlineComponents}>
        {children}
      </ReactMarkdown>
    );
  }

  return <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>;
}
