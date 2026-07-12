import { useRef } from 'react';

function wrapSelection(value, start, end, before, after) {
  const selected = value.slice(start, end);
  const newValue =
    value.slice(0, start) + before + selected + after + value.slice(end);
  const cursorStart = start + before.length;
  const cursorEnd = cursorStart + selected.length;
  return { newValue, cursorStart, cursorEnd };
}

function isWrappedWith(value, start, end, before, after) {
  // Check if text is wrapped: markers immediately outside OR included in selection
  const beforeMarker = value.slice(Math.max(0, start - before.length), start);
  const afterMarker = value.slice(end, end + after.length);
  const selectedWithMarkers = value.slice(start, end);

  // Markers outside the selection
  if (beforeMarker === before && afterMarker === after) {
    return true;
  }

  // Markers included in selection
  if (selectedWithMarkers.startsWith(before) && selectedWithMarkers.endsWith(after)) {
    return true;
  }

  return false;
}

function unwrapSelection(value, start, end, before, after) {
  // Remove markers that are outside the selection
  const beforeMarker = value.slice(Math.max(0, start - before.length), start);
  const afterMarker = value.slice(end, end + after.length);

  if (beforeMarker === before && afterMarker === after) {
    const newValue =
      value.slice(0, start - before.length) +
      value.slice(start, end) +
      value.slice(end + after.length);
    return {
      newValue,
      cursorStart: start - before.length,
      cursorEnd: end - before.length,
    };
  }

  // Remove markers that are included in selection
  const selected = value.slice(start, end);
  if (selected.startsWith(before) && selected.endsWith(after)) {
    const unwrapped = selected.slice(before.length, -after.length);
    const newValue =
      value.slice(0, start) + unwrapped + value.slice(end);
    return {
      newValue,
      cursorStart: start,
      cursorEnd: start + unwrapped.length,
    };
  }

  return null;
}

function insertLinePrefix(value, start, end, prefix) {
  const lineStart = value.lastIndexOf('\n', start - 1) + 1;
  const newValue = value.slice(0, lineStart) + prefix + value.slice(lineStart);
  const offset = lineStart <= start ? prefix.length : 0;
  return { newValue, cursorStart: start + offset, cursorEnd: end + offset };
}

function removeLinePrefix(value, start, end, prefix) {
  const lineStart = value.lastIndexOf('\n', start - 1) + 1;
  const lineContent = value.slice(lineStart);

  if (lineContent.startsWith(prefix)) {
    const newValue = value.slice(0, lineStart) + lineContent.slice(prefix.length);
    const offset = lineStart <= start ? prefix.length : 0;
    return {
      newValue,
      cursorStart: Math.max(lineStart, start - offset),
      cursorEnd: Math.max(lineStart, end - offset),
    };
  }

  return null;
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
    const currentEl = textareaRef.current;
    const scrollTop = currentEl ? currentEl.scrollTop : null;
    onChange({ target: { name, value: newValue } });
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(cursorStart, cursorEnd);
        el.scrollTop = scrollTop;
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
      if (isWrappedWith(currentValue, start, end, '**', '**')) {
        result = unwrapSelection(currentValue, start, end, '**', '**');
      } else {
        result = wrapSelection(currentValue, start, end, '**', '**');
      }
    } else if (action === 'italic') {
      // Check for ** first to avoid misidentifying bold as italic
      if (isWrappedWith(currentValue, start, end, '**', '**')) {
        // Don't toggle if it's bold, just wrap normally
        result = wrapSelection(currentValue, start, end, '*', '*');
      } else if (isWrappedWith(currentValue, start, end, '*', '*')) {
        result = unwrapSelection(currentValue, start, end, '*', '*');
      } else {
        result = wrapSelection(currentValue, start, end, '*', '*');
      }
    } else if (action === 'list') {
      const removeResult = removeLinePrefix(currentValue, start, end, '- ');
      if (removeResult) {
        result = removeResult;
      } else {
        result = insertLinePrefix(currentValue, start, end, '- ');
      }
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
