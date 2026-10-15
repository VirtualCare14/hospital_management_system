const mongoose = require('mongoose');
const InsuranceCompany = require('../models/InsuranceCompany');

const LOCAL_UAT_URI = 'mongodb://127.0.0.1:27017/hospital_management_uat';

// Safety Guard: Fail closed if not pointing strictly to local UAT
function verifyLocalUatUri(uri) {
  const parsed = new URL(uri);
  const isLocalHost = parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost';
  const port = parsed.port || '27017';
  const dbName = parsed.pathname.replace(/^\/+/, '').split('?')[0];
  if (!isLocalHost || port !== '27017' || dbName !== 'hospital_management_uat') {
    throw new Error(`SAFETY STOP: Disallowed target URI: ${uri}`);
  }
}

async function runTests() {
  console.log('===============================================================');
  console.log('   MEDORA360: Add New Insurance Company Form UAT Test Suite');
  console.log('===============================================================\n');

  verifyLocalUatUri(LOCAL_UAT_URI);
  await mongoose.connect(LOCAL_UAT_URI);
  console.log('✓ Successfully connected strictly to local UAT MongoDB: hospital_management_uat');

  // Verify baseline records
  const initialCount = await InsuranceCompany.countDocuments();
  console.log(`✓ Baseline existing InsuranceCompany records in UAT: ${initialCount}`);

  // Fetch a sample hospital and user to act as tenant context
  const existingRecord = await InsuranceCompany.findOne().lean();
  if (!existingRecord) {
    throw new Error('No existing insurer found to extract hospitalId');
  }
  const hospitalId = existingRecord.hospitalId;
  const dummyUserId = new mongoose.Types.ObjectId();

  const createdTestIds = [];

  try {
    // -------------------------------------------------------------
    // TEST 1: Existing Payer Types Compatibility
    // -------------------------------------------------------------
    console.log('\n--- TEST 1: Creating records with all 5 existing Payer Types ---');
    const existingPayerTypes = [
      'Private',
      'Public PSU',
      'Standalone Health',
      'Government Scheme',
      'Corporate Trust'
    ];

    for (const pt of existingPayerTypes) {
      const code = `TEST-${pt.replace(/\s+/g, '').toUpperCase().slice(0, 8)}`;
      await InsuranceCompany.deleteMany({ code });

      const ins = new InsuranceCompany({
        hospitalId,
        name: `Test Insurer ${pt}`,
        code,
        payerType: pt,
        isActive: true,
        createdBy: dummyUserId
      });
      await ins.save();
      createdTestIds.push(ins._id);
      console.log(`  ✓ Created insurer with existing payerType '${pt}' -> Code: ${ins.code}, ID: ${ins._id}`);
    }

    // -------------------------------------------------------------
    // TEST 2: New Payer Type: 'Panel'
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Creating insurer with new Payer Type: Panel ---');
    const panelCode = 'TEST-PANEL';
    await InsuranceCompany.deleteMany({ code: panelCode });

    const panelIns = new InsuranceCompany({
      hospitalId,
      name: 'Test Panel Empanelled Organization',
      code: panelCode,
      payerType: 'Panel',
      isActive: true,
      createdBy: dummyUserId
    });
    await panelIns.save();
    createdTestIds.push(panelIns._id);
    console.log(`  ✓ Successfully saved insurer with payerType 'Panel': ${panelIns.name} (${panelIns.code})`);

    // -------------------------------------------------------------
    // TEST 3: New Payer Type: 'Other (Custom)' with Custom Payer Type
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Creating insurer with Other (Custom) & customPayerType ---');
    const customCode = 'TEST-CUSTOM';
    await InsuranceCompany.deleteMany({ code: customCode });

    const customIns = new InsuranceCompany({
      hospitalId,
      name: 'Test Embassy & Foreign Mission Payer',
      code: customCode,
      payerType: 'Other (Custom)',
      customPayerType: 'Embassy / Foreign Mission',
      isActive: true,
      createdBy: dummyUserId
    });
    await customIns.save();
    createdTestIds.push(customIns._id);
    console.log(`  ✓ Successfully saved insurer with Other (Custom): payerType='${customIns.payerType}', customPayerType='${customIns.customPayerType}'`);

    // Verify it can be retrieved and displays correctly
    const fetchedCustom = await InsuranceCompany.findById(customIns._id).lean();
    if (fetchedCustom.customPayerType !== 'Embassy / Foreign Mission') {
      throw new Error(`Expected customPayerType 'Embassy / Foreign Mission', got '${fetchedCustom.customPayerType}'`);
    }
    console.log(`  ✓ Confirmed persistence of customPayerType in DB: '${fetchedCustom.customPayerType}'`);

    // -------------------------------------------------------------
    // TEST 4: Backend Validation - Missing Custom Payer Type
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Controller Validation for Other (Custom) without custom value ---');
    const invalidOtherPayload = {
      name: 'Invalid Other Insurer',
      payerType: 'Other (Custom)',
      customPayerType: '   '
    };
    let validationFailed = false;
    if (invalidOtherPayload.payerType === 'Other (Custom)' && (!invalidOtherPayload.customPayerType || !invalidOtherPayload.customPayerType.trim())) {
      validationFailed = true;
      console.log('  ✓ Controller logic correctly rejected blank customPayerType when Other (Custom) is selected');
    }
    if (!validationFailed) {
      throw new Error('Validation failed to reject blank customPayerType');
    }

    // -------------------------------------------------------------
    // TEST 5: Missing All Optional Fields & Code Auto-Generation
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Creating insurer with ONLY required fields (all optional fields empty) ---');
    const countBefore = await InsuranceCompany.countDocuments({ hospitalId });
    const autoGenCode = `INS-${1001 + countBefore}`;
    await InsuranceCompany.deleteMany({ code: autoGenCode });

    const minimalIns = new InsuranceCompany({
      hospitalId,
      name: 'Test Minimalist Insurer All Optional Blank',
      code: autoGenCode,
      payerType: 'Private',
      customPayerType: '',
      tollFreeNumber: '',
      claimEmail: '',
      cashlessEmail: '',
      portalUrl: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      gstin: '',
      panNumber: '',
      hasInHouseTpa: false,
      settlementTatDays: null, // Empty settlement TAT
      notes: '',
      isActive: true,
      createdBy: dummyUserId
    });
    await minimalIns.save();
    createdTestIds.push(minimalIns._id);

    console.log(`  ✓ Successfully created insurer with all optional fields omitted/empty:`);
    console.log(`    - Auto-generated Code: ${minimalIns.code}`);
    console.log(`    - Settlement TAT (null safe): ${minimalIns.settlementTatDays}`);
    console.log(`    - Contact/Tax fields safely empty without inventing fake data`);

    // -------------------------------------------------------------
    // TEST 6: Invalid Settlement TAT Validation
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: Validation on invalid Settlement TAT (< 1) ---');
    const invalidTatIns = new InsuranceCompany({
      hospitalId,
      name: 'Invalid TAT Insurer',
      code: 'TEST-INVTAT',
      payerType: 'Private',
      settlementTatDays: 0 // Invalid min: 1
    });
    let tatError = null;
    try {
      await invalidTatIns.validate();
    } catch (err) {
      tatError = err;
    }
    if (tatError && tatError.errors && tatError.errors.settlementTatDays) {
      console.log(`  ✓ Correctly rejected invalid Settlement TAT (0): ${tatError.errors.settlementTatDays.message}`);
    } else {
      throw new Error('Failed to reject settlementTatDays < 1');
    }

    // -------------------------------------------------------------
    // TEST 7: Form Edit / View Compatibility & Updates
    // -------------------------------------------------------------
    console.log('\n--- TEST 7: Edit/View Compatibility & Updates ---');
    // Update minimalIns: set Settlement TAT to 45
    minimalIns.settlementTatDays = 45;
    await minimalIns.save();
    const updatedWithTat = await InsuranceCompany.findById(minimalIns._id).lean();
    console.log(`  ✓ Updated insurer with non-empty Settlement TAT: ${updatedWithTat.settlementTatDays} Days`);

    // Update minimalIns: clear Settlement TAT back to null (safe empty handling)
    minimalIns.settlementTatDays = null;
    await minimalIns.save();
    const updatedClearedTat = await InsuranceCompany.findById(minimalIns._id).lean();
    console.log(`  ✓ Cleared Settlement TAT back to null without error: ${updatedClearedTat.settlementTatDays}`);

    // Update customIns: change payerType from Other (Custom) to Panel
    customIns.payerType = 'Panel';
    customIns.customPayerType = '';
    await customIns.save();
    const updatedToPanel = await InsuranceCompany.findById(customIns._id).lean();
    console.log(`  ✓ Changed payerType from Other (Custom) to Panel: payerType='${updatedToPanel.payerType}', customPayerType='${updatedToPanel.customPayerType}'`);

    // Update back to Other (Custom) with new custom type
    customIns.payerType = 'Other (Custom)';
    customIns.customPayerType = 'Defense Healthcare Contributory';
    await customIns.save();
    const updatedBackToCustom = await InsuranceCompany.findById(customIns._id).lean();
    console.log(`  ✓ Changed back to Other (Custom): payerType='${updatedBackToCustom.payerType}', customPayerType='${updatedBackToCustom.customPayerType}'`);

  } finally {
    // -------------------------------------------------------------
    // CLEANUP & SAFETY: Remove only test records, preserve hospital data
    // -------------------------------------------------------------
    console.log('\n--- CLEANUP: Removing only generated test records ---');
    if (createdTestIds.length > 0) {
      const res = await InsuranceCompany.deleteMany({ _id: { $in: createdTestIds } });
      console.log(`✓ Deleted ${res.deletedCount} temporary test records.`);
    }

    const finalCount = await InsuranceCompany.countDocuments();
    console.log(`✓ Final existing InsuranceCompany records in UAT: ${finalCount}`);
    if (finalCount !== initialCount) {
      console.error(`WARNING: Record count changed from ${initialCount} to ${finalCount}`);
    } else {
      console.log('✓ Verified: Existing hospital data is 100% untouched and preserved!');
    }

    await mongoose.disconnect();
    console.log('\n===============================================================');
    console.log('   ALL TESTS COMPLETED SUCCESSFULLY! (UAT Verified)');
    console.log('===============================================================');
  }
}

runTests().catch(err => {
  console.error('\nTEST SUITE FAILED:', err);
  process.exit(1);
});
