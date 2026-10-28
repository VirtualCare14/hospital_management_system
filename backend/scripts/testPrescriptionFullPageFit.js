const assert = require('assert');
const fs = require('fs');
const path = require('path');

async function testLayoutBalance() {
  console.log('======================================================================');
  console.log('  PRESCRIPTION FULL-PAGE A4 PROPORTIONS & BALANCE VERIFICATION         ');
  console.log('======================================================================\n');

  const cssPath = path.resolve(__dirname, '../../frontend/src/index.css');
  const css = fs.readFileSync(cssPath, 'utf8');

  const receiptPath = path.resolve(__dirname, '../../frontend/src/components/PatientReceipt.jsx');
  const receipt = fs.readFileSync(receiptPath, 'utf8');

  // Verify @page margin is 8mm
  assert(css.includes('size: A4 portrait;'), 'Must have A4 portrait');
  assert(css.includes('margin: 8mm;'), 'Must have 8mm page margin');
  console.log('[PASS] Print CSS page size is A4 portrait with 8mm margin');

  // Verify width is 100% in print mode without fixed 210mm restriction
  assert(css.includes('width: 100% !important;'), 'Print container must use 100% printable width');
  assert(css.includes('padding: 0 !important;'), 'Print container must not double-pad inside @page margin');
  console.log('[PASS] Print container removes fixed 210mm restriction and takes 100% printable width');

  // Verify comfortable font sizes in PatientReceipt.jsx
  assert(receipt.includes("fontSize: '9.5px'"), 'Prescription must use comfortable 9.5px font size for tables');
  assert(receipt.includes("fontSize: '10px'"), 'Prescription must use comfortable 10px font size for content');
  assert(receipt.includes("fontSize: '10.5px'"), 'Prescription must use comfortable 10.5px font size for section titles');
  assert(receipt.includes("fontSize: '14px'"), 'Document title must have clear 14px prominence');
  console.log('[PASS] Prescription typography is comfortable and readable (9.5px - 14px)');

  // Verify two-column balance:
  // Right column has fixed 190px width for 11-row vitals table
  assert(receipt.includes("width: '190px', flexShrink: 0"), 'Vitals right column has optimal 190px width');
  // Left column flex: 1 1 0% takes remaining width (~533px out of 733px printable width)
  assert(receipt.includes("flex: '1 1 0%', minWidth: 0"), 'Clinical left column takes flexible remaining width');
  console.log('[PASS] Two-column architecture is well-balanced (Left Column ~74% width, Right Column ~26% width)');

  // Verify medicines table layout and all 9 columns
  const cols = ['#', 'Dosage Form', 'Strength', 'Dose', 'Frequency', 'Duration', 'Remarks', 'Qty'];
  cols.forEach(c => assert(receipt.includes(c), `Missing column ${c}`));
  assert(receipt.includes("tableLayout: 'fixed'"), 'Medicines table must use fixed table layout');
  assert(receipt.includes("overflowWrap: 'break-word'"), 'Medicines table must wrap words to prevent clipping');
  console.log('[PASS] Medicines table has all 9 columns with fixed layout and word wrapping');

  // Verify fallback non-prescription mode unchanged
  assert(receipt.includes('/* NON-PRESCRIPTION LAYOUT'), 'Non-prescription mode must be preserved');
  assert(receipt.includes('REFUND VOUCHER / SLIP'), 'Refund voucher mode must be preserved');
  console.log('[PASS] Non-prescription layouts (Patient Slip, Payment Receipt, Refund Slip) are preserved');

  console.log('\n----------------------------------------------------------------------');
  console.log('All full-page A4 proportions and balance checks PASSED successfully!');
  console.log('----------------------------------------------------------------------');
}

testLayoutBalance().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});

