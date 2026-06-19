// Utility helpers for browser-side PDF generation using html2canvas + jsPDF.
// These helpers sanitize the cloned DOM before html2canvas renders it so unsupported
// CSS color functions like oklch() / oklab() do not break the PDF generation flow.

const unsupportedColorPattern = /\b(?:oklch|oklab)\([^)]*\)/gi;

export const hasUnsupportedCssColor = (value) => typeof value === 'string' && unsupportedColorPattern.test(value);

export const normalizeCssColor = (value) => {
  if (!value) return value;
  if (!hasUnsupportedCssColor(value)) return value;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return '#888888';
  }

  try {
    ctx.fillStyle = value;
    return ctx.fillStyle || '#888888';
  } catch (error) {
    console.warn('PDF color normalization failed for', value, error);
    return '#888888';
  }
};

export const normalizeCssValue = (value) => {
  if (!value || !hasUnsupportedCssColor(value)) return value;
  return value.replace(unsupportedColorPattern, (match) => normalizeCssColor(match));
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
  if (inlineStyle && unsupportedColorPattern.test(inlineStyle)) {
    node.setAttribute('style', normalizeCssValue(inlineStyle));
  }

  const computedStyle = window.getComputedStyle(node);
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

  const styleOverride = clonedDoc.createElement('style');
  styleOverride.textContent = styleOverrideText;
  clonedDoc.head.appendChild(styleOverride);

  const nodes = [clonedDoc.body, ...clonedDoc.body.querySelectorAll('*')];
  nodes.forEach(sanitizeNodeStyles);
};
