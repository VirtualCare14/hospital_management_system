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
