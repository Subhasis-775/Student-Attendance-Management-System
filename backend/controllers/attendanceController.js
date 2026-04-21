const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const Course = require('../models/Course');
const {
  getUtcDayBounds,
  getMonthBounds,
  summarizeStudent,
  toPercent,
  getStatusFields,
} = require('../services/attendanceService');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const canAccessCourse = (course, user) => {
  if (!course || !user) return false;
  if (user.role === 'admin') return true;
  if (user.role === 'faculty') return course.faculty.some(f => f.toString() === user._id.toString());
  return false;
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

  const attendanceDate = new Date(date);
  if (isNaN(attendanceDate.getTime())) {
    return res.status(400).json({ message: 'Invalid date format' });
  }
  const { start: normalizedDate } = getUtcDayBounds(attendanceDate);

  const today = new Date();
  today.setHours(23, 59, 59, 999); // Allow marking for today
  if (attendanceDate > today) {
    return res.status(400).json({ message: 'Cannot mark attendance for a future date' });
  }

  try {
    const course = await Course.findById(courseId).select('faculty students courseCode name');
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (!canAccessCourse(course, req.user)) {
      return res.status(403).json({ message: 'Not authorized to mark attendance for this course' });
    }

    const validStatuses = ['present', 'absent', 'leave'];
    const operations = [];
    const enrolledSet = new Set(course.students.map((s) => s.toString()));

    for (const data of studentsData) {
      if (!data.studentId || !isValidObjectId(data.studentId)) {
        return res.status(400).json({ message: `Invalid studentId: ${data.studentId}` });
      }
      if (!enrolledSet.has(data.studentId.toString())) {
        return res.status(400).json({ message: `Student ${data.studentId} is not enrolled in this course` });
      }

      if (!validStatuses.includes(data.status)) {
        return res.status(400).json({
          message: `Invalid status '${data.status}' for student ${data.studentId}. Must be: present, absent, or leave`
        });
      }

      operations.push({
        updateOne: {
          filter: {
            date: normalizedDate,
            course: courseId,
            student: data.studentId
          },
          update: { $set: { status: data.status } },
          upsert: true
        }
      });
    }

    const submittedIds = new Set(studentsData.map(d => d.studentId));
    const enrolledIds = course.students.map(s => s.toString());

    for (const enrolledId of enrolledIds) {
      if (!submittedIds.has(enrolledId)) {
        operations.push({
          updateOne: {
            filter: {
              date: normalizedDate,
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
        date: normalizedDate,
        course: course.courseCode,
        total: enrolledIds.length,
        present: presentCount,
        absent: absentCount,
        semesterClassCap: course.maxClasses || (course.type === 'lab' ? 10 : 30)
      }
    });
  } catch (error) {
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
    const course = await Course.findById(courseId).select('faculty');
    if (!course) return res.status(404).json({ message: 'Course not found' });

    if (req.user.role === 'student') {
      return res.status(403).json({ message: 'Students cannot access class attendance sheets' });
    }
    if (!canAccessCourse(course, req.user)) {
      return res.status(403).json({ message: 'Not authorized to view this course attendance' });
    }

    let filter = { course: courseId };
    if (date) {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ message: 'Invalid date format' });
      }
      const { start, end } = getUtcDayBounds(parsedDate);
      filter.date = { $gte: start, $lt: end };
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
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can access personal attendance stats' });
    }
    const data = await summarizeStudent({ studentId: req.user._id.toString() });
    const finalStats = data.courses.map((item) => ({
      course: item.course,
      percentage: item.percentage,
      isEligible: item.eligibility === 'Eligible',
      cappedTotalClasses: item.totalClasses,
      cappedPresentClasses: item.attended,
    }));
    res.json(finalStats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCourseReport = async (req, res) => {
  const { courseId } = req.params;
  const { month } = req.query;

  if (!isValidObjectId(courseId)) {
    return res.status(400).json({ message: 'Invalid courseId' });
  }

  try {
    const course = await Course.findById(courseId).populate('students', 'name email registrationNumber');
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (!canAccessCourse(course, req.user)) {
      return res.status(403).json({ message: 'Not authorized to view this course report' });
    }

    let dateFilter = {};
    if (month) {
      const bounds = getMonthBounds(month);
      if (!bounds) return res.status(400).json({ message: 'Invalid month. Use YYYY-MM format' });
      dateFilter = { date: { $gte: bounds.start, $lt: bounds.end } };
    }

    const records = await Attendance.find({ course: courseId, ...dateFilter });

    const report = course.students.map(student => {
      const studentRecords = records.filter(r => r.student.toString() === student._id.toString());

      let totalPresent = 0;
      let totalClasses = studentRecords.length;
      studentRecords.forEach(r => {
        if (r.status === 'present' || r.status === 'leave') totalPresent += 1;
      });

      const semesterCap = course.maxClasses || (course.type === 'lab' ? 10 : 30);
      const cappedTotal = Math.min(totalClasses, semesterCap);
      const cappedPresent = Math.min(totalPresent, cappedTotal);
      const percentage = toPercent(cappedPresent, cappedTotal);
      const status = getStatusFields(percentage);

      return {
        student: { _id: student._id, name: student.name, email: student.email, registrationNumber: student.registrationNumber },
        present: cappedPresent,
        total: cappedTotal,
        absent: cappedTotal - cappedPresent,
        percentage: status.percentage,
        isEligible: status.eligibility === 'Eligible',
        belowThreshold: status.belowThreshold,
        eligibility: status.eligibility,
      };
    });

    // Sort: students below 75% first (flagged students at top)
    report.sort((a, b) => parseFloat(a.percentage) - parseFloat(b.percentage));

    res.json({
      course: { _id: course._id, name: course.name, courseCode: course.courseCode, type: course.type, maxClasses: course.maxClasses },
      month: month || null,
      semesterClassCap: course.maxClasses || (course.type === 'lab' ? 10 : 30),
      report
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMonthlyAttendance = async (req, res) => {
  const { month, studentId } = req.query;
  if (!month) return res.status(400).json({ message: 'month is required in YYYY-MM format' });

  try {
    let targetStudentId = studentId;
    if (req.user.role === 'student') {
      targetStudentId = req.user._id.toString();
    } else if (!targetStudentId) {
      return res.status(400).json({ message: 'studentId is required for admin/faculty requests' });
    }

    if (!isValidObjectId(targetStudentId)) {
      return res.status(400).json({ message: 'Invalid studentId' });
    }

    const summary = await summarizeStudent({ studentId: targetStudentId, month });
    res.json(summary);
  } catch (error) {
    if (error.message === 'INVALID_MONTH') {
      return res.status(400).json({ message: 'Invalid month. Use YYYY-MM format' });
    }
    res.status(500).json({ message: error.message });
  }
};

const getCumulativeAttendance = async (req, res) => {
  const { studentId } = req.query;
  try {
    let targetStudentId = studentId;
    if (req.user.role === 'student') {
      targetStudentId = req.user._id.toString();
    } else if (!targetStudentId) {
      return res.status(400).json({ message: 'studentId is required for admin/faculty requests' });
    }

    if (!isValidObjectId(targetStudentId)) {
      return res.status(400).json({ message: 'Invalid studentId' });
    }

    const summary = await summarizeStudent({ studentId: targetStudentId });
    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAdminCumulativeOverview = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admin can view cumulative overview' });
  }

  try {
    const students = await Course.aggregate([
      { $unwind: '$students' },
      { $group: { _id: '$students' } },
    ]);
    const studentIds = students.map((s) => s._id.toString());

    const summaries = [];
    for (const id of studentIds) {
      const summary = await summarizeStudent({ studentId: id });
      summaries.push({ studentId: id, ...summary.overall });
    }
    res.json(summaries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  markAttendance,
  getCourseAttendance,
  getAttendanceStats,
  getCourseReport,
  getMonthlyAttendance,
  getCumulativeAttendance,
  getAdminCumulativeOverview,
};
