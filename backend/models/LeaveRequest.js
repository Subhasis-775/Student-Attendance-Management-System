const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  date: { type: Date, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
}, { timestamps: true });

// A student cannot apply for multiple leaves for the same course on the same date
leaveRequestSchema.index({ student: 1, course: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);
