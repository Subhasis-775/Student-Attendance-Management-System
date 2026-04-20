import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { LayoutDashboard, Users as UsersIcon, BookOpen, UserPlus, FilePlus, Link2, CheckCircle2, AlertCircle, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Pagination = ({ currentPage, totalItems, itemsPerPage, onPageChange }) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div style={{ display: 'flex', gap: '4px', padding: '12px 24px', borderTop: '1px solid var(--border-subtle)', justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap' }}>
      <button disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)} className="btn-icon" style={{ padding: '4px' }}><ChevronLeft size={16} /></button>
      {getPageNumbers().map((page, index) => {
        if (page === '...') {
          return <span key={`ellipsis-${index}`} style={{ padding: '4px 8px', color: 'var(--text-muted)' }}>...</span>;
        }
        return (
          <button key={`page-${page}`} onClick={() => onPageChange(page)} className={`btn ${currentPage === page ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '4px 10px', fontSize: '12px', minWidth: '32px' }}>
            {page}
          </button>
        );
      })}
      <button disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)} className="btn-icon" style={{ padding: '4px' }}><ChevronRight size={16} /></button>
    </div>
  );
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [analytics, setAnalytics] = useState({ lowestCourse: null, atRiskStudents: [] });
  const [tab, setTab] = useState('overview');
  const [newUser, setNewUser] = useState({ name: '', email: '', password: 'password123', role: 'student', registrationNumber: '' });
  const [newCourse, setNewCourse] = useState({ courseCode: '', name: '', faculty: '', type: 'theory', maxClasses: '' });
  const [enroll, setEnroll] = useState({ studentId: '', courseId: '' });
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [studentSearch, setStudentSearch] = useState('');
  const [enrollSearch, setEnrollSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [facultyPage, setFacultyPage] = useState(1);
  const [studentPage, setStudentPage] = useState(1);
  const [coursePage, setCoursePage] = useState(1);
  const [atRiskPage, setAtRiskPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const headers = { Authorization: `Bearer ${user.token}` };

  const navItems = [
    { path: '/admin', label: 'Administration', icon: <LayoutDashboard /> },
    { path: '/profile', label: 'Profile', icon: <User /> },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [u, c, a] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/users', { headers }),
        axios.get('http://localhost:5000/api/admin/courses', { headers }),
        axios.get('http://localhost:5000/api/admin/analytics', { headers }),
      ]);
      setUsers(u.data);
      setCourses(c.data);
      setAnalytics(a.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };
  
  useEffect(() => { fetchData(); }, [user]);

  const flash = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 4000);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/admin/users', {
        ...newUser,
        registrationNumber: newUser.registrationNumber || undefined
      }, { headers });
      flash('User provisioned successfully');
      setNewUser({ name: '', email: '', password: 'password123', role: 'student', registrationNumber: '' });
      fetchData();
    } catch (err) { flash(err.response?.data?.message || 'Error creating user', 'error'); }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...newCourse };
      if (!payload.maxClasses) delete payload.maxClasses;
      await axios.post('http://localhost:5000/api/admin/courses', payload, { headers });
      flash('Course added to registry successfully');
      setNewCourse({ courseCode: '', name: '', faculty: '', type: 'theory', maxClasses: '' });
      fetchData();
    } catch (err) { flash(err.response?.data?.message || 'Error creating course', 'error'); }
  };

  const handleEnroll = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/admin/enroll', enroll, { headers });
      flash('Enrollment record created');
      setEnroll({ studentId: '', courseId: '' });
      fetchData();
    } catch (err) { flash(err.response?.data?.message || 'Error', 'error'); }
  };

  const handleEnrollAll = async () => {
    if (!enroll.studentId) { flash('Select a student first', 'error'); return; }
    try {
      await axios.post('http://localhost:5000/api/admin/enroll-all', { studentId: enroll.studentId }, { headers });
      flash('Student successfully enrolled in all active courses');
      fetchData();
    } catch (err) { flash(err.response?.data?.message || 'Error', 'error'); }
  };

  const studentsList = users.filter(u => u.role === 'student');
  const facultyList = users.filter(u => u.role === 'faculty');

  const filteredStudents = studentsList.filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase()) || (s.registrationNumber && s.registrationNumber.toLowerCase().includes(studentSearch.toLowerCase())));
  const paginatedStudents = filteredStudents.slice((studentPage - 1) * ITEMS_PER_PAGE, studentPage * ITEMS_PER_PAGE);
  const paginatedFaculty = facultyList.slice((facultyPage - 1) * ITEMS_PER_PAGE, facultyPage * ITEMS_PER_PAGE);
  const paginatedCourses = courses.slice((coursePage - 1) * ITEMS_PER_PAGE, coursePage * ITEMS_PER_PAGE);
  const paginatedAtRisk = analytics?.atRiskStudents?.slice((atRiskPage - 1) * ITEMS_PER_PAGE, atRiskPage * ITEMS_PER_PAGE) || [];

  // Custom Tab Design for SaaS look
  const TabButton = ({ id, label, icon }) => (
    <button 
      style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '10px 16px', background: 'none', border: 'none',
        borderBottom: `2px solid ${tab === id ? 'var(--text-primary)' : 'transparent'}`,
        color: tab === id ? 'var(--text-primary)' : 'var(--text-muted)',
        fontWeight: 500, fontSize: '13px', cursor: 'pointer',
        transition: 'all 0.2s ease', userSelect: 'none'
      }}
      onClick={() => setTab(id)}
    >
      {icon} {label}
    </button>
  );

  return (
    <Layout navItems={navItems} pageTitle="Administration Hub">
      <div className="page-title">Administration Hub</div>
      <div className="page-subtitle">Central management for users, courses, and registry operations.</div>

      {msg.text && (
        <div className={`alert-toast alert-${msg.type}`}>
          {msg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {msg.text}
        </div>
      )}

      {loading ? (
        <div className="kpi-grid">
          <div className="skeleton skeleton-card"></div>
          <div className="skeleton skeleton-card"></div>
          <div className="skeleton skeleton-card"></div>
          <div className="skeleton skeleton-card"></div>
        </div>
      ) : (
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-title">Active Students <UsersIcon size={16} className="kpi-icon" /></div>
            <div className="kpi-value">{studentsList.length}</div>
            <div className="kpi-meta" style={{ color: 'var(--green-600)' }}>Platform users</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-title">Faculty Members <UsersIcon size={16} className="kpi-icon" /></div>
            <div className="kpi-value">{facultyList.length}</div>
            <div className="kpi-meta" style={{ color: 'var(--amber-600)' }}>Teaching staff</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-title">Active Courses <BookOpen size={16} className="kpi-icon" /></div>
            <div className="kpi-value">{courses.length}</div>
            <div className="kpi-meta" style={{ color: 'var(--primary-600)' }}>Term registry</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-title">Lowest Attendance Crs <AlertCircle size={16} className="kpi-icon" style={{ color: 'var(--red-600)' }} /></div>
            <div className="kpi-value">{analytics?.lowestCourse ? `${analytics.lowestCourse.attendancePercentage.toFixed(1)}%` : 'N/A'}</div>
            <div className="kpi-meta" style={{ color: 'var(--red-600)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {analytics?.lowestCourse ? `${analytics.lowestCourse.courseData?.courseCode} - ${analytics.lowestCourse.courseData?.name}` : 'Not enough data'}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="admin-tabs" style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '32px' }}>
        <TabButton id="overview" label="Registry Overview" icon={<LayoutDashboard size={14} />} />
        <TabButton id="add-user" label="Provision User" icon={<UserPlus size={14} />} />
        <TabButton id="bulk-upload" label="Bulk Provision" icon={<FilePlus size={14} />} />
        <TabButton id="add-course" label="New Course" icon={<FilePlus size={14} />} />
        <TabButton id="enroll" label="Enrollments" icon={<Link2 size={14} />} />
      </div>

      <div style={{ maxWidth: tab !== 'overview' ? '800px' : 'none' }}>
        {/* Provision User App */}
        {tab === 'add-user' && (
          <div className="card mb-6">
            <div className="section-head" style={{ padding: '20px 24px 0' }}>
              <span className="section-title">Provision New User</span>
            </div>
            <div style={{ padding: '24px' }}>
              <form onSubmit={handleCreateUser}>
                <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group"><label className="form-label">Full Name</label><input className="input-sys" placeholder="Jane Doe" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} required /></div>
                  <div className="form-group"><label className="form-label">Email Address</label><input className="input-sys" type="email" placeholder="jane@university.edu" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} required /></div>
                  <div className="form-group"><label className="form-label">System Role</label>
                    <select className="input-sys" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                      <option value="student" style={{ background: 'var(--bg-surface)' }}>Student Account</option>
                      <option value="faculty" style={{ background: 'var(--bg-surface)' }}>Faculty Account</option>
                      <option value="admin" style={{ background: 'var(--bg-surface)' }}>Administrator</option>
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">Identification Number <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</span></label><input className="input-sys" placeholder="e.g. 23110318" value={newUser.registrationNumber} onChange={e => setNewUser({ ...newUser, registrationNumber: e.target.value })} /></div>
                  <div className="form-group"><label className="form-label">Initial Password</label><input className="input-sys" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} required /></div>
                </div>
                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-primary" type="submit">Provision Account</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Bulk Upload App */}
        {tab === 'bulk-upload' && (
          <div className="card mb-6">
            <div className="section-head" style={{ padding: '20px 24px 0' }}>
              <span className="section-title">Bulk Provision Users (.csv)</span>
            </div>
            <div style={{ padding: '24px' }}>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const fileInput = e.target.elements.csvFile;
                if (!fileInput.files[0]) { flash('Please select a CSV file', 'error'); return; }
                const formData = new FormData();
                formData.append('file', fileInput.files[0]);
                try {
                  const res = await axios.post('http://localhost:5000/api/admin/users/bulk', formData, { headers });
                  flash(res.data.message);
                  fetchData();
                  fileInput.value = '';
                } catch (err) { flash(err.response?.data?.message || 'Error uploading file', 'error'); }
              }}>
                <div className="form-group">
                  <label className="form-label">Upload CSV File</label>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    CSV must include headers: <strong>name, registrationNumber</strong>. (email, role, password are optional). Email defaults to <i>registrationNumber@university.edu</i>. Role defaults to <i>student</i>. Password defaults to <i>password123</i>.
                  </p>
                  <input className="input-sys" type="file" name="csvFile" accept=".csv" required style={{ padding: '6px 12px' }} />
                </div>
                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-start' }}>
                  <button className="btn btn-primary" type="submit">Process File</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Course App */}
        {tab === 'add-course' && (
          <div className="card mb-6">
            <div className="section-head" style={{ padding: '20px 24px 0' }}>
              <span className="section-title">Register New Course</span>
            </div>
            <div style={{ padding: '24px' }}>
              <form onSubmit={handleCreateCourse}>
                <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
                  <div className="form-group"><label className="form-label">Course Code</label><input className="input-sys" placeholder="e.g. CS301" value={newCourse.courseCode} onChange={e => setNewCourse({ ...newCourse, courseCode: e.target.value })} required /></div>
                  <div className="form-group"><label className="form-label">Official Course Name</label><input className="input-sys" placeholder="Advanced Database Systems" value={newCourse.name} onChange={e => setNewCourse({ ...newCourse, name: e.target.value })} required /></div>
                </div>
                <div className="form-grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div className="form-group"><label className="form-label">Assign Faculty</label>
                    <select className="input-sys" value={newCourse.faculty} onChange={e => setNewCourse({ ...newCourse, faculty: e.target.value })} required>
                      <option value="" style={{ background: 'var(--bg-surface)' }}>Select faculty member...</option>
                      {facultyList.map(f => <option key={f._id} value={f._id} style={{ background: 'var(--bg-surface)' }}>{f.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">Course Type</label>
                    <select className="input-sys" value={newCourse.type} onChange={e => setNewCourse({ ...newCourse, type: e.target.value })}>
                      <option value="theory" style={{ background: 'var(--bg-surface)' }}>Theory (Standard)</option>
                      <option value="lab" style={{ background: 'var(--bg-surface)' }}>Laboratory</option>
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">Max Classes Override</label><input className="input-sys" type="number" placeholder={newCourse.type === 'lab' ? 'Defaults to 10' : 'Defaults to 30'} value={newCourse.maxClasses} onChange={e => setNewCourse({ ...newCourse, maxClasses: e.target.value })} /></div>
                </div>
                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-primary" type="submit">Register Course</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Enroll Form */}
        {tab === 'enroll' && (
          <div className="card mb-6">
            <div className="section-head" style={{ padding: '20px 24px 0' }}>
              <span className="section-title">Manage Enrollments</span>
            </div>
            <div style={{ padding: '24px' }}>
              <form onSubmit={handleEnroll}>
                <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Select Student</span>
                      <input 
                        type="text" 
                        placeholder="Search student..." 
                        style={{ width: '150px', padding: '2px 6px', fontSize: '12px', borderRadius: '4px', border: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--text-primary)' }} 
                        value={enrollSearch} 
                        onChange={(e) => setEnrollSearch(e.target.value)} 
                      />
                    </label>
                    <select className="input-sys" value={enroll.studentId} onChange={e => setEnroll({ ...enroll, studentId: e.target.value })} required>
                      <option value="" style={{ background: 'var(--bg-surface)' }}>Select student...</option>
                      {studentsList
                        .filter(s => s.name.toLowerCase().includes(enrollSearch.toLowerCase()) || (s.registrationNumber && s.registrationNumber.toLowerCase().includes(enrollSearch.toLowerCase())))
                        .map(s => <option key={s._id} value={s._id} style={{ background: 'var(--bg-surface)' }}>{s.name} • {s.registrationNumber || s.email}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">Select Target Course</label>
                    <select className="input-sys" value={enroll.courseId} onChange={e => setEnroll({ ...enroll, courseId: e.target.value })} required>
                      <option value="" style={{ background: 'var(--bg-surface)' }}>Select course...</option>
                      {courses.map(c => <option key={c._id} value={c._id} style={{ background: 'var(--bg-surface)' }}>{c.courseCode} — {c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="enroll-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                  <button className="btn btn-secondary" type="button" onClick={handleEnrollAll}>Bulk Enroll in ALL Courses</button>
                  <button className="btn btn-primary" type="submit">Process Single Enrollment</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Overview Tables */}
      {(tab === 'overview') && !loading && (
        <>
          {/* Charts Section */}
          <div className="admin-overview-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1.2fr)', gap: '24px', marginBottom: '24px' }}>
             {/* Line Chart */}
             <div className="card">
                <div className="section-head" style={{ padding: '20px 24px 0' }}>
                   <span className="section-title">University Attendance Trend (30 Days)</span>
                </div>
                <div style={{ height: '300px', padding: '20px', paddingLeft: '0px' }}>
                   <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={[
                         { date: 'Mar 21', attendance: 82 }, { date: 'Mar 23', attendance: 85 },
                         { date: 'Mar 25', attendance: 88 }, { date: 'Mar 27', attendance: 83 },
                         { date: 'Mar 29', attendance: 91 }, { date: 'Mar 31', attendance: 90 },
                         { date: 'Apr 02', attendance: 87 }, { date: 'Apr 04', attendance: 85 },
                         { date: 'Apr 06', attendance: 88 }, { date: 'Apr 10', attendance: 89 },
                         { date: 'Apr 12', attendance: 92 }, { date: 'Apr 14', attendance: 94 },
                         { date: 'Apr 16', attendance: 93 }, { date: 'Apr 18', attendance: 95 }
                      ]}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                         <XAxis dataKey="date" axisLine={false} tickLine={false} stroke="var(--text-muted)" fontSize={12} dy={10} />
                         <YAxis axisLine={false} tickLine={false} stroke="var(--text-muted)" fontSize={12} dx={-10} domain={[60, 100]} />
                         <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', borderRadius: '8px', color: 'var(--text-primary)' }} itemStyle={{ color: 'var(--primary-500)' }} />
                         <Line type="monotone" dataKey="attendance" stroke="var(--primary-500)" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: 'var(--primary-500)', stroke: 'var(--bg-surface)', strokeWidth: 2 }} />
                      </LineChart>
                   </ResponsiveContainer>
                </div>
             </div>
             
             {/* Donut Chart */}
             <div className="card">
                <div className="section-head" style={{ padding: '20px 24px 0' }}>
                   <span className="section-title">Global Status Ratio</span>
                </div>
                <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                   <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                         <Pie
                            data={[
                               { name: 'Present', value: 75, color: 'var(--green-500)' },
                               { name: 'Absent', value: 15, color: 'var(--red-500)' },
                               { name: 'On Leave', value: 10, color: 'var(--amber-500)' }
                            ]}
                            cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={2} dataKey="value" stroke="none"
                         >
                            { [
                               { name: 'Present', value: 75, color: 'var(--green-500)' },
                               { name: 'Absent', value: 15, color: 'var(--red-500)' },
                               { name: 'On Leave', value: 10, color: 'var(--amber-500)' }
                            ].map((entry, index) => <Cell key={index} fill={entry.color} />) }
                         </Pie>
                         <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                      </PieChart>
                   </ResponsiveContainer>
                   <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--green-500)' }}></div> Present</div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--red-500)' }}></div> Absent</div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--amber-500)' }}></div> Leave</div>
                   </div>
                </div>
             </div>
          </div>

          <div className="card mb-6">
            <div className="section-head" style={{ padding: '20px 24px 0' }}>
              <span className="section-title">Faculty Roster</span>
            </div>
            <div className="table-container">
              <table className="table-clean">
                <thead><tr><th>Name</th><th>Email Address</th><th>Identifier</th><th>Assignment Status</th></tr></thead>
                <tbody>
                  {paginatedFaculty.map((f, i) => {
                    const assignedCourse = courses.find(c => c.faculty?._id === f._id);
                    return (
                      <tr key={f._id}>
                        <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{f.name}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{f.email}</td>
                        <td><span className="badge badge-neutral">{f.registrationNumber || 'No ID'}</span></td>
                        <td>
                          {assignedCourse
                            ? <span className="badge badge-blue">{assignedCourse.courseCode} — {assignedCourse.name}</span>
                            : <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Unassigned</span>
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={facultyPage} totalItems={facultyList.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setFacultyPage} />
          </div>

          <div className="admin-overview-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.2fr)', gap: '24px' }}>
            {/* Students List */}
            <div className="card">
              <div className="section-head" style={{ padding: '20px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="section-title">Student Directory</span>
                <input 
                  type="text" 
                  placeholder="Search directory..." 
                  className="input-sys" 
                  style={{ width: '220px', padding: '6px 12px', fontSize: '13px', background: 'transparent' }}
                  value={studentSearch} 
                  onChange={(e) => setStudentSearch(e.target.value)} 
                />
              </div>
              <div className="table-container" style={{ maxHeight: '400px' }}>
                <table className="table-clean">
                  <thead><tr><th>Student</th><th>Enrollments</th></tr></thead>
                  <tbody>
                    {paginatedStudents.map(s => {
                      const enrolledIn = courses.filter(c => c.students?.some(st => st._id === s._id || st === s._id));
                      return (
                        <tr key={s._id}>
                          <td>
                            <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{s.name}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{s.registrationNumber || s.email}</div>
                          </td>
                          <td>
                            {enrolledIn.length > 0
                              ? <span className="badge badge-neutral">{enrolledIn.length} courses</span>
                              : <span className="badge badge-red">Unenrolled</span>
                            }
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination currentPage={studentPage} totalItems={filteredStudents.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setStudentPage} />
            </div>

            {/* Courses List */}
            <div className="card">
              <div className="section-head" style={{ padding: '20px 24px 0' }}>
                <span className="section-title">Course Registry</span>
              </div>
              <div className="table-container" style={{ maxHeight: '400px' }}>
                <table className="table-clean">
                  <thead><tr><th>Code</th><th>Name & Details</th><th>Faculty Lead</th><th>Cap</th></tr></thead>
                  <tbody>
                    {paginatedCourses.map(c => (
                      <tr key={c._id}>
                        <td><span className="badge badge-neutral">{c.courseCode}</span></td>
                        <td>
                          <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{c.name}</div>
                          <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                            <span className={`badge ${c.type === 'lab' ? 'badge-blue' : 'badge-neutral'}`} style={{ fontSize: '10px' }}>{c.type === 'lab' ? 'Lab' : 'Theory'}</span>
                            <span className="badge badge-neutral" style={{ fontSize: '10px' }}>{c.students?.length || 0} enrolled</span>
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>{c.faculty?.name || '—'}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{c.maxClasses || 30}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination currentPage={coursePage} totalItems={courses.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setCoursePage} />
            </div>
          </div>
          <div className="card" style={{ marginTop: '24px', marginBottom: '24px' }}>
            <div className="section-head" style={{ padding: '20px 24px 0' }}>
              <span className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={18} className="text-red-600" />
                University-Wide At-Risk Students (&lt; 75% Global)
              </span>
            </div>
            <div className="table-container" style={{ maxHeight: '400px' }}>
              <table className="table-clean">
                <thead><tr><th>Student</th><th>Email Address</th><th>Global Attendance</th><th>Classes Summary</th><th>Status</th></tr></thead>
                <tbody>
                  {paginatedAtRisk.length === 0 ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '32px' }}>No at-risk students found globally!</td></tr>
                  ) : (
                    paginatedAtRisk.map(s => (
                      <tr key={s._id}>
                        <td>
                          <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{s.studentData?.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.studentData?.registrationNumber || 'No ID'}</div>
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>{s.studentData?.email}</td>
                        <td style={{ fontWeight: 600, color: 'var(--red-600)' }}>{s.attendancePercentage.toFixed(1)}%</td>
                        <td>{s.classesAttended} / {s.totalClasses} Attended</td>
                        <td><span className="badge badge-red">At Risk</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={atRiskPage} totalItems={analytics?.atRiskStudents?.length || 0} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setAtRiskPage} />
          </div>
        </>
      )}
    </Layout>
  );
};

export default AdminDashboard;
