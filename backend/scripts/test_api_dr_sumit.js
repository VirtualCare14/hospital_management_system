const { getAvailableSlots } = require('../controllers/visitingScheduleController');
const VisitingDoctorSchedule = require('../models/VisitingDoctorSchedule');
const Visit = require('../models/Visit');
const mongoose = require('mongoose');
require('dotenv').config({ path: 'backend/.env' });

async function testApi() {
  await mongoose.connect(process.env.MONGO_URI);

  const scheduleId = '6ae1f7b45bc3200078494903';

  // Mock req and res for date = 2026-10-28
  const req28 = {
    params: { id: scheduleId },
    query: { date: '2026-10-28' },
    user: { hospitalId: new mongoose.Types.ObjectId('6a44caab1d3265c9c4701a9e'), role: 'reception' }
  };

  let res28Data = null;
  let res28Status = 200;
  const res28 = {
    status: (code) => { res28Status = code; return res28; },
    json: (data) => { res28Data = data; return res28; }
  };

  await getAvailableSlots(req28, res28);
  console.log('Result for 2026-10-28:', res28Status, JSON.stringify(res28Data, null, 2));

  // Mock req and res for date = 2026-10-30
  const req30 = {
    params: { id: scheduleId },
    query: { date: '2026-10-30' },
    user: { hospitalId: new mongoose.Types.ObjectId('6a44caab1d3265c9c4701a9e'), role: 'reception' }
  };

  let res30Data = null;
  let res30Status = 200;
  const res30 = {
    status: (code) => { res30Status = code; return res30; },
    json: (data) => { res30Data = data; return res30; }
  };

  await getAvailableSlots(req30, res30);
  console.log('Result for 2026-10-30:', res30Status, JSON.stringify(res30Data, null, 2));

  await mongoose.disconnect();
}

testApi().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

