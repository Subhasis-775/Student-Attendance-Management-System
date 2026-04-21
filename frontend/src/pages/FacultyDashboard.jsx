import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { PenSquare, FileBarChart, CheckCircle2, AlertCircle, Calendar, FileText, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { SaaSTable } from '../components/SaaSTable';

const FacultyDashboard = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [message, setMessage] = useState({ text: '', type: '' });
  const [existingRecords, setExistingRecords] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  
  const navItems = [
    { path: '/faculty', label: 'Mark Attendance', icon: <PenSquare /> },
    { path: '/faculty/report', label: 'Attendance Report', icon: <FileBarChart /> },
    { path: '/faculty/leaves', label: 'Leave Approvals', icon: <FileText /> },
    { path: '/profile', label: 'Profile', icon: <User /> },
  ];

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data } = await axios.get('http://localhost:5000/api/admin/courses', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        const myCourses = data.filter(c => c.faculty && c.faculty.some(f => String(f._id) === String(user._id)));
        setCourses(myCourses);
      } catch (err) { console.error(err); }
    };
    fetchCourses();
  }, [user]);

  useEffect(() => {
    if (selectedCourse) {
      const course = courses.find(c => c._id === selectedCourse);
      if (course && course.students) {
        setStudents(course.students);
        const initialMap = {};
        course.students.forEach(s => initialMap[s._id] = 'absent');
        setAttendanceData(initialMap);
        fetchExisting(selectedCourse, initialMap);
      }
    } else {
      setStudents([]);
      setAttendanceData({});
    }
  }, [selectedCourse, date, courses]);

  const fetchExisting = async (courseId, fallback) => {
    try {
      const { data } = await axios.get(`http://localhost:5000/api/attendance/course/${courseId}?date=${date}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      if (data.length > 0) {
        setExistingRecords(true);
        const updated = { ...fallback };
        data.forEach(r => {
          const sid = r.student._id || r.student;
          if (updated.hasOwnProperty(sid)) updated[sid] = r.status;
        });
        setAttendanceData(updated);
      } else {
        setExistingRecords(false);
      }
    } catch { setExistingRecords(false); }
  };

  const setStatus = (studentId, status) => {
    setAttendanceData(prev => ({ ...prev, [studentId]: status }));
  };

  const selectAll = (status) => {
    const updated = {};
    students.forEach(s => updated[s._id] = status);
    setAttendanceData(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCourse || !date) return;
    setLoading(true);
    const studentsData = Object.keys(attendanceData).map(key => ({ studentId: key, status: attendanceData[key] }));
    try {
      await axios.post('http://localhost:5000/api/attendance', { date, courseId: selectedCourse, studentsData }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setMessage({ text: 'Attendance saved successfully', type: 'success' });
      setExistingRecords(true);
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to save attendance', type: 'error' });
    }
    setLoading(false);
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const presentCount = Object.values(attendanceData).filter(s => s === 'present').length;
  const absentCount = Object.values(attendanceData).filter(s => s === 'absent').length;
  const leaveCount = Object.values(attendanceData).filter(s => s === 'leave').length;

  const studentColumns = useMemo(() => [
    { id: 'index', header: '#', cell: info => <div style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{info.row.index + 1}</div> },
    { id: 'info', header: 'Student Information', accessorKey: 'name', cell: info => (
      <div>
        <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{info.getValue()}</div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{info.row.original.registrationNumber || info.row.original.email}</div>
      </div>
    ) },
    { id: 'status', header: 'Status Selection', cell: ({ row }) => {
      const s = row.original;
      const st = attendanceData[s._id] || 'absent';
      return (
        <div className="toggle-wrapper" onClick={e => e.stopPropagation()}>
          <button type="button" className={`toggle-btn ${st === 'present' ? 'active-present' : ''}`} onClick={(e) => { e.preventDefault(); setStatus(s._id, 'present'); }}>Present</button>
          <button type="button" className={`toggle-btn ${st === 'absent' ? 'active-absent' : ''}`} onClick={(e) => { e.preventDefault(); setStatus(s._id, 'absent'); }}>Absent</button>
          <button type="button" className={`toggle-btn ${st === 'leave' ? 'active-leave' : ''}`} onClick={(e) => { e.preventDefault(); setStatus(s._id, 'leave'); }}>Leave</button>
        </div>
      );
    } }
  ], [attendanceData]);

  return (
    <Layout navItems={navItems} pageTitle="Mark Attendance">
      <div className="page-title">Daily Attendance</div>
      <div className="page-subtitle">Select a course and date to record attendance manually.</div>

      {message.text && (
        <div className={`alert-toast alert-${message.type}`}>
          {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      {courses.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Calendar className="empty-icon" />
            <div className="empty-title">No assigned courses</div>
            <div className="empty-desc">You haven't been assigned any courses for the current term. Please contact the administration.</div>
          </div>
        </div>
      ) : (
        <>
          <motion.div className="card mb-6" style={{ padding: '20px' }} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 100 }}>
            <div className="faculty-controls flex-between">
              <div className="flex-start">
                <select className="input-sys" style={{ width: '260px' }} value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}>
                  <option value="">Select an assigned course...</option>
                  {courses.map(c => <option key={c._id} value={c._id}>{c.courseCode} — {c.name}</option>)}
                </select>
                <input className="input-sys" style={{ width: '160px' }} type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              
              {selectedCourse && (
                <div className="flex-start">
                  <button className="btn btn-secondary" type="button" onClick={() => selectAll('absent')}>Mark All Absent</button>
                  <button className="btn btn-primary" type="button" onClick={() => selectAll('present')}>Mark All Present</button>
                </div>
              )}
            </div>
          </motion.div>

          {existingRecords && (
            <div className="alert-toast alert-info">
              <AlertCircle size={16} />
              Attendance for this date already exists. Any changes made will update the current record.
            </div>
          )}

          {selectedCourse && students.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-title">No students enrolled</div>
                <div className="empty-desc">There are no students currently enrolled in this course class.</div>
              </div>
            </div>
          ) : selectedCourse && students.length > 0 ? (
            <form onSubmit={handleSubmit}>
              <motion.div className="card mb-6" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 100 }}>
                <div className="section-head" style={{ padding: '20px 24px 0', marginBottom: '16px' }}>
                  <span className="section-title">Enrolled Students ({students.length})</span>
                  <div className="flex-start" style={{ gap: '8px' }}>
                    <span className="badge badge-green">Present: {presentCount}</span>
                    <span className="badge badge-red">Absent: {absentCount}</span>
                    <span className="badge badge-amber">Leave: {leaveCount}</span>
                  </div>
                </div>
                
                <SaaSTable 
                  data={students} 
                  columns={studentColumns}
                  searchPlaceholder="Search enrolled students..."
                  defaultPageSize={10}
                />
              </motion.div>
              
              <div className="faculty-action-bar flex-between">
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Please review all entries before saving.</span>
                <button className="btn btn-primary" style={{ padding: '0 24px' }} type="submit" disabled={loading}>
                  {loading ? 'Saving Records...' : existingRecords ? 'Update Final Record' : 'Save Attendance Record'}
                </button>
              </div>
            </form>
          ) : null}
        </>
      )}
    </Layout>
  );
};

export default FacultyDashboard;
