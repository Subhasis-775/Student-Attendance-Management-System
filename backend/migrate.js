const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Course = require('./models/Course');

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/attendance-system');
    console.log('Connected to DB');

    const userResult = await User.updateMany(
      { $or: [{ branch: { $exists: false } }, { semester: { $exists: false } }] },
      { $set: { branch: 'CSE', semester: 6 } }
    );
    console.log('Users updated:', userResult.modifiedCount);

    const courseResult = await Course.updateMany(
      { $or: [{ branch: { $exists: false } }, { semester: { $exists: false } }] },
      { $set: { branch: 'CSE', semester: 6 } }
    );
    console.log('Courses updated:', courseResult.modifiedCount);

    console.log('Migration complete');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrate();
