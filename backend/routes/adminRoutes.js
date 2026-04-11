const express = require('express');
const multer = require('multer');
const { protect, admin } = require('../middleware/authMiddleware');
const { createCourse, createUser, getCourses, getUsers, enrollStudent, enrollStudentAll, bulkUploadUsers } = require('../controllers/adminController');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.route('/courses').post(protect, admin, createCourse).get(protect, getCourses);
router.route('/users').post(protect, admin, createUser).get(protect, admin, getUsers);
router.route('/users/bulk').post(protect, admin, upload.single('file'), bulkUploadUsers);
router.route('/enroll').post(protect, admin, enrollStudent);
router.route('/enroll-all').post(protect, admin, enrollStudentAll);

module.exports = router;
