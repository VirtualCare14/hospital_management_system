const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function migrate() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospital_management';
  await mongoose.connect(uri);
  const Visit = require('../models/Visit');
  const Billing = require('../models/Billing');
  const LabBill = require('../models/LabBill');

  const labVisits = await Visit.find({
    $or: [
      { visitType: 'Lab' },
      { department: 'Laboratory' },
      { slot: 'Lab Walk-in' }
    ]
  });

  console.log(`Found ${labVisits.length} lab visits to check/update.`);

  for (const v of labVisits) {
    console.log(`\nChecking visit ${v.registrationNumber} (current netOpdFee: ${v.netOpdFee}, billNumber: ${v.billNumber})...`);
    
    // Look for matching Billing
    let bill = null;
    if (v.billNumber) {
      bill = await Billing.findOne({ $or: [{ billNo: v.billNumber }, { invoiceNo: v.billNumber }] }).lean();
    }
    if (!bill) {
      const vDateStr = v.appointmentDate || (v.registrationDate ? new Date(v.registrationDate).toISOString().split('T')[0] : null);
      const bills = await Billing.find({ patientId: v.patientId, billType: 'Lab' }).sort({ createdAt: -1 }).lean();
      bill = bills.find(b => {
        const bDateStr = b.createdAt ? new Date(b.createdAt).toISOString().split('T')[0] : null;
        return bDateStr === vDateStr;
      }) || bills[0];
    }

    let labBill = null;
    if (!bill) {
      labBill = await LabBill.findOne({ patientId: v.patientId }).sort({ createdAt: -1 }).lean();
    }

    const matched = bill || labBill;
    if (matched) {
      const fee = matched.grandTotal !== undefined ? matched.grandTotal : (matched.totalAmount !== undefined ? matched.totalAmount : (matched.amountPaid || 0));
      const gross = matched.subtotal !== undefined ? matched.subtotal : (matched.baseAmount || fee);
      const billNo = matched.billNo || matched.invoiceNo || matched.labId;
      console.log(`Found matched bill: fee = ${fee}, gross = ${gross}, billNo = ${billNo}`);
      
      v.netOpdFee = fee;
      v.opdFee = gross;
      v.grossOpdFee = gross;
      if (!v.billNumber && billNo) {
        v.billNumber = billNo;
      }
      await v.save();
      console.log(`Updated visit ${v.registrationNumber}: netOpdFee = ${v.netOpdFee}, billNumber = ${v.billNumber}`);
    } else {
      console.log(`No bill matched for visit ${v.registrationNumber}`);
    }
  }

  console.log('\nMigration complete.');
  await mongoose.disconnect();
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});

