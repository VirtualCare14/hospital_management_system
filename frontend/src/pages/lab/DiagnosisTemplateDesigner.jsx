import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowDown, ArrowUp, Plus, Save, Trash2, Eye, X } from 'lucide-react';
import client from '../../api/client';
import RichTextEditor from '../../components/RichTextEditor.jsx';

const makeId = () => (globalThis.crypto?.randomUUID ? crypto.randomUUID() : `id_${Date.now()}_${Math.random()}`);

const COMPONENTS = [
  { type: 'heading', label: 'Heading' },
  { type: 'textField', label: 'Text Field' },
  { type: 'textArea', label: 'Text Area' },
  { type: 'findings', label: 'Findings Section' },
  { type: 'impression', label: 'Impression Section' },
  { type: 'recommendation', label: 'Recommendation Section' },
  { type: 'image', label: 'Image Upload Section' },
  { type: 'divider', label: 'Divider' },
  { type: 'blankSpace', label: 'Blank Space' }
];

export default function DiagnosisTemplateDesigner({ test, labProfile, onClose, onSaved }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [structure, setStructure] = useState([]);
  const [showPreview, setShowPreview] = useState(true);
  const draggingIndexRef = useRef(null);

  const canEdit = true; // backend enforces admin; UI can still render read-only if needed later

  const testLabel = useMemo(() => test?.title || test?.test || 'Diagnosis Test', [test]);

  const fetchTemplate = async () => {
    if (!test?._id) return;
    setLoading(true);
    try {
      const res = await client.get(`/lab/diagnosis-templates/test/${test._id}`);
      if (res.data) {
        setStructure(Array.isArray(res.data.templateStructure) ? res.data.templateStructure : []);
      } else {
        setStructure([]);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to load template');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [test?._id]);

  const addComponent = (type) => {
    const base = { id: makeId(), type };
    if (type === 'image') {
      setStructure((s) => [...s, { ...base, multiple: true }]);
      return;
    }
    if (type === 'blankSpace') {
      setStructure((s) => [...s, { ...base, height: 24 }]);
      return;
    }
    if (type === 'divider') {
      setStructure((s) => [...s, base]);
      return;
    }
    setStructure((s) => [...s, { ...base, label: '' }]);
  };

  const move = (from, to) => {
    if (to < 0 || to >= structure.length) return;
    setStructure((current) => {
      const next = [...current];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  const remove = (index) => setStructure((s) => s.filter((_, i) => i !== index));

  const updateItem = (index, patch) => {
    setStructure((s) => s.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const onDragStart = (index) => {
    draggingIndexRef.current = index;
  };

  const onDrop = (index) => {
    const from = draggingIndexRef.current;
    draggingIndexRef.current = null;
    if (from === null || from === undefined) return;
    if (from === index) return;
    move(from, index);
  };

  const save = async () => {
    if (!test?._id) return;
    setSaving(true);
    try {
      await client.post(`/lab/diagnosis-templates/test/${test._id}`, {
        templateName: testLabel,
        templateStructure: Array.isArray(structure) ? structure : []
      });
      toast.success('Template saved');
      onSaved?.();
      onClose?.();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to save template');
    } finally {
      setSaving(false);
    }
  };

  const renderPreviewComponent = (item) => {
    const baseClass = "mb-2";
    switch (item.type) {
      case 'heading':
        return (
          <div key={item.id || Math.random()} className={baseClass}>
            <div
              className="text-xs font-bold text-gray-900"
              dangerouslySetInnerHTML={{ __html: item.label || '[Heading]' }}
            />
          </div>
        );
      case 'textField':
        return (
          <div key={item.id || Math.random()} className={baseClass}>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              {item.label || '[Field Label]'}
            </label>
            <div className="border border-gray-300 rounded px-1.5 py-0.5 bg-gray-50 text-gray-400 text-xs min-h-6" style={{ fontSize: '9px' }}>
              [Input field]
            </div>
          </div>
        );
      case 'textArea':
        return (
          <div key={item.id || Math.random()} className={baseClass}>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              {item.label || '[Text Area Label]'}
            </label>
            <div className="border border-gray-300 rounded px-1.5 py-0.5 bg-gray-50 text-gray-400 text-xs min-h-12" style={{ fontSize: '9px' }}>
              [Text area for multi-line input]
            </div>
          </div>
        );
      case 'findings':
        return (
          <div key={item.id || Math.random()} className={baseClass + " bg-blue-50 border-l-4 border-blue-400 p-1.5 rounded"}>
            <label className="block text-xs font-semibold text-blue-700 mb-1">
              {item.label || 'Findings'}
            </label>
            <div className="text-xs text-blue-600" style={{ fontSize: '9px' }}>[Findings content area]</div>
          </div>
        );
      case 'impression':
        return (
          <div key={item.id || Math.random()} className={baseClass + " bg-green-50 border-l-4 border-green-400 p-1.5 rounded"}>
            <label className="block text-xs font-semibold text-green-700 mb-1">
              {item.label || 'Impression'}
            </label>
            <div className="text-xs text-green-600" style={{ fontSize: '9px' }}>[Impression content area]</div>
          </div>
        );
      case 'recommendation':
        return (
          <div key={item.id || Math.random()} className={baseClass + " bg-amber-50 border-l-4 border-amber-400 p-1.5 rounded"}>
            <label className="block text-xs font-semibold text-amber-700 mb-1">
              {item.label || 'Recommendation'}
            </label>
            <div className="text-xs text-amber-600" style={{ fontSize: '9px' }}>[Recommendation content area]</div>
          </div>
        );
      case 'image':
        return (
          <div key={item.id || Math.random()} className={baseClass}>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              {item.label || 'Images'}
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded px-2 py-2 bg-gray-50 text-center text-gray-400 text-xs" style={{ fontSize: '9px' }}>
              [Image area - {item.multiple ? 'Multiple' : 'Single'}]
            </div>
          </div>
        );
      case 'divider':
        return (
          <div key={item.id || Math.random()} className={baseClass}>
            <hr className="border-t border-gray-300" />
          </div>
        );
      case 'blankSpace':
        return (
          <div
            key={item.id || Math.random()}
            className={baseClass}
            style={{ height: `${(item.height || 24) / 16}rem` }}
          />
        );
      default:
        return null;
    }
  };

  if (!test) return null;

  return (
    <div className="space-y-4 max-h-[90vh] overflow-y-auto">
      <div className="rounded-lg border border-orange-100 bg-orange-50/40 p-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Diagnosis Test</p>
            <p className="text-lg font-extrabold text-gray-900">{testLabel}</p>
            <p className="text-xs text-gray-600 mt-1">
              Build the report layout by adding components. Preview shows how the report will appear with lab header/footer.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="btn-secondary px-3 py-2 whitespace-nowrap"
            title="Toggle Preview"
          >
            <Eye className="h-4 w-4" /> Show Preview
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* Component palette */}
        <div className="rounded-lg border border-orange-100 bg-white p-4 space-y-3 max-h-[70vh] overflow-y-auto">
          <h3 className="font-extrabold text-gray-900">Components</h3>
          <div className="grid gap-2">
            {COMPONENTS.map((c) => (
              <button
                key={c.type}
                type="button"
                className="btn-secondary justify-start"
                onClick={() => addComponent(c.type)}
                disabled={!canEdit || loading}
              >
                <Plus className="h-4 w-4" /> {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Builder - Full Width */}
        <div className="rounded-lg border border-orange-100 bg-white p-4 space-y-4">
            <div className="flex items-end justify-end">
              <button className="btn" type="button" onClick={save} disabled={loading || saving || !canEdit}>
                <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save'}
              </button>
            </div>

            {loading ? (
              <div className="rounded-lg border border-dashed border-orange-200 bg-orange-50/50 p-8 text-center text-sm font-semibold text-gray-500">
                Loading template...
              </div>
            ) : structure.length === 0 ? (
              <div className="rounded-lg border border-dashed border-orange-200 bg-orange-50/50 p-8 text-center text-sm font-semibold text-gray-500">
                No components added yet. Add components from the left panel.
              </div>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                {structure.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="rounded-lg border border-orange-100 p-3 bg-white"
                    draggable
                    onDragStart={() => onDragStart(index)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => onDrop(index)}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold uppercase tracking-wide text-orange-600">{item.type}</p>
                        {(item.type === 'heading') && (
                          <div className="mt-2">
                            <RichTextEditor
                              value={item.label || ''}
                              onChange={(v) => updateItem(index, { label: v })}
                              minHeight={80}
                              disabled={!canEdit}
                            />
                          </div>
                        )}
                        {(['textField', 'textArea', 'findings', 'impression', 'recommendation'].includes(item.type)) && (
                          <div className="mt-2">
                            <label className="block">
                              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">Label</span>
                              <input
                                className="input"
                                value={item.label || ''}
                                onChange={(e) => updateItem(index, { label: e.target.value })}
                                disabled={!canEdit}
                                placeholder="e.g., Clinical History"
                              />
                            </label>
                          </div>
                        )}
                        {item.type === 'image' && (
                          <div className="mt-2 grid gap-3 sm:grid-cols-2">
                            <label className="block">
                              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">Label (optional)</span>
                              <input
                                className="input"
                                value={item.label || ''}
                                onChange={(e) => updateItem(index, { label: e.target.value })}
                                disabled={!canEdit}
                                placeholder="e.g., Images"
                              />
                            </label>
                            <label className="block">
                              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">Mode</span>
                              <select
                                className="input"
                                value={item.multiple ? 'multiple' : 'single'}
                                onChange={(e) => updateItem(index, { multiple: e.target.value === 'multiple' })}
                                disabled={!canEdit}
                              >
                                <option value="single">Single Image</option>
                                <option value="multiple">Multiple Images</option>
                              </select>
                            </label>
                          </div>
                        )}
                        {item.type === 'blankSpace' && (
                          <div className="mt-2 grid gap-3 sm:grid-cols-2">
                            <label className="block">
                              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">Height</span>
                              <select
                                className="input"
                                value={String(item.height ?? 24)}
                                onChange={(e) => updateItem(index, { height: Number(e.target.value) })}
                                disabled={!canEdit}
                              >
                                <option value="12">Small</option>
                                <option value="24">Medium</option>
                                <option value="48">Large</option>
                                <option value="72">Extra Large</option>
                              </select>
                            </label>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button type="button" className="btn-secondary" onClick={() => move(index, index - 1)} disabled={!canEdit || index === 0} title="Move up">
                          <ArrowUp className="h-4 w-4" />
                        </button>
                        <button type="button" className="btn-secondary" onClick={() => move(index, index + 1)} disabled={!canEdit || index === structure.length - 1} title="Move down">
                          <ArrowDown className="h-4 w-4" />
                        </button>
                        <button type="button" className="btn-secondary" onClick={() => remove(index)} disabled={!canEdit} title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                <p className="text-xs text-gray-500">Tip: drag-and-drop cards to reorder.</p>
              </div>
            )}
          </div>
        </div>

      {/* Preview Modal Dialog */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-6xl max-h-[95vh] bg-gray-100 rounded-lg shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-4 font-bold text-base flex items-center justify-between flex-shrink-0">
              <span>📄 A4 Paper Preview - {testLabel}</span>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="text-white hover:bg-orange-700/50 p-2 rounded transition"
                title="Close Preview"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content - A4 Paper */}
            <div className="flex-1 overflow-y-auto p-8 bg-gray-100">
              {/* A4 Paper Container - Fixed aspect ratio */}
              <div className="mx-auto bg-white shadow-2xl" style={{ width: '210mm', aspectRatio: '210/297' }}>
                {/* A4 Paper Content with margins (0.75 inch = 19mm) */}
                <div className="h-full overflow-hidden flex flex-col" style={{ padding: '19mm' }}>
                  <div className="flex-1 overflow-y-auto">
                    {/* HEADER SECTION - From Lab Profile */}
                    <div className="border-b-2 border-orange-300 pb-3 mb-4 text-center">
                      {labProfile?.logoUrl && (
                        <div className="mb-2 flex justify-center">
                          <img src={labProfile.logoUrl} alt="Lab Logo" className="h-10 object-contain" />
                        </div>
                      )}
                      <h1 className="text-sm font-extrabold text-gray-900">{labProfile?.name || 'Clinical Laboratory'}</h1>
                      <p className="text-xs text-gray-600 mt-0.5">{labProfile?.address || '123 Health Ave, Medical District'}</p>
                      <div className="flex justify-center gap-3 mt-1 text-xs text-gray-600">
                        {labProfile?.mobile && <span>📞 {labProfile.mobile}</span>}
                        {labProfile?.email && <span>✉️ {labProfile.email}</span>}
                      </div>
                    </div>

                    {/* REPORT TITLE */}
                    <div className="mb-4 text-center border-b border-orange-200 pb-2">
                      <h2 className="text-sm font-bold text-orange-700">{testLabel}</h2>
                    </div>

                    {/* TEMPLATE COMPONENTS PREVIEW */}
                    {structure.length === 0 ? (
                      <div className="text-center py-6 text-gray-400">
                        <p className="text-xs">Components will appear here as you add them</p>
                      </div>
                    ) : (
                      <div className="space-y-2 text-sm">
                        {structure.map((item) => renderPreviewComponent(item))}
                      </div>
                    )}

                    {/* FOOTER SECTION - From Lab Profile */}
                    {labProfile?.reportFooter && (
                      <div className="mt-4 pt-3 border-t-2 border-orange-300 text-xs text-gray-600">
                        <div
                          dangerouslySetInnerHTML={{ __html: labProfile.reportFooter }}
                          className="text-center space-y-1"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

