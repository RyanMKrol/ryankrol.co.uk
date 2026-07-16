import { render, screen } from '@testing-library/react';
import Markdown from './Markdown';

describe('Markdown', () => {
  it('renders bold text inside a strong element in block mode', () => {
    render(<Markdown>{'**bold**'}</Markdown>);
    const strong = screen.getByText('bold');
    expect(strong.tagName).toBe('STRONG');
  });

  it('renders italic text inside an em element in block mode', () => {
    render(<Markdown>{'*italic*'}</Markdown>);
    const em = screen.getByText('italic');
    expect(em.tagName).toBe('EM');
  });

  it('renders a list item inside a ul/li in block mode', () => {
    const { container } = render(<Markdown>{'- list item'}</Markdown>);
    const ul = container.querySelector('ul');
    expect(ul).not.toBeNull();
    const li = ul.querySelector('li');
    expect(li).not.toBeNull();
    expect(li.textContent).toBe('list item');
  });

  it('does not render a ul/li for list syntax in inline mode', () => {
    const { container } = render(<Markdown inline>{'- list item'}</Markdown>);
    expect(container.querySelector('ul')).toBeNull();
    expect(container.querySelector('li')).toBeNull();
    expect(container.textContent).toContain('list item');
  });

  it('renders a link with the correct href', () => {
    render(<Markdown>{'[link](https://example.com)'}</Markdown>);
    const link = screen.getByText('link');
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('https://example.com');
  });

  it('renders a normal single-blank-line paragraph break as two p elements', () => {
    const { container } = render(<Markdown>{'para one\n\npara two'}</Markdown>);
    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs).toHaveLength(2);
    expect(paragraphs[0].textContent).toBe('para one');
    expect(paragraphs[1].textContent).toBe('para two');
  });

  it('collapses a run of two or more blank lines to a single paragraph break (no gap paragraphs)', () => {
    // T382's gap-paragraph injection was removed once real paragraph margins
    // (`.markdown-body p`) took over the spacing — extra blank lines now
    // collapse to one paragraph break, standard CommonMark. No lone-space `p`.
    const { container } = render(<Markdown>{'para one\n\n\npara two'}</Markdown>);
    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs).toHaveLength(2);
    expect(paragraphs[0].textContent).toBe('para one');
    expect(paragraphs[1].textContent).toBe('para two');
    expect(container.querySelector('br')).toBeNull();
  });

  it('collapses an even longer blank-line run to a single paragraph break', () => {
    const { container } = render(<Markdown>{'para one\n\n\n\npara two'}</Markdown>);
    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs).toHaveLength(2);
    expect(paragraphs[0].textContent).toBe('para one');
    expect(paragraphs[1].textContent).toBe('para two');
  });

  it('renders strikethrough text inside a del element in block mode', () => {
    render(<Markdown>{'~~struck~~'}</Markdown>);
    const del = screen.getByText('struck');
    expect(del.tagName).toBe('DEL');
  });

  it('renders strikethrough text inside a del element in inline mode', () => {
    // Regression test (T389): inline mode allows `del` in INLINE_ELEMENTS but was missing
    // remarkGfm, so `~~text~~` never parsed as strikethrough — it rendered as literal `~~text~~`.
    render(<Markdown inline>{'~~struck~~'}</Markdown>);
    const del = screen.getByText('struck');
    expect(del.tagName).toBe('DEL');
    expect(screen.queryByText(/~~struck~~/)).toBeNull();
  });

  it('renders a link with the correct href in inline mode', () => {
    render(<Markdown inline>{'[link](https://example.com)'}</Markdown>);
    const link = screen.getByText('link');
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('https://example.com');
  });

  it('renders a single typed newline as a visible line break within one paragraph in block mode', () => {
    const { container } = render(<Markdown>{'line one\nline two'}</Markdown>);
    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs).toHaveLength(1);
    const br = paragraphs[0].querySelector('br');
    expect(br).not.toBeNull();
    expect(paragraphs[0].textContent).toBe('line one\nline two');
  });

  it('does not introduce a br for a single newline in inline mode', () => {
    const { container } = render(<Markdown inline>{'line one\nline two'}</Markdown>);
    expect(container.querySelector('br')).toBeNull();
    expect(container.textContent).toContain('line one');
    expect(container.textContent).toContain('line two');
  });

  it('wraps block-mode output in a .markdown-body element so paragraph spacing can be scoped', () => {
    // The `.markdown-body p` rule in globals.css restores the paragraph margin
    // the global `* { margin: 0 }` reset removes. Without this wrapper the rule
    // has nothing to hook onto, so blank-line paragraph breaks collapse to no
    // visible gap. Locking the wrapper in stops a refactor silently removing it.
    const { container } = render(<Markdown>{'para one\n\npara two'}</Markdown>);
    const wrapper = container.querySelector('.markdown-body');
    expect(wrapper).not.toBeNull();
    expect(wrapper.querySelectorAll('p')).toHaveLength(2);
  });

  it('does not wrap inline-mode output in a .markdown-body element', () => {
    const { container } = render(<Markdown inline>{'just text'}</Markdown>);
    expect(container.querySelector('.markdown-body')).toBeNull();
  });
});
