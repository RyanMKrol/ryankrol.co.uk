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

  it('toggles Bold off by clicking Bold twice on a selection', async () => {
    const user = userEvent.setup();
    render(<DemoForm />);
    const textarea = screen.getByPlaceholderText('Write your thoughts');
    selectAll(textarea);

    // First click: wrap in **
    await user.click(screen.getByRole('button', { name: 'Bold' }));
    expect(textarea.value).toBe('**hello world**');

    // Select all again to simulate user selecting the newly-bolded text
    selectAll(textarea);

    // Second click: remove **
    await user.click(screen.getByRole('button', { name: 'Bold' }));
    expect(textarea.value).toBe('hello world');
  });

  it('toggles Italic off by clicking Italic twice on a selection', async () => {
    const user = userEvent.setup();
    render(<DemoForm />);
    const textarea = screen.getByPlaceholderText('Write your thoughts');
    selectAll(textarea);

    // First click: wrap in *
    await user.click(screen.getByRole('button', { name: 'Italic' }));
    expect(textarea.value).toBe('*hello world*');

    // Select all again
    selectAll(textarea);

    // Second click: remove *
    await user.click(screen.getByRole('button', { name: 'Italic' }));
    expect(textarea.value).toBe('hello world');
  });

  it('toggles List off by clicking List twice on a line', async () => {
    const user = userEvent.setup();
    render(<DemoForm />);
    const textarea = screen.getByPlaceholderText('Write your thoughts');
    selectAll(textarea);

    // First click: add - prefix
    await user.click(screen.getByRole('button', { name: 'Bullet list' }));
    expect(textarea.value).toBe('- hello world');

    // Select all again
    selectAll(textarea);

    // Second click: remove - prefix
    await user.click(screen.getByRole('button', { name: 'Bullet list' }));
    expect(textarea.value).toBe('hello world');
  });

  it('does not mistake Italic for Bold (italic does not fire on ** wrapped text)', async () => {
    const user = userEvent.setup();
    render(<DemoForm />);
    const textarea = screen.getByPlaceholderText('Write your thoughts');
    selectAll(textarea);

    // Apply Bold
    await user.click(screen.getByRole('button', { name: 'Bold' }));
    expect(textarea.value).toBe('**hello world**');

    // Select all (including the ** markers)
    selectAll(textarea);

    // Click Italic should wrap again (not detect ** as italic)
    await user.click(screen.getByRole('button', { name: 'Italic' }));
    expect(textarea.value).toBe('***hello world***');
  });

  it('does not mistake Bold for Italic (bold does not fire on * wrapped text)', async () => {
    const user = userEvent.setup();
    render(<DemoForm />);
    const textarea = screen.getByPlaceholderText('Write your thoughts');
    selectAll(textarea);

    // Apply Italic
    await user.click(screen.getByRole('button', { name: 'Italic' }));
    expect(textarea.value).toBe('*hello world*');

    // Select all (including the * markers)
    selectAll(textarea);

    // Click Bold should wrap again (not detect * as bold)
    await user.click(screen.getByRole('button', { name: 'Bold' }));
    expect(textarea.value).toBe('***hello world***');
  });

  it('still wraps on first click (existing behavior unchanged for Bold)', async () => {
    const user = userEvent.setup();
    render(<DemoForm />);
    const textarea = screen.getByPlaceholderText('Write your thoughts');
    selectAll(textarea);

    // First click should still wrap normally
    await user.click(screen.getByRole('button', { name: 'Bold' }));
    expect(textarea.value).toBe('**hello world**');
  });

  it('Link button remains INSERT-ONLY (unchanged)', async () => {
    const user = userEvent.setup();
    render(<DemoForm />);
    const textarea = screen.getByPlaceholderText('Write your thoughts');
    selectAll(textarea);

    // First click: wrap as link
    await user.click(screen.getByRole('button', { name: 'Link' }));
    expect(textarea.value).toBe('[hello world](url)');

    // Select all again (including the link markup)
    selectAll(textarea);

    // Second click: should NOT toggle off, should wrap again (INSERT-ONLY)
    await user.click(screen.getByRole('button', { name: 'Link' }));
    expect(textarea.value).toBe('[[hello world](url)](url)');
  });
});
