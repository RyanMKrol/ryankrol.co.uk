import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import MarkdownEditor from './MarkdownEditor';

function DemoForm() {
  const [value, setValue] = useState('hello world');

  function handleInputChange(e) {
    setValue(e.target.value);
  }

  return (
    <MarkdownEditor
      id="review-text"
      name="gist"
      value={value}
      onChange={handleInputChange}
      placeholder="Write your thoughts"
      required
      className="collection-form-textarea"
    />
  );
}

function selectAll(textarea) {
  textarea.focus();
  textarea.setSelectionRange(0, textarea.value.length);
}

describe('MarkdownEditor', () => {
  it('wraps the selection in ** ** when Bold is clicked', async () => {
    const user = userEvent.setup();
    render(<DemoForm />);
    const textarea = screen.getByPlaceholderText('Write your thoughts');
    selectAll(textarea);

    await user.click(screen.getByRole('button', { name: 'Bold' }));

    expect(textarea.value).toBe('**hello world**');
  });

  it('wraps the selection in * * when Italic is clicked', async () => {
    const user = userEvent.setup();
    render(<DemoForm />);
    const textarea = screen.getByPlaceholderText('Write your thoughts');
    selectAll(textarea);

    await user.click(screen.getByRole('button', { name: 'Italic' }));

    expect(textarea.value).toBe('*hello world*');
  });

  it('prefixes the current line with "- " when List is clicked', async () => {
    const user = userEvent.setup();
    render(<DemoForm />);
    const textarea = screen.getByPlaceholderText('Write your thoughts');
    selectAll(textarea);

    await user.click(screen.getByRole('button', { name: 'Bullet list' }));

    expect(textarea.value).toBe('- hello world');
  });

  it('wraps the selection as a Markdown link when Link is clicked', async () => {
    const user = userEvent.setup();
    render(<DemoForm />);
    const textarea = screen.getByPlaceholderText('Write your thoughts');
    selectAll(textarea);

    await user.click(screen.getByRole('button', { name: 'Link' }));

    expect(textarea.value).toBe('[hello world](url)');
  });

  it('fires onChange with the new value so it works with a generic handleInputChange', async () => {
    const onChange = jest.fn();
    render(
      <MarkdownEditor
        id="review-text"
        name="gist"
        value="hi"
        onChange={onChange}
        className="collection-form-textarea"
      />
    );
    const textarea = screen.getByRole('textbox');
    textarea.setSelectionRange(0, 2);

    await userEvent.setup().click(screen.getByRole('button', { name: 'Bold' }));

    expect(onChange).toHaveBeenCalledWith({
      target: { name: 'gist', value: '**hi**' },
    });
  });

  it('restores the scroll position after a toolbar action on a long, scrolled textarea', async () => {
    const user = userEvent.setup();
    const longText = 'line\n'.repeat(500) + 'hello world';

    function LongDemoForm() {
      const [value, setValue] = useState(longText);
      return (
        <MarkdownEditor
          id="review-text"
          name="gist"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Write your thoughts"
          className="collection-form-textarea"
        />
      );
    }

    render(<LongDemoForm />);
    const textarea = screen.getByPlaceholderText('Write your thoughts');
    const len = textarea.value.length;
    textarea.focus();
    textarea.setSelectionRange(len - 11, len);
    textarea.scrollTop = 300;

    const setSpy = jest.spyOn(Object.getPrototypeOf(textarea), 'scrollTop', 'set');
    setSpy.mockClear();

    await user.click(screen.getByRole('button', { name: 'Bold' }));
    await new Promise((resolve) => requestAnimationFrame(resolve));

    expect(setSpy).toHaveBeenCalledWith(300);
    expect(textarea.scrollTop).toBe(300);

    setSpy.mockRestore();
  });

  it('toggles Bold off when clicked twice on the same selection', async () => {
    const user = userEvent.setup();
    render(<DemoForm />);
    const textarea = screen.getByPlaceholderText('Write your thoughts');
    selectAll(textarea);

    // First click: apply bold
    await user.click(screen.getByRole('button', { name: 'Bold' }));
    expect(textarea.value).toBe('**hello world**');

    // Second click: remove bold
    selectAll(textarea);
    await user.click(screen.getByRole('button', { name: 'Bold' }));
    expect(textarea.value).toBe('hello world');
  });

  it('toggles Italic off when clicked twice on the same selection', async () => {
    const user = userEvent.setup();
    render(<DemoForm />);
    const textarea = screen.getByPlaceholderText('Write your thoughts');
    selectAll(textarea);

    // First click: apply italic
    await user.click(screen.getByRole('button', { name: 'Italic' }));
    expect(textarea.value).toBe('*hello world*');

    // Second click: remove italic
    selectAll(textarea);
    await user.click(screen.getByRole('button', { name: 'Italic' }));
    expect(textarea.value).toBe('hello world');
  });

  it('toggles List prefix off when clicked twice on the same line', async () => {
    const user = userEvent.setup();
    render(<DemoForm />);
    const textarea = screen.getByPlaceholderText('Write your thoughts');
    selectAll(textarea);

    // First click: add list prefix
    await user.click(screen.getByRole('button', { name: 'Bullet list' }));
    expect(textarea.value).toBe('- hello world');

    // Second click: remove list prefix
    selectAll(textarea);
    await user.click(screen.getByRole('button', { name: 'Bullet list' }));
    expect(textarea.value).toBe('hello world');
  });

  it('does not confuse bold (**) with italic (*) when toggling', async () => {
    const user = userEvent.setup();
    render(<DemoForm />);
    const textarea = screen.getByPlaceholderText('Write your thoughts');
    selectAll(textarea);

    // Apply bold
    await user.click(screen.getByRole('button', { name: 'Bold' }));
    expect(textarea.value).toBe('**hello world**');

    // Click italic on bold text should add more italic markers, not remove bold
    selectAll(textarea);
    await user.click(screen.getByRole('button', { name: 'Italic' }));
    expect(textarea.value).toBe('***hello world***');
  });

  it('handles unwrapping when markers are included in selection', async () => {
    const user = userEvent.setup();
    function WrappedForm() {
      const [value, setValue] = useState('**test**');
      return (
        <MarkdownEditor
          id="review-text"
          name="gist"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="collection-form-textarea"
        />
      );
    }
    render(<WrappedForm />);
    const textarea = screen.getByRole('textbox');
    // Select the entire **test** including the markers
    textarea.setSelectionRange(0, 8);

    await user.click(screen.getByRole('button', { name: 'Bold' }));

    expect(textarea.value).toBe('test');
  });

  it('handles unwrapping when markers are outside selection', async () => {
    const user = userEvent.setup();
    function WrappedForm() {
      const [value, setValue] = useState('**test**');
      return (
        <MarkdownEditor
          id="review-text"
          name="gist"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="collection-form-textarea"
        />
      );
    }
    render(<WrappedForm />);
    const textarea = screen.getByRole('textbox');
    // Select only the text content (not the markers)
    textarea.setSelectionRange(2, 6);

    await user.click(screen.getByRole('button', { name: 'Bold' }));

    expect(textarea.value).toBe('test');
  });

  it('preserves focus and selection after toggling off formatting', async () => {
    const user = userEvent.setup();
    render(<DemoForm />);
    const textarea = screen.getByPlaceholderText('Write your thoughts');

    // Apply bold
    selectAll(textarea);
    await user.click(screen.getByRole('button', { name: 'Bold' }));

    // Remove bold and verify focus is restored
    selectAll(textarea);
    await user.click(screen.getByRole('button', { name: 'Bold' }));
    await new Promise((resolve) => requestAnimationFrame(resolve));

    expect(document.activeElement).toBe(textarea);
    expect(textarea.selectionStart).toBe(0);
    expect(textarea.selectionEnd).toBe('hello world'.length);
  });

  it('Link button remains insert-only and does not toggle', async () => {
    const user = userEvent.setup();
    function LinkForm() {
      const [value, setValue] = useState('[test](url)');
      return (
        <MarkdownEditor
          id="review-text"
          name="gist"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="collection-form-textarea"
        />
      );
    }
    render(<LinkForm />);
    const textarea = screen.getByRole('textbox');
    selectAll(textarea);

    // Clicking Link on already-linked text should add another link wrapper
    await user.click(screen.getByRole('button', { name: 'Link' }));

    expect(textarea.value).toBe('[[test](url)](url)');
  });
});
