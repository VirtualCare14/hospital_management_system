const mongoose = require('mongoose');
require('dotenv').config({ path: 'backend/.env' });

async function inspect() {
  console.log('Connecting to database in READ-ONLY mode...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected.');

  const VisitingDoctorSchedule = mongoose.model('VisitingDoctorSchedule', new mongoose.Schema({}, { strict: false }));
  const Visit = mongoose.model('Visit', new mongoose.Schema({}, { strict: false }));

  const schedules = await VisitingDoctorSchedule.find({ doctorName: /Sumit/i }).lean();
  console.log('Found schedules for Dr. Sumit:', JSON.stringify(schedules, null, 2));

  if (schedules.length > 0) {
    for (const sched of schedules) {
      const visits = await Visit.find({ visitingScheduleId: sched._id }).lean();
      console.log(`Visits for schedule ${sched._id}:`, JSON.stringify(visits, null, 2));
    }
  }

  await mongoose.disconnect();
  console.log('Disconnected.');
}

inspect().catch(err => {
  console.error('Inspect error:', err);
  process.exit(1);
});

