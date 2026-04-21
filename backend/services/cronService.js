const cron = require('node-cron');
const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Notification = require('../models/Notification');
const sendEmail = require('../utils/sendEmail');

const checkAtRiskStudents = async () => {
  console.log('⏳ Running At-Risk Attendance Cron Job...');
  try {
    const atRiskStudents = await Attendance.aggregate([
      {
        $group: {
          _id: "$student",
          totalMarks: { $sum: 1 },
          presentMarks: {
            $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          attendancePercentage: {
            $multiply: [{ $divide: ["$presentMarks", "$totalMarks"] }, 100]
          },
          totalClasses: "$totalMarks",
          classesAttended: "$presentMarks"
        }
      },
      { $match: { attendancePercentage: { $lt: 75 } } },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "studentData"
        }
      },
      { $unwind: "$studentData" },
      {
        $project: {
          _id: 1,
          attendancePercentage: { $round: ["$attendancePercentage", 1] },
          totalClasses: 1,
          classesAttended: 1,
          "studentData.name": 1,
          "studentData.email": 1,
          "studentData.lastWarningSentAt": 1
        }
      }
    ]);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    for (const record of atRiskStudents) {
      const student = record.studentData;
      const lastWarning = student.lastWarningSentAt;

      // Send if no warning was ever sent, or if the last warning was sent over 7 days ago
      if (!lastWarning || new Date(lastWarning) < sevenDaysAgo) {
        
        // 1. Send Email
        const subject = '⚠️ Urgent: Attendance Compliance Warning';
        const htmlContent = `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2 style="color: #dc2626;">Attendance Warning</h2>
            <p>Dear <strong>${student.name}</strong>,</p>
            <p>This is an automated notification from the AttendEase System. Your overall attendance has dropped to <strong>${record.attendancePercentage}%</strong>, which is below the mandatory university threshold of 75%.</p>
            <p><strong>Status:</strong> ${record.classesAttended} out of ${record.totalClasses} classes attended.</p>
            <p>Please contact your academic advisor or course instructor immediately to discuss your situation and avoid potential penalties.</p>
            <br/>
            <p>Regards,<br/>The AttendEase Administration</p>
          </div>
        `;
        
        await sendEmail(student.email, subject, 'Your attendance is below 75%. Please check your portal.', htmlContent);

        // 2. Update Database
        await User.findByIdAndUpdate(record._id, { lastWarningSentAt: new Date() });

        // 3. Generate Admin Notification
        await Notification.create({
          message: `System alerted ${student.name} (${record.attendancePercentage}% attendance).`,
          type: 'warning'
        });
        
        console.log(`✅ Cron: Warning sent and logged for ${student.name}`);
      }
    }
  } catch (error) {
    console.error('❌ Cron Job Error:', error);
  }
};

const initCronJobs = () => {
  // Running every minute for testing purposes. 
  // You can change this to '0 22 * * *' to run at 10:00 PM daily.
  cron.schedule('0 22 * * *', () => {
    checkAtRiskStudents();
  });
  console.log('✅ Background Cron Jobs initialized.');
};

module.exports = { initCronJobs };
