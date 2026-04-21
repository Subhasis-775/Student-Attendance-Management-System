import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { PenSquare, FileBarChart, CheckCircle2, AlertCircle, XCircle, FileText, Inbox, User } from 'lucide-react';

const FacultyLeave = () => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(true);

  const headers = { Authorization: `Bearer ${user.token}` };

  const navItems = [
    { path: '/faculty', label: 'Mark Attendance', icon: <PenSquare /> },
    { path: '/faculty/report', label: 'Attendance Report', icon: <FileBarChart /> },
    { path: '/faculty/leaves', label: 'Leave Approvals', icon: <FileText /> },
    { path: '/profile', label: 'Profile', icon: <User /> },
  ];

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('http://localhost:5000/api/leave/faculty', { headers });
      setLeaves(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchLeaves(); }, [user]);

  const flash = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 4000);
  };

  const handleAction = async (id, status) => {
    try {
      await axios.put(`http://localhost:5000/api/leave/${id}/status`, { status }, { headers });
      flash(`Leave request ${status} successfully.`);
      fetchLeaves();
    } catch (err) {
      flash(err.response?.data?.message || 'Error updating status', 'error');
    }
  };

  const pendingLeaves = leaves.filter(l => l.status === 'pending');
  const pastLeaves = leaves.filter(l => l.status !== 'pending');

  const notifications = pendingLeaves.map(l => 
    `${l.student.name.split(' ')[0]} requested leave for ${l.course.courseCode} on ${new Date(l.date).toLocaleDateString()}`
  );

  return (
    <Layout navItems={navItems} pageTitle="Leave Approvals" notifications={notifications}>
      <div className="page-title">Approval Workflow</div>
      <div className="page-subtitle">Review pending leave applications from students in your courses.</div>

      {msg.text && (
        <div className={`alert-toast alert-${msg.type}`}>
          {msg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {msg.text}
        </div>
      )}

      {/* Pending Reviews Queue */}
      <div className="card mb-6">
        <div className="section-head" style={{ padding: '20px 24px 0' }}>
          <span className="section-title">Pending Queue</span>
          <span className={`badge ${pendingLeaves.length > 0 ? 'badge-amber' : 'badge-neutral'}`}>
            {pendingLeaves.length} Awaiting
          </span>
        </div>
        <div className="table-container">
          <table className="table-clean">
            <thead><tr><th>Student</th><th>Date / Course</th><th>Submitted Justification</th><th>Action</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4}><div className="skeleton skeleton-text" style={{ margin: '12px' }}></div></td></tr>
              ) : pendingLeaves.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <div className="empty-state" style={{ padding: '40px 20px' }}>
                      <Inbox className="empty-icon" style={{ width: '32px', height: '32px' }} />
                      <div className="empty-title">Inbox Zero</div>
                      <div className="empty-desc">There are no pending leave requests to review.</div>
                    </div>
                  </td>
                </tr>
              ) : (
                pendingLeaves.map(l => (
                  <tr key={l._id}>
                    <td>
                       <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{l.student.name}</div>
                       <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{l.student.registrationNumber || 'No ID'}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{new Date(l.date).toLocaleDateString()}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{l.course?.courseCode} — {l.course?.name}</div>
                    </td>
                    <td style={{ maxWidth: '300px', fontSize: '12px', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                      {l.reason}
                    </td>
                    <td>
                      <div className="flex-start" style={{ gap: '8px' }}>
                        <button className="btn btn-primary" style={{ padding: '0 12px', height: '30px' }} onClick={() => handleAction(l._id, 'approved')}>
                          <CheckCircle2 size={14} style={{ marginRight: '4px' }} /> Approve
                        </button>
                        <button className="btn btn-danger" style={{ padding: '0 12px', height: '30px' }} onClick={() => handleAction(l._id, 'rejected')}>
                           Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* History */}
      <h3 className="section-title mb-4" style={{ padding: '0 4px', color: 'var(--text-secondary)', fontSize: '14px' }}>Processed Applications ({pastLeaves.length})</h3>
      <div className="table-container" style={{ opacity: 0.8 }}>
          <table className="table-clean" style={{ background: 'transparent' }}>
            <thead><tr><th>Student</th><th>Course</th><th>Date</th><th>Final Status</th></tr></thead>
            <tbody>
              {pastLeaves.map(l => (
                <tr key={l._id}>
                  <td style={{ fontWeight: 500 }}>{l.student.name}</td>
                  <td style={{ fontSize: '12px' }}>{l.course?.courseCode}</td>
                  <td style={{ fontSize: '12px' }}>{new Date(l.date).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge ${l.status === 'approved' ? 'badge-green' : 'badge-red'}`} style={{ textTransform: 'capitalize' }}>{l.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
      </div>
    </Layout>
  );
};

export default FacultyLeave;
