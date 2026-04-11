const express = require('express');
const { protect, faculty } = require('../middleware/authMiddleware');
const { markAttendance, getAttendanceStats, getCourseAttendance, getCourseReport } = require('../controllers/attendanceController');

const router = express.Router();

router.route('/').post(protect, faculty, markAttendance);
router.route('/stats').get(protect, getAttendanceStats);
router.route('/course/:courseId').get(protect, getCourseAttendance);
router.route('/report/:courseId').get(protect, faculty, getCourseReport);

module.exports = router;
