import { useEffect, useMemo, useRef } from 'react';

/**
 * Minimal rich-text editor based on contentEditable + document.execCommand.
 * Stores content as HTML string (value).
 *
 * Supported:
 * - Bold / Italic / Underline
 * - Bullets / Numbered list
 * - Paragraph breaks
 * - Alignment
 */
export default function RichTextEditor({
  value = '',
  onChange,
  placeholder = '',
  minHeight = 120,
  disabled = false,
  className = ''
}) {
  const ref = useRef(null);

  // Keep DOM in sync when value changes externally
  useEffect(() => {
    if (!ref.current) return;
    const html = value || '';
    if (ref.current.innerHTML !== html) {
      ref.current.innerHTML = html;
    }
  }, [value]);

  const commands = useMemo(
    () => [
      { label: 'B', cmd: 'bold', className: 'font-extrabold' },
      { label: 'I', cmd: 'italic', className: 'italic' },
      { label: 'U', cmd: 'underline', className: 'underline' },
      { label: '•', cmd: 'insertUnorderedList', className: '' },
      { label: '1.', cmd: 'insertOrderedList', className: '' },
      { label: 'Left', cmd: 'justifyLeft', className: 'text-[10px]' },
      { label: 'Center', cmd: 'justifyCenter', className: 'text-[10px]' },
      { label: 'Right', cmd: 'justifyRight', className: 'text-[10px]' }
    ],
    []
  );

  const exec = (cmd) => {
    if (disabled) return;
    ref.current?.focus();
    // eslint-disable-next-line no-undef
    document.execCommand(cmd, false);
    onChange?.(ref.current?.innerHTML || '');
  };

  const handleInput = () => {
    if (disabled) return;
    onChange?.(ref.current?.innerHTML || '');
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex flex-wrap gap-2">
        {commands.map((c) => (
          <button
            key={c.cmd}
            type="button"
            className={`btn-secondary px-3 py-2 text-xs ${c.className}`}
            onClick={() => exec(c.cmd)}
            disabled={disabled}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div
        ref={ref}
        contentEditable={!disabled}
        onInput={handleInput}
        onBlur={handleInput}
        data-placeholder={placeholder}
        className={`input overflow-auto whitespace-pre-wrap leading-relaxed ${
          disabled ? 'bg-gray-50 text-gray-600' : ''
        }`}
        style={{ minHeight }}
        // placeholder styling (tailwind can't target attr easily; keep simple)
        suppressContentEditableWarning
      />
    </div>
  );
}

