const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  courseCode: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['theory', 'lab'], default: 'theory' },
  maxClasses: { type: Number, default: 30 },
  branch: { type: String, default: 'CSE' },
  semester: { type: Number, default: 6 },
  faculty: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

courseSchema.index({ faculty: 1 });
courseSchema.index({ students: 1 });

module.exports = mongoose.model('Course', courseSchema);
