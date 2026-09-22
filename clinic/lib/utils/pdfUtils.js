// Utility helpers for browser-side PDF generation using html2canvas + jsPDF.
// These helpers sanitize the cloned DOM before html2canvas renders it so unsupported
// modern CSS color functions like lab() / oklch() / oklab() / color-mix() do not break the PDF generation flow.

const unsupportedColorPattern = /\b(?:oklch|oklab|lab|lch|color-mix|color)\([^)]*\)/gi;

export const hasUnsupportedCssColor = (value) => typeof value === 'string' && unsupportedColorPattern.test(value);

export const normalizeCssColor = (value) => {
  if (!value) return value;
  if (!hasUnsupportedCssColor(value)) return value;

  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '#4b5563';

    ctx.fillStyle = value;
    return ctx.fillStyle || '#4b5563';
  } catch (error) {
    return '#4b5563';
  }
};

export const normalizeCssValue = (value) => {
  if (!value || typeof value !== 'string' || !hasUnsupportedCssColor(value)) return value;
  return value.replace(unsupportedColorPattern, (match) => normalizeCssColor(match));
};

export const sanitizeClonedDocumentForPdf = (clonedDoc) => {
  if (!clonedDoc) return;

  try {
    // 1. Remove all external <link rel="stylesheet"> tags from cloned document to stop html2canvas from parsing modern lab()/oklch() rules
    const links = clonedDoc.querySelectorAll('link[rel="stylesheet"]');
    links.forEach((link) => {
      try { link.remove(); } catch (e) {}
    });

    // 2. Clean or remove all <style> tags containing modern CSS variables or lab()/oklch() functions
    const styleTags = clonedDoc.querySelectorAll('style');
    styleTags.forEach((styleTag) => {
      try {
        const text = styleTag.textContent || '';
        if (
          text.includes('lab(') ||
          text.includes('oklch(') ||
          text.includes('oklab(') ||
          text.includes('color-mix(') ||
          text.includes('color(') ||
          text.includes('--tw-')
        ) {
          styleTag.remove();
        } else {
          styleTag.textContent = text.replace(unsupportedColorPattern, '#4b5563');
        }
      } catch (e) {
        try { styleTag.remove(); } catch (err) {}
      }
    });

    // 3. Append clean standard print stylesheet
    if (clonedDoc.head) {
      const resetStyle = clonedDoc.createElement('style');
      resetStyle.textContent = `
        *, *::before, *::after {
          box-sizing: border-box !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          box-shadow: none !important;
          text-shadow: none !important;
          filter: none !important;
        }
        body {
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          color: #000000 !important;
          font-family: Arial, Helvetica, sans-serif !important;
        }
      `;
      clonedDoc.head.appendChild(resetStyle);
    }

    // 4. Sanitize inline styles on all cloned body elements
    if (clonedDoc.body) {
      const allElements = clonedDoc.body.querySelectorAll('*');
      allElements.forEach((el) => {
        try {
          const style = el.getAttribute('style');
          if (style && unsupportedColorPattern.test(style)) {
            el.setAttribute('style', style.replace(unsupportedColorPattern, '#000000'));
          }
          if (el.style) {
            if (el.style.boxShadow && el.style.boxShadow !== 'none') el.style.boxShadow = 'none';
            if (el.style.textShadow && el.style.textShadow !== 'none') el.style.textShadow = 'none';
            if (el.style.filter && el.style.filter !== 'none') el.style.filter = 'none';
          }
        } catch (e) {}
      });
    }
  } catch (err) {
    console.warn('Document sanitization for PDF notice:', err);
  }
};

export const openPdfPrintWindow = (pdf, title = 'Document') => {
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
