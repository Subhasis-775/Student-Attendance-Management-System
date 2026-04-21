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
    // 8 Faculty as per curriculum requirements
    const fac1 = await User.create({ name: 'Dr. Sanjukta Mohanty', email: 'sanjukta@university.edu', registrationNumber: 'FAC001', password: 'password123', role: 'faculty' });
    const fac2 = await User.create({ name: 'Dr. Meenakhsi Pant', email: 'meenakhsi@university.edu', registrationNumber: 'FAC002', password: 'password123', role: 'faculty' });
    const fac3 = await User.create({ name: 'Dr. Debasish kar', email: 'debasish@university.edu', registrationNumber: 'FAC003', password: 'password123', role: 'faculty' });
    const fac4 = await User.create({ name: 'Mr. Santosh Maharana', email: 'santosh@university.edu', registrationNumber: 'FAC004', password: 'password123', role: 'faculty' });
    const fac5 = await User.create({ name: 'Ms. Jyotirmayee Routray', email: 'jyotirmayee@university.edu', registrationNumber: 'FAC005', password: 'password123', role: 'faculty' });
    const fac6 = await User.create({ name: 'Prof. Bharat chandra barik', email: 'bharat@university.edu', registrationNumber: 'FAC006', password: 'password123', role: 'faculty' });
    const fac7 = await User.create({ name: 'Dr. Ashis kumar Mishra', email: 'ashis@university.edu', registrationNumber: 'FAC007', password: 'password123', role: 'faculty' });
    const fac8 = await User.create({ name: 'Manoranjan Panda', email: 'manoranjan@university.edu', registrationNumber: 'FAC008', password: 'password123', role: 'faculty' });

    // Students
    const rawStudents = [
      "2211100196 BHADRESWAR MUNDARY", "23110250 ABHINANDAN SAHU", "23110251 ABHISHEK MOHANTY", "23110252 ABHISHEK PATI", "23110253 ABU NOOR AL SABA", "23110255 ADITYA PARAMANIK", "23110256 ADYASHA DAS", "23110258 ALIVA BHUYAN", "23110259 ANSU RANIT KERKETTA", "23110260 ASHUTOSH PADHY", "23110261 ASIT SAHOO", "23110262 AYUSH KUMAR BARIK", "23110264 DEBASIS PANDA", "23110265 DEEPESH KUMAR MISHRA", "23110266 DIBYA DISHA SAHOO", "23110268 DINESH CHANDRA MOHANTY", "23110269 DIVYAJYOTI GHADAI", "23110270 GOURI BASKEY", "23110271 GYANA PRAKASH DAS", "23110272 HEMANT XALXO", "23110273 IPSITA MAHAPATRO", "23110274 JASWANT DAKUA", "23110275 K OM SENAPATI", "23110276 KARANAM PRASANT", "23110277 KETAN MOHANTY", "23110278 KHIROD BEHERA", "23110279 KHUSHI MANDAL", "23110280 KRITIKA TANDY", "23110281 LIPSITA MAHAPATRO", "23110282 MANASI MAHARANA", "23110283 MANOJ KUMAR PANIGRAHI", "23110284 MOUSUMI NAIK", "23110285 OM SATYAM DEY", "23110286 OMM PRAKASH SAHOO", "23110287 OMMKAR PATTNAIK", "23110288 P MOHAN REDDY", "23110289 PRABHUPRATIK PATTANAIK", "23110290 PRASANTA MOHANTY", "23110291 PRATEEK MISHRA", "23110292 PRATIKSHYA PRIYADARSHINI", "23110293 PRIYADARSHINI SAHANI", "23110294 PRIYANSHU HEMBRAM", "23110295 PRUTHWIRAJ SANIBIGRAHA", "23110296 R.H.ARIJIT", "23110297 RAKESH SAHU", "23110298 SAHIL TRIPATHY", "23110299 SALONI MOHAPATRA", "23110300 SAMIKHYA PANIGRAHI", "23110302 SANTOSH SAMAL", "23110303 SASANK SEKHAR BISOYI", "23110304 SATYA SARATHI DAS", "23110305 SATYAJIT DAS", "23110306 SATYAJIT SAHOO", "23110307 SATYAPRAKASH NAIK", "23110308 SHIVA PRASAD SAHOO", "23110309 SHUBHRANSHU SEKHAR DALAI", "23110310 SHYAM SUNDAR SOREN", "23110311 SIMRAN PALAI", "23110312 SOMEN SUBHADIP ROUT", "23110313 SOUMYA SAFALLYA SAHOO", "23110314 SOUMYA SAGAR NAYAK", "23110315 SOVAN KUMAR MOHAPATRA", "23110316 SRITOM MOHANTY", "23110317 SUBASISH JENA", "23110318 SUBHASIS ROUT", "23110319 SUBHASISH BEHERA", "23110320 SUJALL MOHAPATRA", "23110321 SUMAN SUBHRA CHANDAN SEN", "23110322 SURYA NARAYAN DASH", "23110323 SUSHREE SANGITA SAHOO", "23110325 UPENDRA MURMU", "23110326 VIBHA MISHRA", "23110327 VIVEKANANDA GURU", "23110395 ADARSH SWAIN", "23110462 PARITOSH RATH", "23110581 PRAYAS KUMAR NAYAK", "23110701 SWAYAM SUBHANKAR SAHOO", "23110713 ADYASHA MISHRA", "23110791 PRIYANKA SWAIN", "24120021 ABHIJIT MOHANTY", "24120022 AMLAN BAIBHAV DASH", "24120023 ASHUTOSH MOHAPATRA", "24120024 BHANU PRATAP SINGH", "24120025 G.KHETRABASI REDDY", "24120026 KAMALAKANTA PARIDA", "24120027 MIR ENAYATULLA QUADRI", "24120028 PURNA CHANDRA JENA", "24120029 SANDEEP EKKA", "24120030 SUBHASHREE DAS", "24120031 SUMEET HOTA"
    ];

    const studentData = rawStudents.map(str => {
      const parts = str.split(' ');
      const regObj = parts[0];
      const nameObj = parts.slice(1).join(' ');
      return {
        name: nameObj,
        email: `${regObj}@university.edu`,
        registrationNumber: regObj,
        password: 'password123',
        role: 'student'
      };
    });

    console.log(`Generating ${studentData.length} students natively...`);
    const createdStudents = await Promise.all(studentData.map(s => User.create(s)));
    const allStudents = createdStudents.map(s => s._id);

    // 6 Theory subjects (30 classes each) + 3 Lab subjects (10 classes each)
    const courses = await Course.insertMany([
      // Theory - 30 classes per semester
      { courseCode: 'BH3403', name: 'Entrepreneurship Development', type: 'theory', maxClasses: 30, faculty: [fac6._id], students: allStudents },
      { courseCode: 'CS3102', name: 'Deep Learning', type: 'theory', maxClasses: 30, faculty: [fac1._id], students: allStudents },
      { courseCode: 'CS3104', name: 'Compiler Design', type: 'theory', maxClasses: 30, faculty: [fac5._id], students: allStudents },
      { courseCode: 'CS3202', name: 'Data Mining', type: 'theory', maxClasses: 30, faculty: [fac2._id], students: allStudents },
      { courseCode: 'CS3208', name: 'Internet and Web Technology', type: 'theory', maxClasses: 30, faculty: [fac4._id], students: allStudents },
      { courseCode: 'IP3403', name: 'Industrial Safety Engineering', type: 'theory', maxClasses: 30, faculty: [fac3._id], students: allStudents },
      // Labs - 10 classes per semester
      { courseCode: 'CS3502', name: 'Deep Learning Laboratory', type: 'lab', maxClasses: 10, faculty: [fac1._id], students: allStudents },
      { courseCode: 'CS3504', name: 'Compiler Design Laboratory', type: 'lab', maxClasses: 10, faculty: [fac5._id], students: allStudents },
      { courseCode: 'CS3602', name: 'Project for Product Development - I', type: 'lab', maxClasses: 10, faculty: [fac1._id, fac2._id, fac5._id, fac4._id, fac7._id, fac8._id], students: allStudents },
    ]);

    const attendanceRecords = [];
    const today = new Date();
    const uniqueRecords = new Set();

    for (const course of courses) {
      const isLab = course.type === 'lab';
      const classesHeld = isLab ? 7 : 20;

      for (let day = 0; day < classesHeld; day++) {
        const date = new Date(today);
        const dayOffset = isLab ? (day * 7 + 3) : (day + 1);
        date.setDate(today.getDate() - dayOffset);
        // Quick normalization
        date.setHours(0,0,0,0);
        if (date.getDay() === 0) date.setDate(date.getDate() - 2);
        if (date.getDay() === 6) date.setDate(date.getDate() - 1);

        const dateStr = date.toISOString().split('T')[0];

        for (const studentId of allStudents) {
          const key = `${course._id}_${studentId}_${dateStr}`;
          if (!uniqueRecords.has(key)) {
            uniqueRecords.add(key);
            const rand = Math.random();
            let status = 'present';
            if (rand > 0.87) status = 'absent';
            else if (rand > 0.82) status = 'leave';
            attendanceRecords.push({ date, course: course._id, student: studentId, status });
          }
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
    console.log('  👨‍🏫 Faculty: FAC001 to FAC008');
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
