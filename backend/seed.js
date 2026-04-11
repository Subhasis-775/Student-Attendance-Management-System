const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const User = require('./models/User');
const Course = require('./models/Course');
const Attendance = require('./models/Attendance');

dotenv.config();

connectDB();

const seedData = async () => {
  try {
    await User.deleteMany();
    await Course.deleteMany();
    await Attendance.deleteMany();

    // Admin
    const admin = await User.create({
      name: 'Admin User', email: 'admin@university.edu', password: 'password123', role: 'admin'
    });

    // 9 Faculty — one per subject (6 theory + 3 labs)
    const fac1 = await User.create({ name: 'Dr. Meena Kumari', email: 'meena@university.edu', registrationNumber: 'FAC001', password: 'password123', role: 'faculty' });
    const fac2 = await User.create({ name: 'Dr. Rajesh Patel', email: 'rajesh@university.edu', registrationNumber: 'FAC002', password: 'password123', role: 'faculty' });
    const fac3 = await User.create({ name: 'Dr. Anita Sharma', email: 'anita@university.edu', registrationNumber: 'FAC003', password: 'password123', role: 'faculty' });
    const fac4 = await User.create({ name: 'Dr. Suresh Nair', email: 'suresh@university.edu', registrationNumber: 'FAC004', password: 'password123', role: 'faculty' });
    const fac5 = await User.create({ name: 'Dr. Priya Das', email: 'priya.das@university.edu', registrationNumber: 'FAC005', password: 'password123', role: 'faculty' });
    const fac6 = await User.create({ name: 'Dr. Vikram Singh', email: 'vikram@university.edu', registrationNumber: 'FAC006', password: 'password123', role: 'faculty' });
    const fac7 = await User.create({ name: 'Prof. Arun Mishra', email: 'arun@university.edu', registrationNumber: 'FAC007', password: 'password123', role: 'faculty' });
    const fac8 = await User.create({ name: 'Prof. Kavita Rao', email: 'kavita@university.edu', registrationNumber: 'FAC008', password: 'password123', role: 'faculty' });
    const fac9 = await User.create({ name: 'Prof. Deepak Mohan', email: 'deepak@university.edu', registrationNumber: 'FAC009', password: 'password123', role: 'faculty' });

    // Students
    const s1 = await User.create({ name: 'Subhasis Rout', email: 'subhasis@university.edu', registrationNumber: '23110318', password: 'password123', role: 'student' });
    const s2 = await User.create({ name: 'Rahul Kumar', email: 'rahul@university.edu', registrationNumber: '23110319', password: 'password123', role: 'student' });
    const s3 = await User.create({ name: 'Priya Singh', email: 'priya@university.edu', registrationNumber: '23110320', password: 'password123', role: 'student' });
    const s4 = await User.create({ name: 'Amit Mohanty', email: 'amit@university.edu', registrationNumber: '23110321', password: 'password123', role: 'student' });
    const s5 = await User.create({ name: 'Sneha Panda', email: 'sneha@university.edu', registrationNumber: '23110322', password: 'password123', role: 'student' });

    const allStudents = [s1._id, s2._id, s3._id, s4._id, s5._id];

    // 6 Theory subjects (30 classes each) + 3 Lab subjects (10 classes each)
    const courses = await Course.insertMany([
      // Theory - 30 classes per semester
      { courseCode: 'BH3403', name: 'Entrepreneurship Development', type: 'theory', maxClasses: 30, faculty: fac1._id, students: allStudents },
      { courseCode: 'CS3102', name: 'Deep Learning', type: 'theory', maxClasses: 30, faculty: fac2._id, students: allStudents },
      { courseCode: 'CS3104', name: 'Compiler Design', type: 'theory', maxClasses: 30, faculty: fac3._id, students: allStudents },
      { courseCode: 'CS3202', name: 'Data Mining', type: 'theory', maxClasses: 30, faculty: fac4._id, students: allStudents },
      { courseCode: 'CS3208', name: 'Internet and Web Technology', type: 'theory', maxClasses: 30, faculty: fac5._id, students: allStudents },
      { courseCode: 'IP3403', name: 'Industrial Safety Engineering', type: 'theory', maxClasses: 30, faculty: fac6._id, students: allStudents },
      // Labs - 10 classes per semester
      { courseCode: 'CS3502', name: 'Deep Learning Laboratory', type: 'lab', maxClasses: 10, faculty: fac7._id, students: allStudents },
      { courseCode: 'CS3504', name: 'Compiler Design Laboratory', type: 'lab', maxClasses: 10, faculty: fac8._id, students: allStudents },
      { courseCode: 'CS3602', name: 'Project for Product Development - I', type: 'lab', maxClasses: 10, faculty: fac9._id, students: allStudents },
    ]);

    const attendanceRecords = [];
    const today = new Date();

    for (const course of courses) {
      const isLab = course.type === 'lab';
      const classesHeld = isLab ? 7 : 20;

      for (let day = 0; day < classesHeld; day++) {
        const date = new Date(today);
        const dayOffset = isLab ? (day * 7 + 3) : (day + 1);
        date.setDate(today.getDate() - dayOffset);
        if (date.getDay() === 0) date.setDate(date.getDate() - 1);
        if (date.getDay() === 6) date.setDate(date.getDate() - 1);

        for (const studentId of allStudents) {
          const rand = Math.random();
          let status = 'present';
          if (rand > 0.87) status = 'absent';
          else if (rand > 0.82) status = 'leave';
          attendanceRecords.push({ date, course: course._id, student: studentId, status });
        }
      }
    }

    await Attendance.insertMany(attendanceRecords);

    console.log('');
    console.log('══════════════════════════════════════════════════════════');
    console.log('  ✅ Database Seeded Successfully!');
    console.log('══════════════════════════════════════════════════════════');
    console.log('');
    console.log('  📚 Theory Subjects (30 classes/semester):');
    courses.filter(c => c.type === 'theory').forEach(c =>
      console.log(`    ${c.courseCode} — ${c.name}`)
    );
    console.log('');
    console.log('  🔬 Lab Subjects (10 classes/semester):');
    courses.filter(c => c.type === 'lab').forEach(c =>
      console.log(`    ${c.courseCode} — ${c.name}`)
    );
    console.log('');
    console.log('  👤 Students: 23110318 to 23110322');
    console.log('  👨‍🏫 Faculty: FAC001 to FAC009');
    console.log('  🔑 Admin: admin@university.edu');
    console.log('  🔒 Password (all): password123');
    console.log(`  📊 ${attendanceRecords.length} attendance records generated`);
    console.log('══════════════════════════════════════════════════════════');

    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

seedData();
