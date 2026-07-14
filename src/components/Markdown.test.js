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

  it('renders an extra gap paragraph for a blank line typed between two paragraphs in block mode', () => {
    const { container } = render(<Markdown>{'para one\n\n\npara two'}</Markdown>);
    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs).toHaveLength(3);
    expect(paragraphs[0].textContent).toBe('para one');
    expect(paragraphs[1].textContent).toBe(' ');
    expect(paragraphs[2].textContent).toBe('para two');
  });

  it('renders roughly twice the gap for two consecutive blank lines in block mode', () => {
    const { container } = render(<Markdown>{'para one\n\n\n\npara two'}</Markdown>);
    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs).toHaveLength(4);
    expect(paragraphs[1].textContent).toBe(' ');
    expect(paragraphs[2].textContent).toBe(' ');
  });

  it('does not add an extra gap paragraph for normal single-blank-line paragraph spacing', () => {
    const { container } = render(<Markdown>{'para one\n\npara two'}</Markdown>);
    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs).toHaveLength(2);
    expect(paragraphs[0].textContent).toBe('para one');
    expect(paragraphs[1].textContent).toBe('para two');
  });

  it('does not emit a gap paragraph in inline mode for the same blank-line input', () => {
    const { container } = render(<Markdown inline>{'para one\n\n\npara two'}</Markdown>);
    expect(container.querySelectorAll('p')).toHaveLength(0);
    expect(container.textContent).not.toContain(' ');
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
});
