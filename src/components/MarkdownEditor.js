import { useRef } from 'react';

function wrapSelection(value, start, end, before, after) {
  const selected = value.slice(start, end);
  const newValue =
    value.slice(0, start) + before + selected + after + value.slice(end);
  const cursorStart = start + before.length;
  const cursorEnd = cursorStart + selected.length;
  return { newValue, cursorStart, cursorEnd };
}

function insertLinePrefix(value, start, end, prefix) {
  const lineStart = value.lastIndexOf('\n', start - 1) + 1;
  const newValue = value.slice(0, lineStart) + prefix + value.slice(lineStart);
  const offset = lineStart <= start ? prefix.length : 0;
  return { newValue, cursorStart: start + offset, cursorEnd: end + offset };
}

export default function MarkdownEditor({
  id,
  name,
  value,
  onChange,
  placeholder,
  required,
  className,
}) {
  const textareaRef = useRef(null);

  function applyChange(newValue, cursorStart, cursorEnd) {
    onChange({ target: { name, value: newValue } });
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(cursorStart, cursorEnd);
      }
    });
  }

  function handleToolbarAction(action) {
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end } = el;
    const currentValue = value || '';

    let result;
    if (action === 'bold') {
      result = wrapSelection(currentValue, start, end, '**', '**');
    } else if (action === 'italic') {
      result = wrapSelection(currentValue, start, end, '*', '*');
    } else if (action === 'list') {
      result = insertLinePrefix(currentValue, start, end, '- ');
    } else if (action === 'link') {
      const selected = currentValue.slice(start, end);
      const before = '[';
      const after = `](url)`;
      const newValue =
        currentValue.slice(0, start) +
        before +
        selected +
        after +
        currentValue.slice(end);
      result = {
        newValue,
        cursorStart: start + before.length + selected.length + 2,
        cursorEnd: start + before.length + selected.length + 5,
      };
    } else {
      return;
    }

    applyChange(result.newValue, result.cursorStart, result.cursorEnd);
  }

  return (
    <div className="markdown-editor">
      <div className="markdown-editor-toolbar">
        <button
          type="button"
          className="markdown-editor-toolbar-button"
          onClick={() => handleToolbarAction('bold')}
          aria-label="Bold"
        >
          B
        </button>
        <button
          type="button"
          className="markdown-editor-toolbar-button"
          onClick={() => handleToolbarAction('italic')}
          aria-label="Italic"
        >
          I
        </button>
        <button
          type="button"
          className="markdown-editor-toolbar-button"
          onClick={() => handleToolbarAction('list')}
          aria-label="Bullet list"
        >
          List
        </button>
        <button
          type="button"
          className="markdown-editor-toolbar-button"
          onClick={() => handleToolbarAction('link')}
          aria-label="Link"
        >
          Link
        </button>
      </div>
      <textarea
        ref={textareaRef}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={className || 'collection-form-textarea'}
      />
    </div>
  );
}
