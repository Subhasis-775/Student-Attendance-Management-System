const Course = require('../models/Course');
const User = require('../models/User');
const mongoose = require('mongoose');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const createCourse = async (req, res) => {
  const { courseCode, name, faculty, type, maxClasses } = req.body;

  // Validation
  if (!courseCode || !name || !faculty) {
    return res.status(400).json({ message: 'courseCode, name, and faculty are required' });
  }

  if (!isValidObjectId(faculty)) {
    return res.status(400).json({ message: 'Invalid faculty ID' });
  }

  // Check faculty exists and has faculty role
  const facultyUser = await User.findById(faculty);
  if (!facultyUser || facultyUser.role !== 'faculty') {
    return res.status(400).json({ message: 'Selected user is not a faculty member' });
  }

  // Validate type and maxClasses
  const courseType = type || 'theory';
  const cap = maxClasses || (courseType === 'lab' ? 10 : 30);

  try {
    const course = await Course.create({ courseCode, name, faculty, type: courseType, maxClasses: cap });
    res.status(201).json(course);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: `Course code '${courseCode}' already exists` });
    }
    res.status(400).json({ message: error.message });
  }
};

const createUser = async (req, res) => {
  const { name, email, password, role, registrationNumber } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'name, email, and password are required' });
  }

  // Validate role
  const validRoles = ['student', 'faculty', 'admin'];
  if (role && !validRoles.includes(role)) {
    return res.status(400).json({ message: `Invalid role. Must be: ${validRoles.join(', ')}` });
  }

  try {
    const user = await User.create({
      name, email, password,
      role: role || 'student',
      registrationNumber: registrationNumber?.trim() || null
    });
    // Don't return password
    res.status(201).json({
      _id: user._id, name: user.name, email: user.email,
      registrationNumber: user.registrationNumber, role: user.role
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email or registration number already exists' });
    }
    res.status(400).json({ message: error.message });
  }
};

const getCourses = async (req, res) => {
  try {
    const courses = await Course.find({})
      .populate('faculty', 'name email')
      .populate('students', 'name email registrationNumber');
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const enrollStudent = async (req, res) => {
  const { studentId, courseId } = req.body;

  if (!studentId || !courseId) {
    return res.status(400).json({ message: 'studentId and courseId are required' });
  }

  if (!isValidObjectId(studentId) || !isValidObjectId(courseId)) {
    return res.status(400).json({ message: 'Invalid studentId or courseId' });
  }

  try {
    // Verify the student actually exists and is a student
    const student = await User.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    if (student.role !== 'student') return res.status(400).json({ message: 'User is not a student' });

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    // Check for duplicate enrollment
    if (course.students.map(s => s.toString()).includes(studentId)) {
      return res.status(400).json({ message: 'Student is already enrolled in this course' });
    }

    course.students.push(studentId);
    await course.save();
    res.json({ message: `${student.name} enrolled in ${course.courseCode} — ${course.name}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const enrollStudentAll = async (req, res) => {
  const { studentId } = req.body;

  if (!studentId || !isValidObjectId(studentId)) {
    return res.status(400).json({ message: 'Valid studentId is required' });
  }

  try {
    const student = await User.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    if (student.role !== 'student') return res.status(400).json({ message: 'User is not a student' });

    const courses = await Course.find({});
    let enrolledCount = 0;

    for (const course of courses) {
      if (!course.students.map(s => s.toString()).includes(studentId)) {
        course.students.push(studentId);
        await course.save();
        enrolledCount++;
      }
    }

    res.json({ message: `${student.name} enrolled in ${enrolledCount} new courses (${courses.length} total)` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const fs = require('fs');
const csv = require('csv-parser');

const bulkUploadUsers = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No CSV file uploaded' });
  }

  const results = [];
  const errors = [];
  
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => {
      // Basic validation
      if (!data.name || !data.email) {
        errors.push(`Row missing name or email: ${JSON.stringify(data)}`);
        return;
      }
      
      results.push({
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password || 'password123',
        role: data.role ? data.role.toLowerCase() : 'student',
        registrationNumber: data.registrationNumber ? data.registrationNumber.trim() : undefined
      });
    })
    .on('end', async () => {
      // Delete temporary file
      fs.unlinkSync(req.file.path);
      
      if (results.length === 0) {
        return res.status(400).json({ message: 'No valid user rows found in CSV' });
      }

      try {
        // We use unordered insertMany so valid docs insert even if some fail (e.g., duplicates)
        const inserted = await User.insertMany(results, { ordered: false });
        res.json({ 
          message: `Successfully provisioned ${inserted.length} users.`, 
          errors: errors.length > 0 ? errors : undefined 
        });
      } catch (error) {
        // If ordered: false, error contains insertedDocs
        if (error.code === 11000 && error.insertedDocs) {
           return res.json({ 
             message: `Successfully provisioned ${error.insertedDocs.length} users. Some failed due to duplicate emails or registration numbers.` 
           });
        }
        res.status(500).json({ message: error.message });
      }
    })
    .on('error', (error) => {
       fs.unlinkSync(req.file.path);
       res.status(500).json({ message: 'Error processing CSV file' });
    });
};

module.exports = { createCourse, createUser, getCourses, getUsers, enrollStudent, enrollStudentAll, bulkUploadUsers };
