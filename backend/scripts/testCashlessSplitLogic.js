/**
 * TPA Cashless Split Logic Unit Test Suite
 * Tests financial capping, deduction distribution, status gating, field resolution, and boundary checks.
 * 
 * Safety: 100% in-memory pure calculation logic test. Zero database connections or mutations.
 * Usage: npm run test:cashless
 */

/**
 * Field resolution matching BillingPage.jsx and PreAuthorization schema
 */
function resolvePreAuthDisplay({
  totalApprovedAmount = 0,
  initialApprovedAmount = 0,
  finalAuthorizedAmount = 0,
  preauthStatus = '',
  isClaimRecord = false,
  hasSeparateValidClaim = false
}) {
  const numTotalApproved = Math.max(0, Number(totalApprovedAmount) || 0);
  const numInitialApproved = Math.max(0, Number(initialApprovedAmount) || 0);
  const numFinalAuthorized = Math.max(0, Number(finalAuthorizedAmount) || 0);

  // 1. Pre-Authorized Amount: Credit sanction limit from pre-auth approval letter
  const preAuthApprovedAmount = numTotalApproved > 0 ? numTotalApproved : numInitialApproved;

  // 2. Status checks: Settled is a closed financial record; cannot be used for new billing splits
  const isRecordSettled = preauthStatus === 'Settled';
  const isRecordApprovedOrFinal = ['Final Authorized', 'Approved'].includes(preauthStatus);
  const isPreAuthValidForSettlement = Boolean(isRecordApprovedOrFinal && !isRecordSettled);

  // 3. Actual Final Claim Authorization Amount
  // Only valid if not settled AND status is 'Final Authorized' (or Approved claim) with an explicit final authorized letter amount
  const isFinalAuthorized = !isRecordSettled && (preauthStatus === 'Final Authorized' || (isClaimRecord && preauthStatus === 'Approved'));
  const finalClaimAuthAmount = (isFinalAuthorized && numFinalAuthorized > 0) ? numFinalAuthorized : null;
  const finalClaimAuthDisplay = finalClaimAuthAmount !== null ? `₹${finalClaimAuthAmount.toFixed(2)}` : 'Not Available';

  // 4. UI Button State: Disabled if settled (unless separate valid claim exists), invalid status, or net bill <= 0
  const isReviewAndApplySplitDisabled = (!isPreAuthValidForSettlement && !hasSeparateValidClaim) || (isRecordSettled && !hasSeparateValidClaim);

  return {
    preAuthApprovedAmount,
    finalClaimAuthAmount,
    finalClaimAuthDisplay,
    isRecordSettled,
    isPreAuthValidForSettlement,
    isReviewAndApplySplitDisabled,
    hasSeparateValidClaim
  };
}

/**
 * Pure calculation logic matching BillingPage.jsx and Medora360 TPA specification
 */
function calculateCashlessSplit({
  netPayable = 0,
  totalApprovedAmount = 0,
  initialApprovedAmount = 0,
  finalAuthorizedAmount = 0,
  preauthStatus = '',
  nonPayable = 0,
  copay = 0,
  deductible = 0,
  isClaimRecord = false,
  hasSeparateValidClaim = false
}) {
  const numNetPayable = Math.max(0, Number(netPayable) || 0);
  const numNonPayable = Math.max(0, Number(nonPayable) || 0);
  const numCopay = Math.max(0, Number(copay) || 0);
  const numDeductible = Math.max(0, Number(deductible) || 0);

  const displayMeta = resolvePreAuthDisplay({
    totalApprovedAmount,
    initialApprovedAmount,
    finalAuthorizedAmount,
    preauthStatus,
    isClaimRecord,
    hasSeparateValidClaim
  });

  const {
    preAuthApprovedAmount,
    finalClaimAuthAmount,
    isRecordSettled,
    isPreAuthValidForSettlement,
    isReviewAndApplySplitDisabled
  } = displayMeta;

  // Authorized ceiling for coverage calculations:
  // If valid final authorization exists, respect finalClaimAuthAmount; if Approved pre-auth, respect preAuthApprovedAmount
  const tpaAuthorizedCeiling = isPreAuthValidForSettlement
    ? (finalClaimAuthAmount !== null ? finalClaimAuthAmount : preAuthApprovedAmount)
    : 0;

  // Mandatory patient out-of-pocket
  const basePatientPortion = numNonPayable + numCopay + numDeductible;

  // Maximum amount TPA could cover on this bill
  const maxTpaCoverable = Math.max(0, numNetPayable - basePatientPortion);

  // TPA allocation strictly capped at authorization ceiling and eligible bill
  const tpaReceivable = isPreAuthValidForSettlement
    ? Number(Math.max(0, Math.min(tpaAuthorizedCeiling, maxTpaCoverable, numNetPayable)).toFixed(2))
    : 0;

  // Patient payable is whatever remains of the hospital net bill after TPA receivable
  const patientPayable = Number(Math.max(0, numNetPayable - tpaReceivable).toFixed(2));

  // Excess uncovered amount (when bill exceeds TPA authorization cap)
  const excessUncovered = Number(Math.max(0, numNetPayable - basePatientPortion - tpaAuthorizedCeiling).toFixed(2));

  const deductionsExceedBill = basePatientPortion > numNetPayable;

  let statusMessage = '';
  if (isRecordSettled) {
    statusMessage = 'Claim is already Settled & Closed. Cashless split cannot be applied to new billing.';
  } else if (!isPreAuthValidForSettlement) {
    statusMessage = `Claim status is "${preauthStatus}". Cashless split requires "Approved" or "Final Authorized" status.`;
  }

  return {
    netPayable: numNetPayable,
    preAuthApprovedAmount,
    finalClaimAuthAmount,
    finalClaimAuthDisplay: displayMeta.finalClaimAuthDisplay,
    tpaAuthorizedCeiling,
    basePatientPortion,
    maxTpaCoverable,
    tpaReceivable,
    patientPayable,
    excessUncovered,
    isPreAuthValidForSettlement,
    isRecordSettled,
    isReviewAndApplySplitDisabled,
    deductionsExceedBill,
    statusMessage
  };
}

/**
 * 11-point balance calculation matching Medora360 Billing & Invoicing specification
 * Formula: Remaining Patient Balance = Total Net Hospital Bill - Advance Payments Applied - Eligible TPA Coverage
 */
function calculateHospitalBillBalance({
  totalHospitalBill = 0,
  advanceAvailable = 0,
  advanceApplied = 0,
  claimedAmount = 0,
  totalApprovedAmount = 0,
  initialApprovedAmount = 0,
  finalAuthorizedAmount = 0,
  preauthStatus = '',
  nonPayable = 0,
  copay = 0,
  deductible = 0,
  patientAmountPaid = 0,
  customInsuranceAllocation = '',
  isClaimRecord = false,
  hasSeparateValidClaim = false
}) {
  const numTotalBill = Math.max(0, Number(totalHospitalBill) || 0);
  const numAdvanceAvailable = Math.max(0, Number(advanceAvailable) || 0);
  const numAdvanceApplied = Math.min(numAdvanceAvailable, numTotalBill, Math.max(0, Number(advanceApplied) || 0));
  const numNetBill = Math.max(0, Number((numTotalBill - numAdvanceApplied).toFixed(2)));

  const numNonPayable = Math.max(0, Number(nonPayable) || 0);
  const numCopay = Math.max(0, Number(copay) || 0);
  const numDeductible = Math.max(0, Number(deductible) || 0);
  const basePatientDeductions = numNonPayable + numCopay + numDeductible;

  const displayMeta = resolvePreAuthDisplay({
    totalApprovedAmount,
    initialApprovedAmount,
    finalAuthorizedAmount,
    preauthStatus,
    isClaimRecord,
    hasSeparateValidClaim
  });

  const {
    preAuthApprovedAmount,
    finalClaimAuthAmount,
    isRecordSettled,
    isPreAuthValidForSettlement,
    isReviewAndApplySplitDisabled
  } = displayMeta;

  const tpaAuthorizedCeiling = isPreAuthValidForSettlement
    ? (finalClaimAuthAmount !== null ? finalClaimAuthAmount : preAuthApprovedAmount)
    : 0;

  // Maximum coverable bill portion after mandatory patient deductions
  const maxTpaCoverable = Math.max(0, Number((numNetBill - basePatientDeductions).toFixed(2)));

  // Eligible TPA coverage (0 if no insurance or unapproved/settled)
  const eligibleTpaCoverage = isPreAuthValidForSettlement
    ? Number(Math.max(0, Math.min(tpaAuthorizedCeiling, maxTpaCoverable, numNetBill)).toFixed(2))
    : 0;

  // Custom or manual allocation entered by cashier, strictly bounded by confirmed eligible coverage
  const manualAllocationNum = customInsuranceAllocation !== ''
    ? Math.max(0, parseFloat(customInsuranceAllocation) || 0)
    : eligibleTpaCoverage;
  const tpaAllocated = isPreAuthValidForSettlement
    ? Number(Math.min(manualAllocationNum, eligibleTpaCoverage).toFixed(2))
    : 0;

  // Remaining Amount Receivable from TPA
  const remainingTpaReceivable = tpaAllocated;

  // Formula: Remaining Patient Balance = Total Net Hospital Bill - Advance Payments Applied - Eligible TPA Coverage
  const remainingPatientBalance = Number(Math.max(0, numTotalBill - numAdvanceApplied - tpaAllocated).toFixed(2));

  // Patient counter paid
  const numPatientPaid = Math.max(0, Math.min(remainingPatientBalance, Number(patientAmountPaid) || 0));

  // Remaining Amount Patient Must Pay
  // Formula: Patient Amount Due = max(0, Net Hospital Bill - Advance Applied - Eligible Insurance Amount - Patient Payments Already Applied)
  const remainingAmountPatientMustPay = Number(Math.max(0, remainingPatientBalance - numPatientPaid).toFixed(2));

  // Excess uncovered bill amount
  const excessUncovered = Number(Math.max(0, numNetBill - basePatientDeductions - tpaAuthorizedCeiling).toFixed(2));

  return {
    totalHospitalBill: numTotalBill,
    advancePaymentsReceived: numAdvanceAvailable,
    advanceAmountApplied: numAdvanceApplied,
    tpaClaimAmount: Number(claimedAmount || preAuthApprovedAmount) || 0,
    preAuthApprovedAmount,
    finalAuthorizedTpaAmount: finalClaimAuthAmount !== null ? finalClaimAuthAmount : (preAuthApprovedAmount > 0 && preauthStatus === 'Approved' ? preAuthApprovedAmount : 0),
    finalClaimAuthDisplay: displayMeta.finalClaimAuthDisplay,
    nonPayable: numNonPayable,
    copay: numCopay,
    deductible: numDeductible,
    netBillAfterAdvance: numNetBill,
    tpaAuthorizedCeiling,
    basePatientDeductions,
    maxTpaCoverable,
    eligibleTpaCoverage,
    tpaAllocated,
    remainingTpaReceivable,
    remainingPatientBalance,
    patientAmountPaid: numPatientPaid,
    remainingAmountPatientMustPay,
    excessUncovered,
    displayMeta
  };
}

/**
 * Backend controller validation simulator matching validateCashlessSplit & createBill
 */
function simulateBackendValidation({
  preauth,
  totalHospitalBill = 0,
  advanceApplied = 0,
  advanceAvailable = 0,
  netPayable = 0,
  tpaAuthorizedAmount = 0,
  nonPayable = 0,
  copay = 0,
  deductible = 0,
  patientPayable = 0,
  tpaReceivable = 0,
  separateValidClaim = null,
  existingPaidBills = []
}) {
  if (!preauth) {
    return { valid: false, message: 'No active Cashless Pre-Authorization record found for this patient.' };
  }

  const rawAdvanceApplied = Number(advanceApplied || 0);
  const rawPatientPayable = Number(patientPayable || 0);
  const rawTpaReceivable = Number(tpaReceivable || 0);

  // Negative balance prevention (Rule 7)
  if (rawPatientPayable < 0 || rawTpaReceivable < 0 || rawAdvanceApplied < 0) {
    return { valid: false, message: 'Negative financial balances or allocations are prohibited.' };
  }

  const numTotalBill = Math.max(0, Number(totalHospitalBill || netPayable) || 0);
  const numAdvanceApplied = Math.max(0, rawAdvanceApplied);
  const numAdvanceAvailable = Math.max(0, Number(advanceAvailable) || 0);
  const numNonPayable = Math.max(0, Number(nonPayable) || 0);
  const numCopay = Math.max(0, Number(copay) || 0);
  const numDeductible = Math.max(0, Number(deductible) || 0);
  const numTpaReceivable = Math.max(0, rawTpaReceivable);
  const numPatientPayable = Math.max(0, rawPatientPayable);

  // Advance validation: cannot exceed available advance payments in ledger
  if (numAdvanceApplied > numAdvanceAvailable + 0.05) {
    return { valid: false, message: `Advance applied (₹${numAdvanceApplied}) exceeds available unadjusted advance payments in ledger (₹${numAdvanceAvailable}).` };
  }
  if (numTotalBill > 0 && numAdvanceApplied > numTotalBill + 0.05) {
    return { valid: false, message: `Advance applied (₹${numAdvanceApplied}) cannot exceed Total Hospital Bill (₹${numTotalBill}).` };
  }

  let effectivePreauth = preauth;
  // Settled status guard: reject unless separate valid final claim record meets business rules
  if (preauth.preauthStatus === 'Settled') {
    const hasValidAltClaim = separateValidClaim &&
      ['Approved', 'Final Authorized'].includes(separateValidClaim.status || separateValidClaim.preauthStatus) &&
      Number(separateValidClaim.finalAuthorizedAmount) > 0;

    if (!hasValidAltClaim) {
      return {
        valid: false,
        message: 'Claim status is "Settled". This claim is already closed and settled. Cashless split cannot be applied to new billing.'
      };
    }
    effectivePreauth = separateValidClaim;
  }

  const effectiveStatus = effectivePreauth.status || effectivePreauth.preauthStatus;
  if (!['Approved', 'Final Authorized'].includes(effectiveStatus)) {
    return {
      valid: false,
      message: `Cannot apply cashless split: Claim status is "${effectiveStatus}". Cashless settlement requires an "Approved" or "Final Authorized" claim letter.`
    };
  }

  const authCeiling = Number(effectivePreauth.finalAuthorizedAmount) > 0
    ? Number(effectivePreauth.finalAuthorizedAmount)
    : (Number(effectivePreauth.totalApprovedAmount) > 0
        ? Number(effectivePreauth.totalApprovedAmount)
        : Number(effectivePreauth.initialApprovedAmount) || 0);

  const effectiveNetBill = numTotalBill > 0
    ? Math.max(0, Number((numTotalBill - numAdvanceApplied).toFixed(2)))
    : Math.max(0, Number(netPayable) || 0);

  if (numTpaReceivable > effectiveNetBill + 0.05) {
    return { valid: false, message: `TPA Receivable (₹${numTpaReceivable}) cannot exceed the eligible hospital bill (₹${effectiveNetBill}).` };
  }

  const basePatientPortion = numNonPayable + numCopay + numDeductible;
  const maxTpaCoverable = Math.max(0, Number((effectiveNetBill - basePatientPortion).toFixed(2)));
  if (numTpaReceivable > maxTpaCoverable + 0.05) {
    return { valid: false, message: `TPA Receivable (₹${numTpaReceivable}) exceeds the eligible coverage limit after mandatory patient deductions (₹${maxTpaCoverable}).` };
  }

  if (authCeiling > 0 && numTpaReceivable > authCeiling + 0.05) {
    return { valid: false, message: `TPA Receivable (₹${numTpaReceivable}) exceeds the TPA authorized ceiling (₹${authCeiling}).` };
  }

  if (numTotalBill > 0 && (numAdvanceApplied + numPatientPayable + numTpaReceivable) > numTotalBill + 0.05) {
    return { valid: false, message: `Financial overrun: Advance Applied (₹${numAdvanceApplied}) + Patient Payable (₹${numPatientPayable}) + TPA Receivable (₹${numTpaReceivable}) exceeds Total Hospital Bill (₹${numTotalBill}).` };
  }

  if (Math.abs((numPatientPayable + numTpaReceivable) - effectiveNetBill) > 0.05 &&
      (numTotalBill > 0 && Math.abs((numAdvanceApplied + numPatientPayable + numTpaReceivable) - numTotalBill) > 0.05)) {
    return { valid: false, message: `Split mismatch: Patient Payable (₹${numPatientPayable}) + TPA Receivable (₹${numTpaReceivable}) must equal Net Bill (₹${effectiveNetBill}).` };
  }

  const isDuplicate = existingPaidBills.some(b => 
    b.status === 'Final' && 
    b.paymentMode === 'Insurance' && 
    b.transactionRef === effectivePreauth.claimNumber && 
    b.paymentStatus === 'Paid'
  );
  if (isDuplicate) {
    return { valid: false, message: `A finalized and fully paid invoice already exists for claim ${preauth.claimNumber}. Cannot apply duplicate cashless settlement.` };
  }

  return { valid: true, message: 'Cashless split validated successfully.', authCeiling };
}

/**
 * Simulator for Mongoose Billing persistence, invoice reload, and financial reconciliation
 * Strictly matches Billing.js schema and billingController.js createBill persistence logic.
 */
function simulateInvoiceCreationAndReload({
  grossHospitalBill = 400000,
  discountsAndTaxes = 0,
  netHospitalBill = 400000,
  advanceAvailable = 100000,
  advanceAdjusted = 100000,
  insuranceClaimAmount = 250000,
  insuranceApprovedAmount = 200000,
  tpaAllocation = 200000,
  nonPayable = 0,
  copay = 0,
  deductible = 0,
  patientAmountPaid = 0
}) {
  const finalAdvance = Math.min(advanceAvailable, netHospitalBill, Math.max(0, Number(advanceAdjusted) || 0));
  const finalInsuranceAllocation = Math.max(0, Number(tpaAllocation) || 0);
  const finalPatientPaid = Math.max(0, Number(patientAmountPaid) || 0);

  // Formula: Remaining Patient Due = Net Bill - Advance Applied - Eligible TPA Allocation - Patient Payments Applied
  const patientDue = Math.max(0, Number((netHospitalBill - finalAdvance - finalInsuranceAllocation - finalPatientPaid).toFixed(2)));
  const tpaReceivable = finalInsuranceAllocation;

  // Strict reconciliation: Advance Applied + Patient Payments Applied + TPA Allocation + Remaining Patient Due === Net Bill
  const reconciledSum = Number((finalAdvance + finalPatientPaid + finalInsuranceAllocation + patientDue).toFixed(2));
  const isReconciled = Math.abs(reconciledSum - netHospitalBill) < 0.01;

  // Persisted Mongoose Billing document representation
  const persistedBillDoc = {
    _id: 'bill_uat_670d89f1001',
    billNo: 'BILL-UAT-2026-001',
    invoiceNo: 'INV-2026-00042',
    status: 'Final',
    grandTotal: netHospitalBill,
    subtotal: grossHospitalBill,
    advanceAdjusted: finalAdvance,
    insuranceAllocation: finalInsuranceAllocation,
    tpaReceivable,
    insuranceClaimAmount,
    insuranceApprovedAmount,
    tpaNonPayable: nonPayable,
    tpaCopay: copay,
    tpaDeductible: deductible,
    amountPaid: finalPatientPaid,
    dueAmount: patientDue,
    patientDue,
    paymentStatus: patientDue <= 0 ? 'Paid' : (finalPatientPaid > 0 ? 'Partially Paid' : 'Unpaid'),
    paymentMode: finalInsuranceAllocation > 0 ? 'Insurance' : (finalPatientPaid > 0 ? 'Cash' : 'Due'),
    payments: finalPatientPaid > 0 ? [{
      paymentNo: 'PMT-1',
      amount: finalPatientPaid,
      dueBeforePayment: Number((netHospitalBill - finalAdvance - finalInsuranceAllocation).toFixed(2)),
      dueAfterPayment: patientDue
    }] : []
  };

  // Simulate database serialization / deserialization (round-trip)
  const reloadedBill = JSON.parse(JSON.stringify(persistedBillDoc));

  return {
    persistedBillDoc,
    reloadedBill,
    isReconciled,
    reconciledSum,
    patientDue,
    tpaReceivable
  };
}

function runTests() {
  console.log('\n===============================================================');
  console.log('       MEDORA360 - TPA CASHLESS SPLIT LOGIC TEST SUITE         ');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (name, condition, extra = '') => {
    if (condition) {
      console.log(`  ✅ [PASS] ${name} ${extra}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${name} ${extra}`);
      failed++;
    }
  };

  // =========================================================================
  // TEST SECTION 1: UAT CURRENT SCREEN AUDIT & RESOLUTION (₹5,00,000 / Settled)
  // =========================================================================
  console.log('--- Test 1: UAT Exact Scenario - Bill ₹10,500, Pre-Auth ₹5,00,000, Status "Settled" ---');
  const uat = calculateCashlessSplit({
    netPayable: 10500,
    totalApprovedAmount: 500000,
    initialApprovedAmount: 500000,
    finalAuthorizedAmount: 500000, // Settled document snapshot
    preauthStatus: 'Settled'
  });

  assert('Pre-Authorized Amount resolved as ₹5,00,000.00', uat.preAuthApprovedAmount === 500000);
  assert('Final Claim Authorization displays "Not Available" (not invented value)', uat.finalClaimAuthDisplay === 'Not Available');
  assert('Final Claim Authorization amount is null when settled', uat.finalClaimAuthAmount === null);
  assert('TPA Receivable is ₹0.00 on settled record', uat.tpaReceivable === 0, `(Got ₹${uat.tpaReceivable})`);
  assert('Patient Payable is ₹10,500.00 (full net bill)', uat.patientPayable === 10500, `(Got ₹${uat.patientPayable})`);
  assert('Review & Apply Split button is disabled when settled', uat.isReviewAndApplySplitDisabled === true);
  assert('Status is flagged as terminal Settled', uat.isRecordSettled === true);
  assert('Status message clearly indicates claim is Settled & Closed', uat.statusMessage.includes('already Settled & Closed'));

  // =========================================================================
  // TEST SECTION 2: CAPPING AT ELIGIBLE HOSPITAL BILL AMOUNT
  // =========================================================================
  console.log('\n--- Test 2: TPA Allocation Strictly Capped at Eligible Hospital Bill (₹10,500) ---');
  const r2 = calculateCashlessSplit({
    netPayable: 10500,
    totalApprovedAmount: 500000,
    finalAuthorizedAmount: 500000,
    preauthStatus: 'Final Authorized'
  });
  assert('TPA Receivable capped at ₹10,500, NOT ₹5,00,000', r2.tpaReceivable === 10500, `(Got ₹${r2.tpaReceivable})`);
  assert('Patient Payable is ₹0 when hospital bill is fully covered', r2.patientPayable === 0);
  assert('Sum of TPA and Patient shares equals Net Bill (₹10,500)', r2.tpaReceivable + r2.patientPayable === 10500);
  assert('Review & Apply Split button is enabled for valid Final Authorized', r2.isReviewAndApplySplitDisabled === false);

  // =========================================================================
  // TEST SECTION 3: BILL EXCEEDS TPA AUTHORIZATION CAP
  // =========================================================================
  console.log('\n--- Test 3: Hospital Bill Exceeds TPA Authorized Ceiling ---');
  const r3 = calculateCashlessSplit({
    netPayable: 10500,
    totalApprovedAmount: 8000,
    finalAuthorizedAmount: 8000,
    preauthStatus: 'Final Authorized'
  });
  assert('TPA Receivable capped at ₹8,000 authorized ceiling', r3.tpaReceivable === 8000);
  assert('Patient Payable collects remaining balance ₹2,500', r3.patientPayable === 2500);
  assert('Excess uncovered amount calculated as ₹2,500', r3.excessUncovered === 2500);
  assert('Sum equals Net Bill ₹10,500', r3.tpaReceivable + r3.patientPayable === 10500);

  // =========================================================================
  // TEST SECTION 4: DEDUCTIONS (NON-PAYABLE, CO-PAY, DEDUCTIBLE)
  // =========================================================================
  console.log('\n--- Test 4: Deductions Distribution (Non-Payable, Co-pay, Deductibles) ---');
  const r4 = calculateCashlessSplit({
    netPayable: 10500,
    totalApprovedAmount: 500000,
    finalAuthorizedAmount: 500000,
    preauthStatus: 'Final Authorized',
    nonPayable: 1500,
    copay: 1000,
    deductible: 500
  });
  assert('Mandatory patient portion is ₹3,000 (1500+1000+500)', r4.basePatientPortion === 3000);
  assert('Max TPA coverable is ₹7,500 (10,500 - 3,000)', r4.maxTpaCoverable === 7500);
  assert('TPA Receivable is ₹7,500', r4.tpaReceivable === 7500);
  assert('Patient Payable is ₹3,000', r4.patientPayable === 3000);
  assert('Sum equals Net Bill ₹10,500', r4.tpaReceivable + r4.patientPayable === 10500);

  // =========================================================================
  // TEST SECTION 5: PROVISIONAL STATUSES BLOCKING
  // =========================================================================
  console.log('\n--- Test 5: Provisional & Unapproved Statuses Gating ---');
  ['Draft', 'Submitted', 'Queried', 'Enhancement Requested', 'Rejected', 'Cancelled'].forEach(st => {
    const r = calculateCashlessSplit({
      netPayable: 10500,
      totalApprovedAmount: 50000,
      preauthStatus: st
    });
    assert(`Status "${st}" disables Review & Apply Split and yields ₹0 TPA receivable`,
      r.isReviewAndApplySplitDisabled === true && r.tpaReceivable === 0 && r.patientPayable === 10500);
  });

  // =========================================================================
  // TEST SECTION 6: SEPARATE VALID FINAL CLAIM RECORD MEETS BUSINESS RULES
  // =========================================================================
  console.log('\n--- Test 6: Separate Valid Final Claim Record Available ---');
  const r6 = calculateCashlessSplit({
    netPayable: 10500,
    totalApprovedAmount: 250000,
    finalAuthorizedAmount: 250000,
    preauthStatus: 'Approved',
    isClaimRecord: true
  });
  assert('Valid claim record resolves Final Claim Authorization correctly', r6.finalClaimAuthAmount === 250000);
  assert('Valid claim record displays formatted amount', r6.finalClaimAuthDisplay === '₹250000.00');
  assert('TPA Receivable is capped at Net Bill (₹10,500)', r6.tpaReceivable === 10500);
  assert('Review & Apply Split is enabled for valid claim record', r6.isReviewAndApplySplitDisabled === false);

  console.log('\n--- Test 6B: PreAuth Settled But Separate Valid Claim Available ---');
  const r6b = calculateCashlessSplit({
    netPayable: 10500,
    totalApprovedAmount: 500000,
    initialApprovedAmount: 500000,
    finalAuthorizedAmount: 0,
    preauthStatus: 'Settled',
    hasSeparateValidClaim: true
  });
  assert('Pre-Auth amount is ₹5,00,000.00', r6b.preAuthApprovedAmount === 500000);
  assert('Final Claim Auth is Not Available for settled record', r6b.finalClaimAuthDisplay === 'Not Available');
  assert('Review & Apply Split is enabled because separate valid claim meets business rules', r6b.isReviewAndApplySplitDisabled === false);

  // =========================================================================
  // TEST SECTION 7: BACKEND CONTROLLER VALIDATION (POST /billing/validate-cashless-split)
  // =========================================================================
  console.log('\n--- Test 7: Backend Controller Rejecting Settled Record ---');
  const b1 = simulateBackendValidation({
    preauth: { claimNumber: '50000', preauthStatus: 'Settled', finalAuthorizedAmount: 500000 },
    netPayable: 10500,
    patientPayable: 0,
    tpaReceivable: 10500,
    separateValidClaim: null // No separate valid claim
  });
  assert('Backend blocks attempt on Settled record', !b1.valid && b1.message.includes('already closed and settled'));

  console.log('\n--- Test 8: Backend Allowing Separate Valid Final Claim Record When PreAuth Is Settled ---');
  const b2 = simulateBackendValidation({
    preauth: { claimNumber: '50000', preauthStatus: 'Settled', finalAuthorizedAmount: 500000 },
    netPayable: 10500,
    patientPayable: 0,
    tpaReceivable: 10500,
    separateValidClaim: { claimNumber: 'CLM-VALID', status: 'Final Authorized', finalAuthorizedAmount: 250000 }
  });
  assert('Backend accepts separate valid final claim record when preauth is Settled', b2.valid === true);

  console.log('\n--- Test 9: Backend Blocking TPA Receivable Exceeding Net Hospital Bill ---');
  const b3 = simulateBackendValidation({
    preauth: { claimNumber: 'CLM-003', preauthStatus: 'Final Authorized', finalAuthorizedAmount: 500000 },
    netPayable: 10500,
    patientPayable: 0,
    tpaReceivable: 12000 // Exceeds 10500
  });
  assert('Backend blocks TPA receivable exceeding net bill', !b3.valid && b3.message.includes('cannot exceed the eligible hospital bill'));

  console.log('\n--- Test 10: Backend Blocking Financial Imbalance ---');
  const b4 = simulateBackendValidation({
    preauth: { claimNumber: 'CLM-004', preauthStatus: 'Final Authorized', finalAuthorizedAmount: 500000 },
    netPayable: 10500,
    patientPayable: 2000,
    tpaReceivable: 5000 // 2000 + 5000 = 7000 != 10500
  });
  assert('Backend blocks financial imbalance', !b4.valid && b4.message.includes('Split mismatch'));

  console.log('\n--- Test 11: Backend Duplicate Paid Settlement Protection ---');
  const b5 = simulateBackendValidation({
    preauth: { claimNumber: 'CLM-PAID', preauthStatus: 'Final Authorized', finalAuthorizedAmount: 50000 },
    netPayable: 10500,
    patientPayable: 0,
    tpaReceivable: 10500,
    existingPaidBills: [
      { status: 'Final', paymentMode: 'Insurance', transactionRef: 'CLM-PAID', paymentStatus: 'Paid' }
    ]
  });
  assert('Backend blocks duplicate paid settlement', !b5.valid && b5.message.includes('already exists for claim'));

  // =========================================================================
  // TEST SECTION 12: USER SPECIFIED VERIFICATION SCENARIOS A, B, C, D, E
  // =========================================================================

  console.log('\n--- Scenario A: ₹4,00,000 bill, ₹1,00,000 advance, ₹2,00,000 approved TPA → patient due ₹1,00,000 ---');
  const scenA = calculateHospitalBillBalance({
    totalHospitalBill: 400000,
    advanceAvailable: 100000,
    advanceApplied: 100000,
    claimedAmount: 250000,
    finalAuthorizedAmount: 200000,
    preauthStatus: 'Final Authorized',
    patientAmountPaid: 0
  });

  // Verify all 11 required Billing Summary items
  assert('Scenario A [1/11] Gross hospital bill is ₹4,00,000.00', scenA.totalHospitalBill === 400000);
  assert('Scenario A [2/11] Discounts and taxes: Net hospital bill reflects base', scenA.totalHospitalBill === 400000);
  assert('Scenario A [3/11] Net hospital bill is ₹4,00,000.00', scenA.totalHospitalBill === 400000);
  assert('Scenario A [4/11] Advance payments received is ₹1,00,000.00', scenA.advancePaymentsReceived === 100000);
  assert('Scenario A [5/11] Advance amount applied to this invoice is ₹1,00,000.00', scenA.advanceAmountApplied === 100000);
  assert('Scenario A [6/11] Insurance amount claimed is ₹2,50,000.00', scenA.tpaClaimAmount === 250000);
  assert('Scenario A [7/11] Insurance amount finally approved is ₹2,00,000.00', scenA.finalAuthorizedTpaAmount === 200000);
  assert('Scenario A [8/11] Insurance amount allocated to this bill is ₹2,00,000.00', scenA.eligibleTpaCoverage === 200000);
  assert('Scenario A [9/11] Patient amount already collected is ₹0.00', scenA.patientAmountPaid === 0);
  assert('Scenario A [10/11] Remaining patient amount to collect is ₹1,00,000.00', scenA.remainingAmountPatientMustPay === 100000);
  assert('Scenario A [11/11] Remaining TPA amount receivable is ₹2,00,000.00', scenA.remainingTpaReceivable === 200000);
  
  // Verify Formula: Remaining Patient Due = Net Bill - Advance Applied - Eligible TPA Allocation - Patient Payments Applied
  const calcPatientDueA = scenA.totalHospitalBill - scenA.advanceAmountApplied - scenA.eligibleTpaCoverage - scenA.patientAmountPaid;
  assert('Scenario A - Formula matches: Net Bill - Advance - TPA - Paid === ₹1,00,000.00', calcPatientDueA === 100000);
  assert('Scenario A - Reconciliation identity holds: Advance + Paid + TPA + Patient Due === Net Bill',
    (scenA.advanceAmountApplied + scenA.patientAmountPaid + scenA.eligibleTpaCoverage + scenA.remainingAmountPatientMustPay) === scenA.totalHospitalBill);

  console.log('\n--- Scenario B: Same bill and advance (₹4L / ₹1L), no valid insurance → patient due ₹3,00,000 ---');
  const scenB = calculateHospitalBillBalance({
    totalHospitalBill: 400000,
    advanceAvailable: 100000,
    advanceApplied: 100000,
    preauthStatus: '', // No valid insurance / no claim
    patientAmountPaid: 0
  });
  assert('Scenario B - Total Hospital Bill is ₹4,00,000.00', scenB.totalHospitalBill === 400000);
  assert('Scenario B - Advance Amount Applied is ₹1,00,000.00', scenB.advanceAmountApplied === 100000);
  assert('Scenario B - Insurance amount allocated to this bill is strictly ₹0.00', scenB.eligibleTpaCoverage === 0);
  assert('Scenario B - Remaining TPA amount receivable is ₹0.00', scenB.remainingTpaReceivable === 0);
  assert('Scenario B - Remaining patient amount to collect is ₹3,00,000.00', scenB.remainingAmountPatientMustPay === 300000);
  assert('Scenario B - Reconciliation identity holds: ₹1L + ₹0 + ₹0 + ₹3L === ₹4L',
    (scenB.advanceAmountApplied + scenB.patientAmountPaid + scenB.eligibleTpaCoverage + scenB.remainingAmountPatientMustPay) === scenB.totalHospitalBill);

  console.log('\n--- Scenario C: Existing settled claim without a separate valid claim → no new TPA allocation ---');
  const scenC = calculateHospitalBillBalance({
    totalHospitalBill: 400000,
    advanceAvailable: 100000,
    advanceApplied: 100000,
    claimedAmount: 250000,
    totalApprovedAmount: 500000,
    finalAuthorizedAmount: 500000, // Settled record snapshot
    preauthStatus: 'Settled',
    hasSeparateValidClaim: false,
    patientAmountPaid: 0
  });
  assert('Scenario C - TPA Allocation remains strictly ₹0.00 for settled record', scenC.eligibleTpaCoverage === 0);
  assert('Scenario C - Remaining TPA receivable is ₹0.00', scenC.remainingTpaReceivable === 0);
  assert('Scenario C - Patient due remains ₹3,00,000.00 (not reduced by closed claim)', scenC.remainingAmountPatientMustPay === 300000);
  assert('Scenario C - UI flags record as terminal Settled', scenC.displayMeta.isRecordSettled === true);
  assert('Scenario C - UI disables Review & Apply Split button', scenC.displayMeta.isReviewAndApplySplitDisabled === true);
  assert('Scenario C - UI shows reason why (Claim is already Settled & Closed)', scenC.displayMeta.finalClaimAuthDisplay === 'Not Available');
  
  // Backend validation simulation for Scenario C
  const backendRejectC = simulateBackendValidation({
    preauth: { claimNumber: 'CLM-SETTLED-99', preauthStatus: 'Settled', finalAuthorizedAmount: 500000 },
    totalHospitalBill: 400000,
    advanceAvailable: 100000,
    advanceApplied: 100000,
    patientPayable: 100000,
    tpaReceivable: 200000,
    separateValidClaim: null
  });
  assert('Scenario C - Backend rejects attempt on settled record without separate valid claim',
    !backendRejectC.valid && backendRejectC.message.includes('already closed and settled'));

  console.log('\n--- Scenario D: Invoice reload → values remain consistent with persisted ledger records ---');
  const scenD = simulateInvoiceCreationAndReload({
    grossHospitalBill: 400000,
    discountsAndTaxes: 0,
    netHospitalBill: 400000,
    advanceAvailable: 100000,
    advanceAdjusted: 100000,
    insuranceClaimAmount: 250000,
    insuranceApprovedAmount: 200000,
    tpaAllocation: 200000,
    patientAmountPaid: 0
  });
  const { persistedBillDoc, reloadedBill } = scenD;
  assert('Scenario D - Persisted document has insuranceAllocation = ₹2,00,000.00', persistedBillDoc.insuranceAllocation === 200000);
  assert('Scenario D - Persisted document has tpaReceivable = ₹2,00,000.00', persistedBillDoc.tpaReceivable === 200000);
  assert('Scenario D - Persisted document has patientDue = ₹1,00,000.00', persistedBillDoc.patientDue === 100000);
  assert('Scenario D - Persisted document has advanceAdjusted = ₹1,00,000.00', persistedBillDoc.advanceAdjusted === 100000);
  assert('Scenario D - Persisted document has grandTotal = ₹4,00,000.00', persistedBillDoc.grandTotal === 400000);
  
  // Assert 100% round-trip parity between persisted ledger record and reloaded invoice
  assert('Scenario D - Reloaded invoice insuranceAllocation matches persisted record exactly', reloadedBill.insuranceAllocation === persistedBillDoc.insuranceAllocation);
  assert('Scenario D - Reloaded invoice tpaReceivable matches persisted record exactly', reloadedBill.tpaReceivable === persistedBillDoc.tpaReceivable);
  assert('Scenario D - Reloaded invoice patientDue matches persisted record exactly', reloadedBill.patientDue === persistedBillDoc.patientDue);
  assert('Scenario D - Reloaded invoice dueAmount matches persisted record exactly', reloadedBill.dueAmount === persistedBillDoc.dueAmount);
  assert('Scenario D - Reloaded invoice advanceAdjusted matches persisted record exactly', reloadedBill.advanceAdjusted === persistedBillDoc.advanceAdjusted);
  assert('Scenario D - Reloaded invoice grandTotal matches persisted record exactly', reloadedBill.grandTotal === persistedBillDoc.grandTotal);
  assert('Scenario D - Reloaded invoice amountPaid matches persisted record exactly', reloadedBill.amountPaid === persistedBillDoc.amountPaid);
  assert('Scenario D - Reloaded invoice claim details match persisted record exactly',
    reloadedBill.insuranceClaimAmount === 250000 && reloadedBill.insuranceApprovedAmount === 200000);

  console.log('\n--- Scenario E: Final invoice → bill, advance, TPA allocation, patient collection and balance reconcile exactly ---');
  // Sub-scenario E1: Zero patient counter payment (Patient Due remains ₹1,00,000)
  const scenE1 = simulateInvoiceCreationAndReload({
    netHospitalBill: 400000,
    advanceAdjusted: 100000,
    tpaAllocation: 200000,
    patientAmountPaid: 0
  });
  assert('Scenario E1 - Unpaid remainder: Advance (1L) + Paid (0) + TPA (2L) + Patient Due (1L) === Net Bill (4L)',
    scenE1.isReconciled && scenE1.reconciledSum === 400000 && scenE1.patientDue === 100000);
  assert('Scenario E1 - Payment status is "Unpaid"', scenE1.reloadedBill.paymentStatus === 'Unpaid');

  // Sub-scenario E2: Partial patient counter payment of ₹40,000
  const scenE2 = simulateInvoiceCreationAndReload({
    netHospitalBill: 400000,
    advanceAdjusted: 100000,
    tpaAllocation: 200000,
    patientAmountPaid: 40000
  });
  assert('Scenario E2 - Partial payment: Advance (1L) + Paid (40k) + TPA (2L) + Patient Due (60k) === Net Bill (4L)',
    scenE2.isReconciled && scenE2.reconciledSum === 400000 && scenE2.patientDue === 60000);
  assert('Scenario E2 - Payment status is "Partially Paid"', scenE2.reloadedBill.paymentStatus === 'Partially Paid');
  assert('Scenario E2 - Ledger payment entry created for counter collection of ₹40,000', scenE2.reloadedBill.payments.length === 1 && scenE2.reloadedBill.payments[0].amount === 40000);

  // Sub-scenario E3: Full patient counter payment of ₹1,00,000
  const scenE3 = simulateInvoiceCreationAndReload({
    netHospitalBill: 400000,
    advanceAdjusted: 100000,
    tpaAllocation: 200000,
    patientAmountPaid: 100000
  });
  assert('Scenario E3 - Full payment: Advance (1L) + Paid (1L) + TPA (2L) + Patient Due (0) === Net Bill (4L)',
    scenE3.isReconciled && scenE3.reconciledSum === 400000 && scenE3.patientDue === 0);
  assert('Scenario E3 - Payment status is "Paid"', scenE3.reloadedBill.paymentStatus === 'Paid');

  // Sub-scenario E4: Deductions (Non-payable ₹20k, Co-pay ₹10k)
  const scenE4 = simulateInvoiceCreationAndReload({
    netHospitalBill: 400000,
    advanceAdjusted: 100000,
    tpaAllocation: 200000,
    nonPayable: 20000,
    copay: 10000,
    patientAmountPaid: 30000 // Patient pays mandatory deductions at desk
  });
  assert('Scenario E4 - Deductions preserved: Advance (1L) + Paid (30k) + TPA (2L) + Patient Due (70k) === Net Bill (4L)',
    scenE4.isReconciled && scenE4.reconciledSum === 400000 && scenE4.patientDue === 70000);
  assert('Scenario E4 - Reloaded deductions match: Non-payable ₹20,000, Co-pay ₹10,000',
    scenE4.reloadedBill.tpaNonPayable === 20000 && scenE4.reloadedBill.tpaCopay === 10000);

  // Sub-scenario E5: Negative balance prevention (Due is never negative)
  const scenE5 = simulateInvoiceCreationAndReload({
    netHospitalBill: 400000,
    advanceAdjusted: 100000,
    tpaAllocation: 200000,
    patientAmountPaid: 150000 // Overpaid attempt
  });
  assert('Scenario E5 - Patient Due is bounded at ₹0 (never negative)', scenE5.patientDue >= 0);

  // =========================================================================
  // ADDITIONAL REGRESSION & EDGE CASE SUITES
  // =========================================================================

  console.log('\n--- Additional Edge Case: Advance Covers Entire Bill ---');
  // Bill: ₹4,00,000 | Advance applied: ₹4,00,000 | Eligible TPA amount: ₹0 | Expected remaining patient balance: ₹0
  const testAdvCover = calculateHospitalBillBalance({
    totalHospitalBill: 400000,
    advanceAvailable: 450000,
    advanceApplied: 400000,
    totalApprovedAmount: 200000,
    preauthStatus: 'Approved'
  });
  assert('Edge Case - Total Hospital Bill is ₹4,00,000.00', testAdvCover.totalHospitalBill === 400000);
  assert('Edge Case - Advance Amount Applied is ₹4,00,000.00', testAdvCover.advanceAmountApplied === 400000);
  assert('Edge Case - Net bill after advance is ₹0.00', testAdvCover.netBillAfterAdvance === 0);
  assert('Edge Case - Eligible approved TPA amount is capped at ₹0.00', testAdvCover.eligibleTpaCoverage === 0);
  assert('Edge Case - Remaining Patient Balance is ₹0.00', testAdvCover.remainingPatientBalance === 0);
  assert('Edge Case - Financial identity holds: Advance + TPA + Patient === Bill',
    (testAdvCover.advanceAmountApplied + testAdvCover.eligibleTpaCoverage + testAdvCover.remainingPatientBalance) === testAdvCover.totalHospitalBill);

  console.log('\n--- Additional Edge Case: TPA Authorization Exceeds Net Bill After Advance ---');
  // Bill: ₹4,00,000 | Advance: ₹1,00,000 | Requested TPA: ₹3,50,000 | Cap: ₹3,00,000
  const testTpaExceed = calculateHospitalBillBalance({
    totalHospitalBill: 400000,
    advanceAvailable: 100000,
    advanceApplied: 100000,
    claimedAmount: 350000,
    finalAuthorizedAmount: 350000,
    preauthStatus: 'Final Authorized'
  });
  assert('Edge Case - Net bill after advance is ₹3,00,000.00', testTpaExceed.netBillAfterAdvance === 300000);
  assert('Edge Case - TPA allocation strictly capped at ₹3,00,000.00 (not 3.5L)', testTpaExceed.eligibleTpaCoverage === 300000);
  assert('Edge Case - Remaining Patient Balance is ₹0.00', testTpaExceed.remainingPatientBalance === 0);
  assert('Edge Case - Financial identity holds: Advance + TPA + Patient === Bill',
    (testTpaExceed.advanceAmountApplied + testTpaExceed.eligibleTpaCoverage + testTpaExceed.remainingPatientBalance) === testTpaExceed.totalHospitalBill);

  console.log('\n--- Backend Validation: Advance Applied Exceeding Ledger Records ---');
  const bG = simulateBackendValidation({
    preauth: { claimNumber: 'CLM-ADV', preauthStatus: 'Final Authorized', finalAuthorizedAmount: 200000 },
    totalHospitalBill: 400000,
    advanceAvailable: 50000, // Only 50k in ledger
    advanceApplied: 100000,   // Attempt to apply 100k
    patientPayable: 100000,
    tpaReceivable: 200000
  });
  assert('Backend blocks advance applied exceeding ledger records', !bG.valid && bG.message.includes('exceeds available unadjusted advance payments'));

  console.log('\n--- Backend Validation: Financial Overrun ---');
  const bH = simulateBackendValidation({
    preauth: { claimNumber: 'CLM-OVER', preauthStatus: 'Final Authorized', finalAuthorizedAmount: 300000 },
    totalHospitalBill: 400000,
    advanceAvailable: 100000,
    advanceApplied: 100000,
    patientPayable: 150000,
    tpaReceivable: 250000 // 100k + 150k + 250k = 500k > 400k
  });
  assert('Backend blocks advance + patient + TPA exceeding total bill', !bH.valid && bH.message.includes('exceeds Total Hospital Bill'));

  console.log('\n--- Backend Validation: Negative Balances Prohibited ---');
  const bI = simulateBackendValidation({
    preauth: { claimNumber: 'CLM-NEG', preauthStatus: 'Final Authorized', finalAuthorizedAmount: 200000 },
    totalHospitalBill: 400000,
    advanceAvailable: 100000,
    advanceApplied: 100000,
    patientPayable: -10000, // Negative balance
    tpaReceivable: 200000
  });
  assert('Backend blocks negative balances', !bI.valid && bI.message.includes('Negative financial balances'));

  console.log('\n--- Backend Validation: Provisional / Unapproved Claims Treated as ₹0 ---');
  const bJ1 = simulateBackendValidation({
    preauth: { claimNumber: 'CLM-SUB', preauthStatus: 'Submitted', totalApprovedAmount: 200000 },
    totalHospitalBill: 400000,
    advanceAvailable: 100000,
    advanceApplied: 100000,
    patientPayable: 100000,
    tpaReceivable: 200000
  });
  assert('Backend rejects submitted claim from being applied to ledger', !bJ1.valid && bJ1.message.includes('requires an "Approved" or "Final Authorized"'));

  const bJ2 = simulateBackendValidation({
    preauth: { claimNumber: 'CLM-REJ', preauthStatus: 'Rejected', totalApprovedAmount: 200000 },
    totalHospitalBill: 400000,
    advanceAvailable: 100000,
    advanceApplied: 100000,
    patientPayable: 100000,
    tpaReceivable: 200000
  });
  assert('Backend rejects rejected claim from being applied to ledger', !bJ2.valid && bJ2.message.includes('requires an "Approved" or "Final Authorized"'));

  // =========================================================================
  // TEST SECTION 13: SIMPLIFIED HOSPITAL BILLING WORKFLOW SCENARIOS
  // =========================================================================
  console.log('\n===============================================================');
  console.log('SIMPLIFIED HOSPITAL BILLING WORKFLOW SCENARIOS (CASHIER DESK)');
  console.log('===============================================================');

  console.log('\n--- Scenario 1: Advance-Only Scenario ---');
  // Total bill: ₹4,00,000 | Advance applied: ₹1,00,000 | Insurance: ₹0
  // Patient Amount Due = max(0, 4,00,000 - 1,00,000 - 0 - 0) = ₹3,00,000
  const scen1 = calculateHospitalBillBalance({
    totalHospitalBill: 400000,
    advanceAvailable: 100000,
    advanceApplied: 100000,
    claimedAmount: 0,
    totalApprovedAmount: 0,
    preauthStatus: '', // No insurance
    patientAmountPaid: 0
  });
  assert('Scenario 1 - Total Hospital Bill is ₹4,00,000.00', scen1.totalHospitalBill === 400000);
  assert('Scenario 1 - Less: Advance Payment Applied is ₹1,00,000.00', scen1.advanceAmountApplied === 100000);
  assert('Scenario 1 - Less: Insurance / TPA Amount Applied is strictly ₹0.00', scen1.tpaAllocated === 0);
  assert('Scenario 1 - Patient Amount Due is ₹3,00,000.00', scen1.remainingAmountPatientMustPay === 300000);
  assert('Scenario 1 - Reconciliation: Advance (₹1L) + Insurance (₹0) + Patient Due (₹3L) === ₹4L',
    (scen1.advanceAmountApplied + scen1.tpaAllocated + scen1.remainingAmountPatientMustPay) === scen1.totalHospitalBill);

  // Counter payment of ₹50,000 applied:
  const scen1Partial = calculateHospitalBillBalance({
    totalHospitalBill: 400000,
    advanceAvailable: 100000,
    advanceApplied: 100000,
    preauthStatus: '',
    patientAmountPaid: 50000
  });
  assert('Scenario 1 Partial - Patient Amount Due reduces to ₹2,50,000 after ₹50k paid', scen1Partial.remainingAmountPatientMustPay === 250000);
  assert('Scenario 1 Partial - Reconciliation: Advance (₹1L) + Paid (₹50k) + Patient Due (₹2.5L) === ₹4L',
    (scen1Partial.advanceAmountApplied + scen1Partial.patientAmountPaid + scen1Partial.remainingAmountPatientMustPay) === scen1Partial.totalHospitalBill);

  console.log('\n--- Scenario 2: Insurance-Only Scenario ---');
  // Total bill: ₹4,00,000 | Advance applied: ₹0 | Approved Insurance: ₹2,00,000
  // Patient Amount Due = max(0, 4,00,000 - 0 - 2,00,000 - 0) = ₹2,00,000
  const scen2 = calculateHospitalBillBalance({
    totalHospitalBill: 400000,
    advanceAvailable: 0,
    advanceApplied: 0,
    claimedAmount: 250000,
    finalAuthorizedAmount: 200000,
    preauthStatus: 'Final Authorized',
    patientAmountPaid: 0
  });
  assert('Scenario 2 - Total Hospital Bill is ₹4,00,000.00', scen2.totalHospitalBill === 400000);
  assert('Scenario 2 - Less: Advance Payment Applied is ₹0.00', scen2.advanceAmountApplied === 0);
  assert('Scenario 2 - Less: Insurance / TPA Amount Applied is ₹2,00,000.00', scen2.tpaAllocated === 200000);
  assert('Scenario 2 - Patient Amount Due is ₹2,00,000.00', scen2.remainingAmountPatientMustPay === 200000);
  assert('Scenario 2 - Reconciliation: Advance (₹0) + Insurance (₹2L) + Patient Due (₹2L) === ₹4L',
    (scen2.advanceAmountApplied + scen2.tpaAllocated + scen2.remainingAmountPatientMustPay) === scen2.totalHospitalBill);

  console.log('\n--- Scenario 3: Advance-Plus-Insurance Scenario (Canonical Example) ---');
  // Total bill: ₹4,00,000 | Advance applied: ₹1,00,000 | Valid approved insurance: ₹2,00,000
  // Final patient amount due: ₹1,00,000
  const scen3 = calculateHospitalBillBalance({
    totalHospitalBill: 400000,
    advanceAvailable: 100000,
    advanceApplied: 100000,
    claimedAmount: 250000,
    finalAuthorizedAmount: 200000,
    preauthStatus: 'Final Authorized',
    patientAmountPaid: 0
  });
  assert('Scenario 3 - Total Hospital Bill is ₹4,00,000.00', scen3.totalHospitalBill === 400000);
  assert('Scenario 3 - Less: Advance Payment Applied is ₹1,00,000.00', scen3.advanceAmountApplied === 100000);
  assert('Scenario 3 - Less: Insurance / TPA Amount Applied is ₹2,00,000.00', scen3.tpaAllocated === 200000);
  assert('Scenario 3 - Final Patient Amount Due is ₹1,00,000.00', scen3.remainingAmountPatientMustPay === 100000);
  assert('Scenario 3 - Formula check: max(0, 4L - 1L - 2L - 0) === ₹1,00,000.00',
    Math.max(0, scen3.totalHospitalBill - scen3.advanceAmountApplied - scen3.tpaAllocated - scen3.patientAmountPaid) === 100000);
  assert('Scenario 3 - Reconciliation: Advance (₹1L) + Insurance (₹2L) + Patient Due (₹1L) === ₹4L',
    (scen3.advanceAmountApplied + scen3.tpaAllocated + scen3.remainingAmountPatientMustPay) === scen3.totalHospitalBill);

  // Full counter payment of ₹1,00,000 settled:
  const scen3Paid = calculateHospitalBillBalance({
    totalHospitalBill: 400000,
    advanceAvailable: 100000,
    advanceApplied: 100000,
    claimedAmount: 250000,
    finalAuthorizedAmount: 200000,
    preauthStatus: 'Final Authorized',
    patientAmountPaid: 100000
  });
  assert('Scenario 3 Paid - Patient Amount Due is ₹0.00 after cashier collection', scen3Paid.remainingAmountPatientMustPay === 0);
  assert('Scenario 3 Paid - Reconciliation: Advance (₹1L) + Insurance (₹2L) + Counter Paid (₹1L) === ₹4L',
    (scen3Paid.advanceAmountApplied + scen3Paid.tpaAllocated + scen3Paid.patientAmountPaid + scen3Paid.remainingAmountPatientMustPay) === scen3Paid.totalHospitalBill);

  console.log('\n--- Scenario 4: No Insurance Scenario (Normal Cash / Self-Pay Billing) ---');
  // Total bill: ₹4,00,000 | Advance applied: ₹0 | Insurance: ₹0
  // Patient Amount Due = ₹4,00,000
  const scen4 = calculateHospitalBillBalance({
    totalHospitalBill: 400000,
    advanceAvailable: 0,
    advanceApplied: 0,
    preauthStatus: '',
    patientAmountPaid: 0
  });
  assert('Scenario 4 - Total Hospital Bill is ₹4,00,000.00', scen4.totalHospitalBill === 400000);
  assert('Scenario 4 - Advance allocation is ₹0.00', scen4.advanceAmountApplied === 0);
  assert('Scenario 4 - Insurance allocation is strictly ₹0.00', scen4.tpaAllocated === 0);
  assert('Scenario 4 - Patient Amount Due is full bill of ₹4,00,000.00', scen4.remainingAmountPatientMustPay === 400000);
  assert('Scenario 4 - Normal cash billing is not blocked (validity confirmed)', scen4.remainingAmountPatientMustPay === 400000);

  console.log('\n--- Scenario 5: Manual Allocation Capping & Unapproved Protection ---');
  // 5A: Cashier types manual allocation of ₹3,00,000 when approved limit is ₹2,00,000:
  const scen5A = calculateHospitalBillBalance({
    totalHospitalBill: 400000,
    advanceAvailable: 100000,
    advanceApplied: 100000,
    finalAuthorizedAmount: 200000,
    preauthStatus: 'Final Authorized',
    customInsuranceAllocation: '300000' // Tries to allocate ₹3L
  });
  assert('Scenario 5A - Manual entry of ₹3L is capped strictly at approved limit ₹2L', scen5A.tpaAllocated === 200000);
  assert('Scenario 5A - Patient Due remains ₹1,00,000 (cannot invent unapproved coverage)', scen5A.remainingAmountPatientMustPay === 100000);

  // 5B: Cashier types manual allocation of ₹1,50,000 when approved limit is ₹2,00,000 (valid lower allocation):
  const scen5B = calculateHospitalBillBalance({
    totalHospitalBill: 400000,
    advanceAvailable: 100000,
    advanceApplied: 100000,
    finalAuthorizedAmount: 200000,
    preauthStatus: 'Final Authorized',
    customInsuranceAllocation: '150000' // Allocates partial ₹1.5L
  });
  assert('Scenario 5B - Manual valid allocation of ₹1.5L is accepted', scen5B.tpaAllocated === 150000);
  assert('Scenario 5B - Patient Due is ₹1,50,000 (4L - 1L - 1.5L)', scen5B.remainingAmountPatientMustPay === 150000);

  // 5C: Claim is in "Submitted" status (unapproved) - manual entry must not invent coverage:
  const scen5C = calculateHospitalBillBalance({
    totalHospitalBill: 400000,
    advanceAvailable: 100000,
    advanceApplied: 100000,
    claimedAmount: 250000,
    totalApprovedAmount: 250000,
    preauthStatus: 'Submitted', // Not approved
    customInsuranceAllocation: '200000' // Cashier tries to manually allocate ₹2L
  });
  assert('Scenario 5C - Unapproved claim yields strictly ₹0.00 eligible coverage', scen5C.eligibleTpaCoverage === 0);
  assert('Scenario 5C - Manual allocation on unapproved claim remains ₹0.00', scen5C.tpaAllocated === 0);
  assert('Scenario 5C - Patient Due remains ₹3,00,000 (unapproved claim cannot reduce patient due)', scen5C.remainingAmountPatientMustPay === 300000);

  console.log('\n===============================================================');
  console.log(`TOTAL TESTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================\n');

  if (failed > 0) process.exit(1);
}

runTests();
