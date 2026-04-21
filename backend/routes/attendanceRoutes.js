const express = require('express');
const { protect, faculty } = require('../middleware/authMiddleware');
const {
  markAttendance,
  getAttendanceStats,
  getCourseAttendance,
  getCourseReport,
  getMonthlyAttendance,
  getCumulativeAttendance,
  getAdminCumulativeOverview,
} = require('../controllers/attendanceController');

const router = express.Router();

router.route('/').post(protect, faculty, markAttendance);
router.route('/stats').get(protect, getAttendanceStats);
router.route('/monthly').get(protect, getMonthlyAttendance);
router.route('/cumulative').get(protect, getCumulativeAttendance);
router.route('/cumulative/admin-overview').get(protect, getAdminCumulativeOverview);
router.route('/course/:courseId').get(protect, getCourseAttendance);
router.route('/report/:courseId').get(protect, faculty, getCourseReport);

module.exports = router;
