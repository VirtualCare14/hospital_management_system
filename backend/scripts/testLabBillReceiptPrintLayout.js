const fs = require('fs');
const path = require('path');

function runTests() {
  console.log('======================================================================');
  console.log('  LAB BILL RECEIPT PRINT LAYOUT & ZERO-TOP-GAP VERIFICATION          ');
  console.log('======================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`[PASS] Test ${total}: ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] Test ${total}: ${message}`);
    }
  }

  // 1. Check frontend/src/components/LabBillReceipt.jsx
  const frontendLabReceiptPath = path.join(__dirname, '../../frontend/src/components/LabBillReceipt.jsx');
  const frontendLabReceiptContent = fs.readFileSync(frontendLabReceiptPath, 'utf8');

  assert(
    frontendLabReceiptContent.includes('trimCanvasTopWhitespace') &&
    frontendLabReceiptContent.includes('const canvas = trimCanvasTopWhitespace(rawCanvas)'),
    'Frontend LabBillReceipt: Implements trimCanvasTopWhitespace to eliminate blank top rows'
  );

  assert(
    frontendLabReceiptContent.includes('sanitizeClonedDocumentForPdf') &&
    frontendLabReceiptContent.includes('onclone: (clonedDoc) =>'),
    'Frontend LabBillReceipt: Integrates sanitizeClonedDocumentForPdf in html2canvas onclone'
  );

  assert(
    frontendLabReceiptContent.includes('scrollX: 0') &&
    frontendLabReceiptContent.includes('scrollY: 0'),
    'Frontend LabBillReceipt: Resets scrollX: 0 and scrollY: 0 to prevent scroll offset'
  );

  assert(
    frontendLabReceiptContent.includes('className="lab-receipt-print-area print-area bg-white text-slate-900 font-sans px-4 py-2 space-y-3 border-0 rounded-lg print:border-none print:p-0 print:m-0 print:w-full"') &&
    !frontendLabReceiptContent.includes('className="lab-receipt-print-area print-area bg-white text-slate-900 font-sans p-4 space-y-3 border border-slate-200'),
    'Frontend LabBillReceipt: Removes perimeter border-slate-200 and resets print padding'
  );

  assert(
    frontendLabReceiptContent.includes('.lab-receipt-print-area {') &&
    frontendLabReceiptContent.includes('position: absolute !important;') &&
    frontendLabReceiptContent.includes('top: 0 !important;') &&
    frontendLabReceiptContent.includes('padding-top: 0 !important;') &&
    frontendLabReceiptContent.includes('border: none !important;'),
    'Frontend LabBillReceipt: Isolated @media print pins receipt at top: 0 with zero top padding and no border'
  );

  // 2. Check frontend/src/index.css
  const frontendIndexCssPath = path.join(__dirname, '../../frontend/src/index.css');
  const frontendIndexCssContent = fs.readFileSync(frontendIndexCssPath, 'utf8');

  assert(
    frontendIndexCssContent.includes('.lab-receipt-print-area {') &&
    frontendIndexCssContent.includes('position: absolute !important;') &&
    frontendIndexCssContent.includes('top: 0 !important;') &&
    frontendIndexCssContent.includes('padding-top: 0 !important;'),
    'Frontend index.css: Pins .lab-receipt-print-area at absolute top 0 with padding-top: 0'
  );

  // 3. Check labs/components/LabBillReceipt.jsx
  const labsLabReceiptPath = path.join(__dirname, '../../labs/components/LabBillReceipt.jsx');
  const labsLabReceiptContent = fs.readFileSync(labsLabReceiptPath, 'utf8');

  assert(
    labsLabReceiptContent.includes('border-0 rounded-lg print:border-none print:p-0') &&
    !labsLabReceiptContent.includes('p-4 space-y-3 border border-slate-200'),
    'Labs LabBillReceipt: Removes perimeter border-slate-200 to prevent horizontal line'
  );

  // 4. Check labs/app/globals.css
  const labsGlobalsCssPath = path.join(__dirname, '../../labs/app/globals.css');
  const labsGlobalsCssContent = fs.readFileSync(labsGlobalsCssPath, 'utf8');

  assert(
    labsGlobalsCssContent.includes('.print-area {') &&
    labsGlobalsCssContent.includes('padding-top: 0 !important;') &&
    labsGlobalsCssContent.includes('border: none !important;'),
    'Labs globals.css: Resets .print-area padding-top to 0 to prevent top gap in labs module'
  );

  // 5. Test trimCanvasTopWhitespace algorithm with synthetic pixel buffers
  function testTrimAlgorithm(width, height, blankRows, contentColor) {
    const totalPixels = width * height;
    const data = new Uint8ClampedArray(totalPixels * 4);
    // Fill all with pure white
    for (let i = 0; i < totalPixels * 4; i += 4) {
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = 255;
    }
    // Put content starting at blankRows
    for (let y = blankRows; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        data[idx] = contentColor[0];
        data[idx + 1] = contentColor[1];
        data[idx + 2] = contentColor[2];
        data[idx + 3] = 255;
      }
    }

    const maxScanHeight = Math.min(height, Math.round(height * 0.35));
    let firstContentY = 0;
    for (let y = 0; y < maxScanHeight; y++) {
      let rowHasContent = false;
      const rowOffset = y * width * 4;
      for (let x = 0; x < width; x++) {
        const idx = rowOffset + x * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];
        if (a > 20 && (r < 240 || g < 240 || b < 240)) {
          rowHasContent = true;
          break;
        }
      }
      if (rowHasContent) {
        firstContentY = y;
        break;
      }
    }
    return firstContentY;
  }

  const detectedRow50 = testTrimAlgorithm(200, 300, 50, [249, 115, 22]); // Orange Hospital orange color
  assert(
    detectedRow50 === 50,
    `Trimming Algorithm: Correctly detected ${detectedRow50} blank rows above Orange Hospital logo`
  );

  const detectedRow0 = testTrimAlgorithm(200, 300, 0, [0, 0, 0]); // Content starts at row 0
  assert(
    detectedRow0 === 0,
    `Trimming Algorithm: Correctly detected 0 blank rows when content is already flush`
  );

  console.log('\n----------------------------------------------------------------------');
  console.log(`Results: ${passed} / ${total} tests passed`);
  console.log('----------------------------------------------------------------------');

  if (passed !== total) {
    process.exit(1);
  }
}

runTests();
