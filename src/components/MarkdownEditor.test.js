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
});
