const User = require('./models/User');
(async () => {
  try {
    const users = await User.find({ role: { $in: ['admin', 'reception', 'super-admin'] } }).select('username role mobile isActive').lean();
    console.log(JSON.stringify(users, null, 2));
  } catch (e) {
    console.error('ERR', e.message);
  }
})();
