// Utility helpers for browser-side PDF generation using html2canvas + jsPDF.
// These helpers sanitize the cloned DOM before html2canvas renders it so unsupported
// CSS color functions like oklch() / oklab() do not break the PDF generation flow.

const hasUnsupportedColorRegex = /\b(?:oklch|oklab|color-mix)\(/i;

export const hasUnsupportedCssColor = (value) => typeof value === 'string' && hasUnsupportedColorRegex.test(value);

const replaceUnsupportedColorFunctions = (value, replacer) => {
  if (!value || typeof value !== 'string' || !hasUnsupportedCssColor(value)) return value;

  let result = '';
  let i = 0;
  while (i < value.length) {
    const slice = value.slice(i);
    const match = slice.match(/\b(?:oklch|oklab|color-mix)\(/i);
    if (!match) {
      result += slice;
      break;
    }
    const start = i + match.index;
    result += value.slice(i, start);

    let depth = 0;
    let j = start + match[0].length - 1;
    for (; j < value.length; j += 1) {
      if (value[j] === '(') depth += 1;
      else if (value[j] === ')') {
        depth -= 1;
        if (depth === 0) {
          j += 1;
          break;
        }
      }
    }
    const fnCall = value.slice(start, j);
    result += replacer(fnCall);
    i = j;
  }
  return result;
};

export const normalizeCssColor = (value) => {
  if (!value) return value;
  if (!hasUnsupportedCssColor(value)) return value;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return '#888888';
  }

  try {
    ctx.fillStyle = '#010203';
    ctx.fillStyle = value;
    const resolved = ctx.fillStyle;
    if (resolved && !hasUnsupportedCssColor(resolved)) {
      return resolved;
    }
    return '#888888';
  } catch (error) {
    console.warn('PDF color normalization failed for', value, error);
    return '#888888';
  }
};

export const normalizeCssValue = (value) => {
  if (!value || !hasUnsupportedCssColor(value)) return value;
  return replaceUnsupportedColorFunctions(value, (match) => normalizeCssColor(match));
};

const styleOverrideText = `
  *, *::before, *::after {
    --tw-ring-color: #93c5fd !important;
    --tw-shadow-color: #000000 !important;
    box-shadow: none !important;
    text-shadow: none !important;
    filter: none !important;
  }
  :root {
    --p: #f97316 !important;
    --pf: #ea6a0a !important;
    --pc: #ffffff !important;
    --s: #6366f1 !important;
    --sf: #4f46e5 !important;
    --sc: #ffffff !important;
    --a: #10b981 !important;
    --af: #059669 !important;
    --ac: #ffffff !important;
    --n: #374151 !important;
    --nf: #1f2937 !important;
    --nc: #ffffff !important;
    --b1: #ffffff !important;
    --b2: #f9fafb !important;
    --b3: #f3f4f6 !important;
    --bc: #1f2937 !important;
    --in: #3b82f6 !important;
    --inc: #ffffff !important;
    --su: #10b981 !important;
    --suc: #ffffff !important;
    --wa: #f59e0b !important;
    --wac: #ffffff !important;
    --er: #ef4444 !important;
    --erc: #ffffff !important;
  }
`;

const sanitizeNodeStyles = (node) => {
  if (!(node instanceof HTMLElement || node instanceof SVGElement)) return;

  const attributeKeys = ['fill', 'stroke', 'stop-color', 'flood-color', 'lighting-color'];
  attributeKeys.forEach((attr) => {
    const value = node.getAttribute(attr);
    if (value && hasUnsupportedCssColor(value)) {
      node.setAttribute(attr, normalizeCssValue(value));
    }
  });

  const inlineStyle = node.getAttribute('style');
  if (inlineStyle && hasUnsupportedCssColor(inlineStyle)) {
    node.setAttribute('style', normalizeCssValue(inlineStyle));
  }

  const view = node.ownerDocument?.defaultView || window;
  const computedStyle = view.getComputedStyle(node);
  const explicitColorProps = [
    'color',
    'background-color',
    'background-image',
    'border-top-color',
    'border-right-color',
    'border-bottom-color',
    'border-left-color',
    'outline-color',
    'text-decoration-color',
    'fill',
    'stroke'
  ];

  explicitColorProps.forEach((prop) => {
    const value = computedStyle.getPropertyValue(prop);
    if (value && hasUnsupportedCssColor(value)) {
      try {
        node.style.setProperty(prop, normalizeCssValue(value));
      } catch (error) {
        // Ignore invalid writable properties.
      }
    }
  });

  for (let i = 0; i < computedStyle.length; i += 1) {
    const prop = computedStyle[i];
    const value = computedStyle.getPropertyValue(prop);
    if (value && hasUnsupportedCssColor(value)) {
      try {
        node.style.setProperty(prop, normalizeCssValue(value));
      } catch (error) {
        // Ignore invalid writable properties and continue sanitizing the rest.
      }
    }
  }

  if (node.style.boxShadow && node.style.boxShadow !== 'none') {
    node.style.boxShadow = 'none';
  }
  if (node.style.textShadow && node.style.textShadow !== 'none') {
    node.style.textShadow = 'none';
  }
  if (node.style.filter && node.style.filter !== 'none') {
    node.style.filter = 'none';
  }
};

export const sanitizeClonedDocumentForPdf = (clonedDoc) => {
  if (!clonedDoc || !clonedDoc.body || !clonedDoc.head) return;

  clonedDoc.querySelectorAll('style').forEach((styleEl) => {
    if (styleEl.textContent && hasUnsupportedCssColor(styleEl.textContent)) {
      styleEl.textContent = normalizeCssValue(styleEl.textContent);
    }
  });

  const styleOverride = clonedDoc.createElement('style');
  styleOverride.textContent = styleOverrideText;
  clonedDoc.head.appendChild(styleOverride);

  const nodes = [clonedDoc.body, ...clonedDoc.body.querySelectorAll('*')];
  nodes.forEach(sanitizeNodeStyles);
};

export const openPdfPrintWindow = (pdf, title = 'Prescription / Consultation') => {
  try {
    const blob = pdf.output('blob');
    const blobUrl = URL.createObjectURL(blob);

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${title}</title>
            <style>
              html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #525659; }
              iframe { width: 100%; height: 100%; border: none; }
            </style>
          </head>
          <body>
            <iframe src="${blobUrl}"></iframe>
            <script>
              const frame = document.querySelector('iframe');
              frame.onload = function() {
                try {
                  frame.contentWindow.focus();
                  frame.contentWindow.print();
                } catch (e) {}
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
    } else {
      // Hidden iframe fallback if popups are blocked
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.src = blobUrl;
      document.body.appendChild(iframe);
      iframe.onload = () => {
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        } catch (e) {}
        setTimeout(() => {
          try {
            document.body.removeChild(iframe);
          } catch (e) {}
        }, 5000);
      };
    }
  } catch (err) {
    console.error('Failed to open PDF print window:', err);
  }
};

