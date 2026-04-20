import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { LayoutDashboard, Users as UsersIcon, BookOpen, UserPlus, FilePlus, Link2, CheckCircle2, AlertCircle, User } from 'lucide-react';

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

  // Custom Tab Design for SaaS look
  const TabButton = ({ id, label, icon }) => (
    <button 
      style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '10px 16px', background: 'none', border: 'none',
        borderBottom: `2px solid ${tab === id ? 'var(--gray-900)' : 'transparent'}`,
        color: tab === id ? 'var(--gray-900)' : 'var(--gray-500)',
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
      <div className="admin-tabs" style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--gray-200)', marginBottom: '32px' }}>
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
                      <option value="student">Student Account</option>
                      <option value="faculty">Faculty Account</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">Identification Number <span style={{ color: 'var(--gray-400)', fontWeight: 400 }}>(Optional)</span></label><input className="input-sys" placeholder="e.g. 23110318" value={newUser.registrationNumber} onChange={e => setNewUser({ ...newUser, registrationNumber: e.target.value })} /></div>
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
                  <p style={{ fontSize: '13px', color: 'var(--gray-500)', marginBottom: '8px' }}>
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
                      <option value="">Select faculty member...</option>
                      {facultyList.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">Course Type</label>
                    <select className="input-sys" value={newCourse.type} onChange={e => setNewCourse({ ...newCourse, type: e.target.value })}>
                      <option value="theory">Theory (Standard)</option>
                      <option value="lab">Laboratory</option>
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
                        style={{ width: '150px', padding: '2px 6px', fontSize: '12px', borderRadius: '4px', border: '1px solid var(--gray-300)' }} 
                        value={enrollSearch} 
                        onChange={(e) => setEnrollSearch(e.target.value)} 
                      />
                    </label>
                    <select className="input-sys" value={enroll.studentId} onChange={e => setEnroll({ ...enroll, studentId: e.target.value })} required>
                      <option value="">Select student...</option>
                      {studentsList
                        .filter(s => s.name.toLowerCase().includes(enrollSearch.toLowerCase()) || (s.registrationNumber && s.registrationNumber.toLowerCase().includes(enrollSearch.toLowerCase())))
                        .map(s => <option key={s._id} value={s._id}>{s.name} • {s.registrationNumber || s.email}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">Select Target Course</label>
                    <select className="input-sys" value={enroll.courseId} onChange={e => setEnroll({ ...enroll, courseId: e.target.value })} required>
                      <option value="">Select course...</option>
                      {courses.map(c => <option key={c._id} value={c._id}>{c.courseCode} — {c.name}</option>)}
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
          <div className="card mb-6">
            <div className="section-head" style={{ padding: '20px 24px 0' }}>
              <span className="section-title">Faculty Roster</span>
            </div>
            <div className="table-container">
              <table className="table-clean">
                <thead><tr><th>Name</th><th>Email Address</th><th>Identifier</th><th>Assignment Status</th></tr></thead>
                <tbody>
                  {facultyList.map((f, i) => {
                    const assignedCourse = courses.find(c => c.faculty?._id === f._id);
                    return (
                      <tr key={f._id}>
                        <td style={{ fontWeight: 500, color: 'var(--gray-900)' }}>{f.name}</td>
                        <td style={{ color: 'var(--gray-500)' }}>{f.email}</td>
                        <td><span className="badge badge-neutral">{f.registrationNumber || 'No ID'}</span></td>
                        <td>
                          {assignedCourse
                            ? <span className="badge badge-blue">{assignedCourse.courseCode} — {assignedCourse.name}</span>
                            : <span style={{ color: 'var(--gray-400)', fontSize: '12px' }}>Unassigned</span>
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
                  style={{ width: '220px', padding: '6px 12px', fontSize: '13px' }}
                  value={studentSearch} 
                  onChange={(e) => setStudentSearch(e.target.value)} 
                />
              </div>
              <div className="table-container" style={{ maxHeight: '400px' }}>
                <table className="table-clean">
                  <thead><tr><th>Student</th><th>Enrollments</th></tr></thead>
                  <tbody>
                    {studentsList
                      .filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase()) || (s.registrationNumber && s.registrationNumber.toLowerCase().includes(studentSearch.toLowerCase())))
                      .map(s => {
                      const enrolledIn = courses.filter(c => c.students?.some(st => st._id === s._id || st === s._id));
                      return (
                        <tr key={s._id}>
                          <td>
                            <div style={{ fontWeight: 500, color: 'var(--gray-900)' }}>{s.name}</div>
                            <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{s.registrationNumber || s.email}</div>
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
                    {courses.map(c => (
                      <tr key={c._id}>
                        <td><span className="badge badge-neutral">{c.courseCode}</span></td>
                        <td>
                          <div style={{ fontWeight: 500, color: 'var(--gray-900)' }}>{c.name}</div>
                          <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                            <span className={`badge ${c.type === 'lab' ? 'badge-blue' : 'badge-neutral'}`} style={{ fontSize: '10px' }}>{c.type === 'lab' ? 'Lab' : 'Theory'}</span>
                            <span className="badge badge-neutral" style={{ fontSize: '10px' }}>{c.students?.length || 0} enrolled</span>
                          </div>
                        </td>
                        <td style={{ color: 'var(--gray-600)' }}>{c.faculty?.name || '—'}</td>
                        <td style={{ color: 'var(--gray-500)' }}>{c.maxClasses || 30}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
                  {analytics?.atRiskStudents?.length === 0 ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--gray-500)', padding: '32px' }}>No at-risk students found globally!</td></tr>
                  ) : (
                    analytics?.atRiskStudents?.map(s => (
                      <tr key={s._id}>
                        <td>
                          <div style={{ fontWeight: 500, color: 'var(--gray-900)' }}>{s.studentData?.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{s.studentData?.registrationNumber || 'No ID'}</div>
                        </td>
                        <td style={{ color: 'var(--gray-600)' }}>{s.studentData?.email}</td>
                        <td style={{ fontWeight: 600, color: 'var(--red-600)' }}>{s.attendancePercentage.toFixed(1)}%</td>
                        <td>{s.classesAttended} / {s.totalClasses} Attended</td>
                        <td><span className="badge badge-red">At Risk</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
};

export default AdminDashboard;
