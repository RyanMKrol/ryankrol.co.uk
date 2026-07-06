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
});
