const Attendance = require('../models/Attendance');
const Course = require('../models/Course');

const ELIGIBILITY_THRESHOLD = 75;

const getUtcDayBounds = (inputDate) => {
  const date = new Date(inputDate);
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
};

const getMonthBounds = (month) => {
  if (!/^\d{4}-\d{2}$/.test(month)) return null;
  const [year, mon] = month.split('-').map(Number);
  if (mon < 1 || mon > 12) return null;
  const start = new Date(Date.UTC(year, mon - 1, 1));
  const end = new Date(Date.UTC(year, mon, 1));
  return { start, end };
};

const toPercent = (attended, total) => {
  if (!total) return 0;
  return Math.round((attended / total) * 10000) / 100;
};

const getStatusFields = (percentage) => {
  const eligible = percentage >= ELIGIBILITY_THRESHOLD;
  return {
    percentage: percentage.toFixed(2),
    eligibility: eligible ? 'Eligible' : 'Not Eligible',
    belowThreshold: !eligible,
  };
};

const getAttendanceCounts = (records) => {
  let total = 0;
  let attended = 0;
  records.forEach((rec) => {
    total += 1;
    if (rec.status === 'present' || rec.status === 'leave') attended += 1;
  });
  return { total, attended };
};

const buildCourseSummary = (course, records) => {
  const { total, attended } = getAttendanceCounts(records);
  // Use the course's own maxClasses (30 for theory, 10 for lab) as the semester cap
  const semesterCap = course.maxClasses || (course.type === 'lab' ? 10 : 30);
  const cappedTotal = Math.min(total, semesterCap);
  const cappedAttended = Math.min(attended, cappedTotal);
  const pct = toPercent(cappedAttended, cappedTotal);

  return {
    course: {
      _id: course._id,
      courseCode: course.courseCode,
      name: course.name,
      type: course.type,
      maxClasses: semesterCap,
    },
    attended: cappedAttended,
    totalClasses: cappedTotal,
    ...getStatusFields(pct),
  };
};

const summarizeStudent = async ({ studentId, month }) => {
  const courseQuery = { students: studentId };
  const courses = await Course.find(courseQuery).select('name courseCode type maxClasses');

  const attendanceQuery = { student: studentId };
  if (month) {
    const bounds = getMonthBounds(month);
    if (!bounds) throw new Error('INVALID_MONTH');
    attendanceQuery.date = { $gte: bounds.start, $lt: bounds.end };
  }

  const records = await Attendance.find(attendanceQuery).populate('course', 'name courseCode type');
  const grouped = new Map();
  records.forEach((rec) => {
    if (!rec.course) return;
    const id = rec.course._id.toString();
    if (!grouped.has(id)) grouped.set(id, []);
    grouped.get(id).push(rec);
  });

  const byCourse = courses.map((course) => {
    const list = grouped.get(course._id.toString()) || [];
    return buildCourseSummary(course, list);
  });

  const overallAttended = byCourse.reduce((sum, c) => sum + c.attended, 0);
  const overallTotal = byCourse.reduce((sum, c) => sum + c.totalClasses, 0);
  const overallPct = toPercent(overallAttended, overallTotal);

  return {
    month: month || null,
    overall: {
      attended: overallAttended,
      totalClasses: overallTotal,
      ...getStatusFields(overallPct),
    },
    courses: byCourse,
  };
};

module.exports = {
  ELIGIBILITY_THRESHOLD,
  getUtcDayBounds,
  getMonthBounds,
  toPercent,
  getStatusFields,
  summarizeStudent,
};
