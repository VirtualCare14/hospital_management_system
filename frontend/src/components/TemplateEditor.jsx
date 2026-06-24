import { useRef, useEffect } from 'react';
import { Bold, Underline, Pilcrow, Plus } from 'lucide-react';

const TemplateEditor = ({ value, onChange, placeholder = 'Start typing template content...' }) => {
  const editorRef = useRef(null);

  // Sync state to DOM innerHTML only when it differs (avoids cursor jump issues)
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCmd = (command, val = null) => {
    document.execCommand(command, false, val);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const insertPlaceholder = (ph) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    const sel = window.getSelection();
    if (sel.getRangeAt && sel.rangeCount) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      
      const textNode = document.createTextNode(ph);
      range.insertNode(textNode);
      
      // Move cursor after the inserted text
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      sel.removeAllRanges();
      sel.addRange(range);
      
      onChange(editorRef.current.innerHTML);
    } else {
      // Fallback if not focused
      const val = (value || '') + ph;
      editorRef.current.innerHTML = val;
      onChange(val);
    }
  };

  const fields = [
    'Patient Name',
    'Age',
    'Sex',
    'Address',
    'Mobile Number',
    'Aadhaar Number',
    'Doctor Name',
    'Referring Doctor Name',
    'Surgical Procedure',
    'Current Date',
    'Hospital Name',
    'Hospital Logo'
  ];

  return (
    <div className="border border-orange-200 rounded-xl overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500 transition-all bg-white">
      {/* Toolbar */}
      <div className="bg-orange-50/50 border-b border-orange-100 p-3 flex flex-wrap items-center gap-2 select-none">
        <button
          type="button"
          onClick={() => execCmd('bold')}
          className="p-2 hover:bg-orange-100 rounded text-gray-700 font-bold flex items-center justify-center transition-colors border border-transparent hover:border-orange-200"
          title="Bold"
        >
          <Bold className="h-4 w-4 text-orange-950" />
        </button>
        <button
          type="button"
          onClick={() => execCmd('underline')}
          className="p-2 hover:bg-orange-100 rounded text-gray-700 font-bold flex items-center justify-center transition-colors border border-transparent hover:border-orange-200"
          title="Underline"
        >
          <Underline className="h-4 w-4 text-orange-950" />
        </button>
        <button
          type="button"
          onClick={() => execCmd('formatBlock', '<p>')}
          className="p-2 hover:bg-orange-100 rounded text-gray-700 font-bold flex items-center justify-center transition-colors border border-transparent hover:border-orange-200"
          title="Paragraph"
        >
          <Pilcrow className="h-4 w-4 text-orange-950" />
        </button>
        
        <span className="h-5 w-px bg-orange-200 mx-2"></span>
        
        {/* Dynamic Fields */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-orange-800 uppercase tracking-wide mb-1">Insert Dynamic Field</p>
          <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto pr-1">
            {fields.map(field => (
              <button
                key={field}
                type="button"
                onClick={() => insertPlaceholder(`{${field}}`)}
                className="text-xs bg-white hover:bg-orange-50 border border-orange-200 hover:border-orange-300 text-orange-950 px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 transition-all shadow-sm hover:shadow active:scale-95 cursor-pointer"
              >
                <Plus className="h-3 w-3 text-orange-500" />
                {field}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Editable Content Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="p-5 min-h-[300px] max-h-[500px] overflow-y-auto outline-none prose prose-sm max-w-none text-gray-800 bg-white placeholder-gray-400"
        style={{ direction: 'ltr' }}
        data-placeholder={placeholder}
      />
    </div>
  );
};

export default TemplateEditor;
