import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { PenSquare, FileBarChart, CheckCircle2, AlertCircle, Calendar, FileText, User, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, X } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

const FacultyDashboard = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [message, setMessage] = useState({ text: '', type: '' });
  const [existingRecords, setExistingRecords] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE);
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
        const myCourses = data.filter(c => c.faculty && c.faculty._id === user._id);
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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCourse, date, itemsPerPage]);

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
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredStudents = students.filter((student) => {
    if (!normalizedSearch) return true;
    return (
      student.name.toLowerCase().includes(normalizedSearch) ||
      (student.registrationNumber && student.registrationNumber.toLowerCase().includes(normalizedSearch)) ||
      (student.email && student.email.toLowerCase().includes(normalizedSearch))
    );
  });
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + itemsPerPage);
  const paginationStart = filteredStudents.length > 0 ? startIndex + 1 : 0;
  const paginationEnd = Math.min(startIndex + itemsPerPage, filteredStudents.length);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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
          <div className="card mb-6" style={{ padding: '20px' }}>
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
          </div>

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
              <div className="card mb-6">
                <div className="section-head" style={{ padding: '20px 24px 0', marginBottom: '16px' }}>
                  <span className="section-title">Enrolled Students ({students.length})</span>
                  <div className="flex-start" style={{ gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <div className="table-search-wrap">
                      <Search size={14} className="table-search-icon" />
                      <input
                        className="input-sys table-search-input"
                        type="text"
                        placeholder="Search students..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          className="btn-icon table-clear-btn"
                          onClick={() => setSearchQuery('')}
                          aria-label="Clear student search"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    <span className="badge badge-neutral">Matches: {filteredStudents.length}</span>
                    <span className="badge badge-green">Present: {presentCount}</span>
                    <span className="badge badge-red">Absent: {absentCount}</span>
                    <span className="badge badge-amber">Leave: {leaveCount}</span>
                  </div>
                </div>
                
                <div className="table-container" style={{ maxHeight: '500px' }}>
                  <table className="table-clean">
                    <thead>
                      <tr>
                        <th style={{ width: '60px' }}>#</th>
                        <th>Student Information</th>
                        <th>Status Selection</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedStudents.length === 0 ? (
                        <tr>
                          <td colSpan={3}>
                            <div className="empty-state">
                              <div className="empty-title">No students found</div>
                              <div className="empty-desc">{searchQuery ? 'No enrolled students match your search.' : 'No enrolled students found for this course.'}</div>
                            </div>
                          </td>
                        </tr>
                      ) : paginatedStudents.map((s, i) => {
                        const st = attendanceData[s._id] || 'absent';
                        return (
                          <tr key={s._id}>
                            <td style={{ color: 'var(--gray-400)', fontWeight: 500 }}>{startIndex + i + 1}</td>
                            <td>
                              <div style={{ fontWeight: 500, color: 'var(--gray-900)' }}>{s.name}</div>
                              <div style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '2px' }}>{s.registrationNumber || s.email}</div>
                            </td>
                            <td>
                              <div className="toggle-wrapper">
                                <button type="button" className={`toggle-btn ${st === 'present' ? 'active-present' : ''}`} onClick={() => setStatus(s._id, 'present')}>Present</button>
                                <button type="button" className={`toggle-btn ${st === 'absent' ? 'active-absent' : ''}`} onClick={() => setStatus(s._id, 'absent')}>Absent</button>
                                <button type="button" className={`toggle-btn ${st === 'leave' ? 'active-leave' : ''}`} onClick={() => setStatus(s._id, 'leave')}>Leave</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {filteredStudents.length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', borderTop: '1px solid var(--border-subtle)', gap: '12px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
                      Showing {paginationStart}-{paginationEnd} of {filteredStudents.length} students
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <select
                        className="input-sys"
                        style={{ width: '88px', height: '32px', fontSize: '12px' }}
                        value={itemsPerPage}
                        onChange={(e) => setItemsPerPage(Number(e.target.value))}
                        aria-label="Rows per page"
                      >
                        <option value={5}>5 / page</option>
                        <option value={10}>10 / page</option>
                        <option value={20}>20 / page</option>
                      </select>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '4px 10px' }}
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        aria-label="Go to first page"
                      >
                        <ChevronsLeft size={14} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '4px 10px' }}
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <span style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
                        Page {currentPage} of {totalPages || 1}
                      </span>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '4px 10px' }}
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={currentPage >= totalPages}
                      >
                        <ChevronRight size={14} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '4px 10px' }}
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage >= totalPages}
                        aria-label="Go to last page"
                      >
                        <ChevronsRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="faculty-action-bar flex-between">
                <span style={{ fontSize: '12px', color: 'var(--gray-500)' }}>Please review all entries before saving.</span>
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
