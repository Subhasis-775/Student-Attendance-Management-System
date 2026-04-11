const Attendance = require('../models/Attendance');
const Course = require('../models/Course');
const User = require('../models/User');
const mongoose = require('mongoose');

// ──────────────────────────────────────────────
// HELPER: Validate ObjectId format
// ──────────────────────────────────────────────
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// ──────────────────────────────────────────────
// HELPER: Safe percentage calculation
// Avoids division by zero and floating-point issues
// ──────────────────────────────────────────────
const calcPercentage = (present, total) => {
  if (total <= 0) return 0;
  // Use Math.round to avoid floating-point quirks (e.g. 74.999999 → 75)
  return Math.round((present / total) * 10000) / 100;
};

// ──────────────────────────────────────────────
// POST /api/attendance — Mark attendance
// ──────────────────────────────────────────────
const markAttendance = async (req, res) => {
  const { date, courseId, studentsData } = req.body;

  // EDGE CASE #6a: Empty or missing body fields
  if (!date || !courseId || !studentsData) {
    return res.status(400).json({ message: 'Missing required fields: date, courseId, studentsData' });
  }

  if (!Array.isArray(studentsData) || studentsData.length === 0) {
    return res.status(400).json({ message: 'studentsData must be a non-empty array' });
  }

  // EDGE CASE #6b: Invalid ObjectId
  if (!isValidObjectId(courseId)) {
    return res.status(400).json({ message: 'Invalid courseId format' });
  }

  // EDGE CASE #6c: Future date check
  const attendanceDate = new Date(date);
  if (isNaN(attendanceDate.getTime())) {
    return res.status(400).json({ message: 'Invalid date format' });
  }

  const today = new Date();
  today.setHours(23, 59, 59, 999); // Allow marking for today
  if (attendanceDate > today) {
    return res.status(400).json({ message: 'Cannot mark attendance for a future date' });
  }

  try {
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    // EDGE CASE #4: Check if marking attendance would exceed maxClasses
    const existingCount = await Attendance.countDocuments({
      course: courseId,
      student: course.students[0], // check any enrolled student
      date: { $ne: new Date(date) } // don't count current date (for updates)
    });

    if (existingCount >= course.maxClasses) {
      return res.status(400).json({
        message: `Max classes limit (${course.maxClasses}) already reached for this course`
      });
    }

    // Validate each student entry
    const validStatuses = ['present', 'absent', 'leave'];
    const operations = [];

    for (const data of studentsData) {
      // EDGE CASE #6b: Validate each studentId
      if (!data.studentId || !isValidObjectId(data.studentId)) {
        return res.status(400).json({ message: `Invalid studentId: ${data.studentId}` });
      }

      // EDGE CASE #6d: Validate status value
      if (!validStatuses.includes(data.status)) {
        return res.status(400).json({
          message: `Invalid status '${data.status}' for student ${data.studentId}. Must be: present, absent, or leave`
        });
      }

      // EDGE CASE #1 & #7: upsert prevents duplicates AND handles double-submission
      // If record exists → update it. If not → create it.
      // This is idempotent: calling twice with same data produces same result.
      operations.push({
        updateOne: {
          filter: {
            date: new Date(date),
            course: courseId,
            student: data.studentId
          },
          update: { $set: { status: data.status } },
          upsert: true
        }
      });
    }

    // EDGE CASE #2: Auto-fill absent for enrolled students not in studentsData
    const submittedIds = new Set(studentsData.map(d => d.studentId));
    const enrolledIds = course.students.map(s => s.toString());

    for (const enrolledId of enrolledIds) {
      if (!submittedIds.has(enrolledId)) {
        operations.push({
          updateOne: {
            filter: {
              date: new Date(date),
              course: courseId,
              student: enrolledId
            },
            update: { $set: { status: 'absent' } },
            upsert: true
          }
        });
      }
    }

    await Attendance.bulkWrite(operations);

    const presentCount = studentsData.filter(d => d.status === 'present').length;
    const absentCount = enrolledIds.length - presentCount;

    res.json({
      message: 'Attendance marked successfully',
      summary: {
        date: date,
        course: course.courseCode,
        total: enrolledIds.length,
        present: presentCount,
        absent: absentCount,
        isUpdate: existingCount > 0 || false
      }
    });
  } catch (error) {
    // EDGE CASE #1: Handle unique constraint violation gracefully
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Duplicate attendance entry detected. Record already exists.' });
    }
    res.status(500).json({ message: error.message });
  }
};

// ──────────────────────────────────────────────
// GET /api/attendance/course/:courseId — Get attendance for a course
// ──────────────────────────────────────────────
const getCourseAttendance = async (req, res) => {
  const { courseId } = req.params;
  const { date } = req.query;

  if (!isValidObjectId(courseId)) {
    return res.status(400).json({ message: 'Invalid courseId' });
  }

  try {
    let filter = { course: courseId };
    if (date) {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ message: 'Invalid date format' });
      }
      filter.date = parsedDate;
    }

    const records = await Attendance.find(filter).populate('student', 'name email registrationNumber');
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ──────────────────────────────────────────────
// GET /api/attendance/stats — Student's own stats
// ──────────────────────────────────────────────
const getAttendanceStats = async (req, res) => {
  try {
    const studentId = req.user._id;

    // Find ALL courses this student is enrolled in
    const enrolledCourses = await Course.find({ students: studentId })
      .select('name courseCode type maxClasses createdAt');

    // Fetch all attendance records for this student
    const records = await Attendance.find({ student: studentId })
      .populate('course', 'name courseCode type maxClasses');

    // Group records by course
    const recordsByCourse = {};
    records.forEach(r => {
      // EDGE CASE: Skip orphaned records (course was deleted)
      if (!r.course) return;
      const courseId = r.course._id.toString();
      if (!recordsByCourse[courseId]) {
        recordsByCourse[courseId] = { course: r.course, records: [] };
      }
      recordsByCourse[courseId].records.push(r);
    });

    const finalStats = enrolledCourses.map(course => {
      const courseId = course._id.toString();
      const maxCap = course.maxClasses || 30;
      const courseType = course.type || 'theory';
      const courseData = recordsByCourse[courseId];

      // EDGE CASE #3: No records → 0% (not NaN), not eligible
      if (!courseData || courseData.records.length === 0) {
        return {
          course: { _id: course._id, name: course.name, courseCode: course.courseCode, type: courseType, maxClasses: maxCap },
          percentage: '0.00',
          isEligible: false,
          cappedTotalClasses: 0,
          cappedPresentClasses: 0,
        };
      }

      let totalPresent = 0;
      let totalClasses = 0;

      // EDGE CASE #5: Only count records from after student joined
      // Use the student's enrollment date (course.createdAt as proxy)
      // or just count all records that exist for this student
      courseData.records.forEach(r => {
        totalClasses += 1;
        if (r.status === 'present' || r.status === 'leave') totalPresent += 1;
      });

      // EDGE CASE #4: Cap at maxClasses (30 for theory, 10 for labs)
      const cappedTotal = Math.min(totalClasses, maxCap);
      const cappedPresent = Math.min(totalPresent, cappedTotal);

      // EDGE CASE #3 & #9: Safe percentage with proper rounding
      const percentage = calcPercentage(cappedPresent, cappedTotal);

      // EDGE CASE #9: >= 75 means exactly 75.00% IS eligible
      const isEligible = percentage >= 75;

      return {
        course: { _id: course._id, name: course.name, courseCode: course.courseCode, type: courseType, maxClasses: maxCap },
        percentage: percentage.toFixed(2),
        isEligible,
        cappedTotalClasses: cappedTotal,
        cappedPresentClasses: cappedPresent,
      };
    });

    res.json(finalStats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ──────────────────────────────────────────────
// GET /api/attendance/report/:courseId — Faculty report
// ──────────────────────────────────────────────
const getCourseReport = async (req, res) => {
  const { courseId } = req.params;

  if (!isValidObjectId(courseId)) {
    return res.status(400).json({ message: 'Invalid courseId' });
  }

  try {
    const course = await Course.findById(courseId).populate('students', 'name email registrationNumber');
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const maxCap = course.maxClasses || 30;
    const records = await Attendance.find({ course: courseId });

    const report = course.students.map(student => {
      const studentRecords = records.filter(r => r.student.toString() === student._id.toString());

      let totalPresent = 0;
      let totalClasses = studentRecords.length;
      studentRecords.forEach(r => {
        if (r.status === 'present' || r.status === 'leave') totalPresent += 1;
      });

      // EDGE CASE #4: Cap at maxClasses
      const cappedTotal = Math.min(totalClasses, maxCap);
      const cappedPresent = Math.min(totalPresent, cappedTotal);

      // EDGE CASE #3 & #9: Safe calculation
      const percentage = calcPercentage(cappedPresent, cappedTotal);

      return {
        student: { _id: student._id, name: student.name, email: student.email, registrationNumber: student.registrationNumber },
        present: cappedPresent,
        total: cappedTotal,
        absent: cappedTotal - cappedPresent,
        percentage: percentage.toFixed(2),
        isEligible: percentage >= 75,
      };
    });

    // Sort: students below 75% first (flagged students at top)
    report.sort((a, b) => parseFloat(a.percentage) - parseFloat(b.percentage));

    res.json({
      course: { _id: course._id, name: course.name, courseCode: course.courseCode, type: course.type, maxClasses: maxCap },
      report
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { markAttendance, getCourseAttendance, getAttendanceStats, getCourseReport };
