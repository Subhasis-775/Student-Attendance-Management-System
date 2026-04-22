const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  registrationNumber: { type: String, default: null },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'faculty', 'admin'], default: 'student' },
  branch: { type: String, default: 'CSE' },
  semester: { type: Number, default: 6 },
  lastWarningSentAt: { type: Date, default: null }
}, { timestamps: true });

// Create a partial unique index — only enforce uniqueness when the value actually exists
userSchema.index(
  { registrationNumber: 1 },
  { unique: true, partialFilterExpression: { registrationNumber: { $type: 'string' } } }
);

// Hash password before saving
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
