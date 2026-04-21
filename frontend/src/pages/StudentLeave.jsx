import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { LayoutDashboard, BookOpen, Clock, AlertCircle, FilePlus, Calendar, User } from 'lucide-react';

const StudentLeave = () => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [courses, setCourses] = useState([]);
  const [formData, setFormData] = useState({ courseId: '', date: '', reason: '' });
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(true);

  const headers = { Authorization: `Bearer ${user.token}` };

  const navItems = [
    { path: '/student', label: 'Overview', icon: <LayoutDashboard /> },
    { path: '/student/subjects', label: 'My Subjects', icon: <BookOpen /> },
    { path: '/student/leaves', label: 'Leave Requests', icon: <Calendar /> },
    { path: '/profile', label: 'Profile', icon: <User /> },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [leavesRes, statsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/leave', { headers }),
        axios.get('http://localhost:5000/api/attendance/stats', { headers })
      ]);
      setLeaves(leavesRes.data);
      // We can grab the user's enrolled courses from stats!
      const uniqueCourses = statsRes.data.map(s => s.course);
      setCourses(uniqueCourses);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const flash = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/leave', formData, { headers });
      flash('Leave application submitted successfully');
      setFormData({ courseId: '', date: '', reason: '' });
      fetchData();
    } catch (err) {
      flash(err.response?.data?.message || 'Failed to submit leave', 'error');
    }
  };

  const getBadgeColor = (status) => {
    if (status === 'approved') return 'badge-green';
    if (status === 'rejected') return 'badge-red';
    return 'badge-amber';
  };

  return (
    <Layout navItems={navItems} pageTitle="Leave Requests">
      <div className="page-title">Leave Management</div>
      <div className="page-subtitle">Submit and track official leave applications for your courses.</div>

      {msg.text && (
        <div className={`alert-toast alert-${msg.type}`}>
          {msg.type === 'success' ? <FilePlus size={16} /> : <AlertCircle size={16} />}
          {msg.text}
        </div>
      )}

      <div className="leave-layout-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.5fr)', gap: '24px' }}>
        
        {/* New Leave Form */}
        <div className="card mb-6" style={{ height: 'fit-content' }}>
          <div className="section-head" style={{ padding: '20px 24px 0' }}>
            <span className="section-title">Apply for Leave</span>
          </div>
          <div style={{ padding: '24px' }}>
            {courses.length === 0 && !loading ? (
               <div style={{ fontSize: '13px', color: 'var(--amber-600)', background: 'var(--amber-50)', padding: '12px', borderRadius: '6px' }}>
                 You are not enrolled in any courses to apply leave for.
               </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Course</label>
                  <select className="input-sys" value={formData.courseId} onChange={e => setFormData({ ...formData, courseId: e.target.value })} required>
                    <option value="">Select a course...</option>
                    {courses.map(c => <option key={c._id} value={c._id}>{c.courseCode} — {c.name}</option>)}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Date of Leave</label>
                  <input className="input-sys" type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Reason</label>
                  <textarea 
                    className="input-sys" 
                    style={{ height: '80px', paddingTop: '8px', paddingBottom: '8px', resize: 'vertical' }} 
                    value={formData.reason} 
                    onChange={e => setFormData({ ...formData, reason: e.target.value })} 
                    required 
                    placeholder="Provide a specific justification..."
                  />
                </div>
                
                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-primary" type="submit" disabled={loading}>Submit Application</button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* History Table */}
        <div className="card">
          <div className="section-head" style={{ padding: '20px 24px 0' }}>
            <span className="section-title">Application History</span>
          </div>
          <div className="table-container">
            <table className="table-clean">
              <thead><tr><th>Date</th><th>Course</th><th>Reason</th><th>Status</th></tr></thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4}><div className="skeleton skeleton-text" style={{ margin: '12px' }}></div></td></tr>
                ) : leaves.length === 0 ? (
                  <tr>
                    <td colSpan={4}>
                      <div className="empty-state" style={{ padding: '40px 20px' }}>
                        <Clock className="empty-icon" style={{ width: '32px', height: '32px' }} />
                        <div className="empty-title">No applications</div>
                        <div className="empty-desc">You haven't submitted any leave requests yet.</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  leaves.map(l => (
                    <tr key={l._id}>
                      <td style={{ fontWeight: 500 }}>{new Date(l.date).toLocaleDateString()}</td>
                      <td>
                         <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{l.course?.name || '—'}</div>
                         <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{l.course?.type === 'lab' ? 'Lab' : 'Theory'}  •  {l.course?.courseCode}</div>
                      </td>
                      <td style={{ maxWidth: '200px', fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={l.reason}>
                        {l.reason}
                      </td>
                      <td>
                        <span className={`badge ${getBadgeColor(l.status)}`} style={{ textTransform: 'capitalize' }}>{l.status}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default StudentLeave;
