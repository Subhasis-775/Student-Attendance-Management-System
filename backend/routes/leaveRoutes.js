const express = require('express');
const { protect, faculty } = require('../middleware/authMiddleware');
const { applyLeave, getMyLeaves, getFacultyLeaves, updateLeaveStatus } = require('../controllers/leaveController');

const router = express.Router();

// Student Routes
router.route('/').post(protect, applyLeave).get(protect, getMyLeaves);

// Faculty Routes
router.route('/faculty').get(protect, faculty, getFacultyLeaves);
router.route('/:id/status').put(protect, faculty, updateLeaveStatus);

module.exports = router;
