const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['present', 'absent', 'leave'], default: 'absent' }
}, { timestamps: true });

// EDGE CASE #1: Compound unique index prevents duplicate entries
// Same student cannot be marked twice for same course on same date
attendanceSchema.index({ date: 1, course: 1, student: 1 }, { unique: true });
attendanceSchema.index({ student: 1, date: -1 });
attendanceSchema.index({ course: 1, date: -1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
