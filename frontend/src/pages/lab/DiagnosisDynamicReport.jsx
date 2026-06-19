import { ArrowDown, ArrowUp, Trash2, Upload } from 'lucide-react';
import RichTextEditor from '../../components/RichTextEditor.jsx';

const safeHtml = (html) => ({ __html: html || '' });

const normalizeImages = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  // allow single object
  return [value].filter(Boolean);
};

export default function DiagnosisDynamicReport({
  template,
  value,
  onChange,
  disabled = false,
  onUploadImages,
  onDeleteImage
}) {
  const structure = template?.templateStructure || [];

  const setField = (fieldId, fieldValue) => {
    onChange?.({ ...(value || {}), [fieldId]: fieldValue });
  };

  const addImages = async (fieldId, files, multiple) => {
    if (!files?.length) return;
    const uploaded = await onUploadImages?.(files);
    if (!uploaded?.length) return;

    const existing = normalizeImages(value?.[fieldId]);
    const next = multiple ? [...existing, ...uploaded] : [uploaded[0]];
    setField(fieldId, next);
  };

  const removeImage = async (fieldId, imageIndex) => {
    const existing = normalizeImages(value?.[fieldId]);
    const img = existing[imageIndex];
    if (!img) return;

    if (img.publicId) {
      await onDeleteImage?.(img.publicId);
    }

    const next = existing.filter((_, i) => i !== imageIndex);
    setField(fieldId, next);
  };

  const moveImage = (fieldId, from, to) => {
    const existing = normalizeImages(value?.[fieldId]);
    if (to < 0 || to >= existing.length) return;
    const next = [...existing];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setField(fieldId, next);
  };

  if (!template) {
    return (
      <div className="rounded-lg border border-dashed border-orange-200 bg-orange-50/50 p-6 text-center text-sm font-semibold text-gray-500">
        No Diagnosis template configured for this test.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {structure.map((item, index) => {
        const id = item.id || `${item.type}_${index}`;
        const label = item.label || '';

        if (item.type === 'divider') {
          return <hr key={id} className="border-orange-100" />;
        }

        if (item.type === 'blankSpace') {
          return <div key={id} style={{ height: Number(item.height || 24) }} />;
        }

        if (item.type === 'heading') {
          return (
            <div key={id} className="pt-2">
              <div className="text-base font-extrabold text-gray-900" dangerouslySetInnerHTML={safeHtml(label)} />
            </div>
          );
        }

        if (item.type === 'textField') {
          return (
            <label key={id} className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">{label || 'Text'}</span>
              {disabled ? (
                <div className="rounded-lg border border-orange-100 bg-gray-50 p-3 text-sm text-gray-800">
                  {value?.[id] || '-'}
                </div>
              ) : (
                <input
                  className="input"
                  value={value?.[id] || ''}
                  onChange={(e) => setField(id, e.target.value)}
                  disabled={disabled}
                />
              )}
            </label>
          );
        }

        if (['textArea', 'findings', 'impression', 'recommendation'].includes(item.type)) {
          const title = label || item.type;
          const v = value?.[id] || '';
          return (
            <div key={id} className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{title}</p>
              {disabled ? (
                <div className="rounded-lg border border-orange-100 bg-gray-50 p-3 text-sm text-gray-800" dangerouslySetInnerHTML={safeHtml(v)} />
              ) : (
                <RichTextEditor value={v} onChange={(next) => setField(id, next)} minHeight={140} />
              )}
            </div>
          );
        }

        if (item.type === 'image') {
          const images = normalizeImages(value?.[id]);
          const multiple = Boolean(item.multiple);
          return (
            <div key={id} className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{label || 'Images'}</p>
                {!disabled && (
                  <label className="btn-secondary cursor-pointer">
                    <Upload className="h-4 w-4" /> Upload {multiple ? 'Images' : 'Image'}
                    <input
                      type="file"
                      accept="image/*"
                      multiple={multiple}
                      className="hidden"
                      onChange={(e) => addImages(id, Array.from(e.target.files || []), multiple)}
                    />
                  </label>
                )}
              </div>

              {images.length === 0 ? (
                <div className="rounded-lg border border-dashed border-orange-200 bg-orange-50/30 p-4 text-center text-xs font-semibold text-gray-500">
                  No images uploaded.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {images.map((img, imgIndex) => (
                    <div key={`${img.publicId || img.url}_${imgIndex}`} className="rounded-lg border border-orange-100 p-2 bg-white">
                      <img src={img.url} alt="Upload" className="h-44 w-full object-cover rounded" />
                      {!disabled && (
                        <div className="flex items-center gap-2 mt-2">
                          <button type="button" className="btn-secondary" onClick={() => moveImage(id, imgIndex, imgIndex - 1)} disabled={imgIndex === 0}>
                            <ArrowUp className="h-4 w-4" />
                          </button>
                          <button type="button" className="btn-secondary" onClick={() => moveImage(id, imgIndex, imgIndex + 1)} disabled={imgIndex === images.length - 1}>
                            <ArrowDown className="h-4 w-4" />
                          </button>
                          <button type="button" className="btn-secondary ml-auto" onClick={() => removeImage(id, imgIndex)}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        }

        // Unknown type: ignore safely
        return null;
      })}
    </div>
  );
}
