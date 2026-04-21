const LeaveRequest = require('../models/LeaveRequest');
const Course = require('../models/Course');
const Attendance = require('../models/Attendance');

// Student applies for leave
const applyLeave = async (req, res) => {
  const { courseId, date, reason } = req.body;
  if (!courseId || !date || !reason) {
    return res.status(400).json({ message: 'Course, date, and reason are required' });
  }

  try {
    const request = await LeaveRequest.create({
      student: req.user._id,
      course: courseId,
      date: new Date(date),
      reason
    });
    res.status(201).json(request);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A leave request already exists for this date and course.' });
    }
    res.status(500).json({ message: error.message });
  }
};

// Student views their leaves
const getMyLeaves = async (req, res) => {
  try {
    const leaves = await LeaveRequest.find({ student: req.user._id })
      .populate('course', 'name courseCode type')
      .sort({ createdAt: -1 });
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Faculty gets pending (or all) leaves for their courses
const getFacultyLeaves = async (req, res) => {
  try {
    // Find courses taught by this faculty
    const courses = await Course.find({ faculty: req.user._id }).select('_id');
    const courseIds = courses.map(c => c._id);

    const leaves = await LeaveRequest.find({ course: { $in: courseIds } })
      .populate('course', 'name courseCode')
      .populate('student', 'name registrationNumber email')
      .sort({ createdAt: -1 });
    
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Faculty approves or rejects a leave
const updateLeaveStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'approved' or 'rejected'

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Status must be approved or rejected' });
  }

  try {
    const leaveRequest = await LeaveRequest.findById(id).populate('course');
    if (!leaveRequest) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    // Verify this faculty teaches this course (security check)
    if (!leaveRequest.course.faculty.some(f => f.toString() === req.user._id.toString()) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to approve this request' });
    }

    // Update status
    leaveRequest.status = status;
    await leaveRequest.save();

    // STATE MACHINE TRIGGER:
    // If approved, dynamically update the attendance record to 'leave'
    // If rejected, explicitly remove any existing 'leave' record or mark as absent, 
    // or just leave it alone. Let's strictly mark it 'leave' if approved.
    if (status === 'approved') {
      await Attendance.updateOne(
        { date: leaveRequest.date, course: leaveRequest.course._id, student: leaveRequest.student },
        { $set: { status: 'leave' } },
        { upsert: true }
      );
    } else if (status === 'rejected') {
        // If it was previously approved and now rejected, revert it to absent
        await Attendance.updateOne(
            { date: leaveRequest.date, course: leaveRequest.course._id, student: leaveRequest.student, status: 'leave' },
            { $set: { status: 'absent' } }
        );
    }

    res.json(leaveRequest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { applyLeave, getMyLeaves, getFacultyLeaves, updateLeaveStatus };
