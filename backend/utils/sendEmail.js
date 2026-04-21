const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
dotenv.config();

// Simplified Gmail configuration using App Password
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // Use SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Error connecting to email server:', error.message);
    console.log('💡 Make sure you have set EMAIL_USER and EMAIL_PASSWORD in .env');
  } else {
    console.log('✅ Email server is ready to send messages');
  }
});

const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"AttendEase System" <${process.env.EMAIL_USER}>`,
      to, 
      subject, 
      text,
      html, 
    });

    console.log('✅ Email sent successfully to:', to);
    console.log('📧 Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
  }
};

module.exports = sendEmail;
