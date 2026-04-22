const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());
app.get('/', (req, res) => res.send('API running'));
// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/leave', require('./routes/leaveRoutes'));

const { initCronJobs } = require('./services/cronService');
// initCronJobs();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
