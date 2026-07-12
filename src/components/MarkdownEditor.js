import { useRef } from 'react';

function wrapSelection(value, start, end, before, after) {
  const selected = value.slice(start, end);
  const newValue =
    value.slice(0, start) + before + selected + after + value.slice(end);
  const cursorStart = start + before.length;
  const cursorEnd = cursorStart + selected.length;
  return { newValue, cursorStart, cursorEnd };
}

function toggleWrapSelection(value, start, end, before, after) {
  const selected = value.slice(start, end);
  const beforeLength = before.length;
  const afterLength = after.length;

  // For single-* italic detection, ensure we're not matching ** (bold)
  // If looking for single *, don't match if preceded by * (would be **)
  // If looking for **, don't match if it's actually single * wrapped
  const isItalic = before === '*' && after === '*';
  const isBold = before === '**' && after === '**';

  // Check if markers are outside the selection (e.g. **[test]**)
  let hasMarkersBefore = value.slice(start - beforeLength, start) === before;
  let hasMarkersAfter = value.slice(end, end + afterLength) === after;

  // For italic, exclude if adjacent to another * (which would be ** bold)
  if (isItalic && hasMarkersBefore) {
    const beforeContext = value.slice(start - 2, start);
    // If we'd be detecting as italic but there's ** before, it's actually bold
    if (beforeContext === '**') {
      hasMarkersBefore = false;
    }
  }
  if (isItalic && hasMarkersAfter) {
    const afterContext = value.slice(end, end + 2);
    // If we'd be detecting as italic but there's ** after, it's actually bold
    if (afterContext === '**') {
      hasMarkersAfter = false;
    }
  }

  if (hasMarkersBefore && hasMarkersAfter) {
    // Remove the markers
    const newValue =
      value.slice(0, start - beforeLength) +
      selected +
      value.slice(end + afterLength);
    return { newValue, cursorStart: start - beforeLength, cursorEnd: end - beforeLength };
  }

  // Check if markers are included in the selection (e.g. [**test**])
  if (
    selected.startsWith(before) &&
    selected.endsWith(after) &&
    selected.length > beforeLength + afterLength
  ) {
    // For italic, make sure we're not in a ** wrapped selection
    if (isItalic) {
      // Check if the selection is actually **...**
      if (selected.startsWith('**') && selected.endsWith('**')) {
        // This is bold, not italic - wrap instead of unwrap
        return wrapSelection(value, start, end, before, after);
      }
    }

    // Remove the markers
    const newValue =
      value.slice(0, start) +
      selected.slice(beforeLength, selected.length - afterLength) +
      value.slice(end);
    return { newValue, cursorStart: start, cursorEnd: end - beforeLength - afterLength };
  }

  // Wrap the selection (no markers detected)
  return wrapSelection(value, start, end, before, after);
}

function insertLinePrefix(value, start, end, prefix) {
  const lineStart = value.lastIndexOf('\n', start - 1) + 1;
  const newValue = value.slice(0, lineStart) + prefix + value.slice(lineStart);
  const offset = lineStart <= start ? prefix.length : 0;
  return { newValue, cursorStart: start + offset, cursorEnd: end + offset };
}

function toggleLinePrefix(value, start, end, prefix) {
  const lineStart = value.lastIndexOf('\n', start - 1) + 1;
  const lineContent = value.slice(lineStart);

  // Check if line already starts with the prefix
  if (lineContent.startsWith(prefix)) {
    // Remove the prefix
    const newValue = value.slice(0, lineStart) + lineContent.slice(prefix.length);
    const offset = prefix.length;
    return { newValue, cursorStart: start - offset, cursorEnd: end - offset };
  }

  // Add the prefix (use existing insertLinePrefix logic)
  return insertLinePrefix(value, start, end, prefix);
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
      result = toggleWrapSelection(currentValue, start, end, '**', '**');
    } else if (action === 'italic') {
      result = toggleWrapSelection(currentValue, start, end, '*', '*');
    } else if (action === 'list') {
      result = toggleLinePrefix(currentValue, start, end, '- ');
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
