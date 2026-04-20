import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { PenSquare, FileBarChart, Download, Users, AlertCircle, FileText, User } from 'lucide-react';

const FacultyReport = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [report, setReport] = useState(null);
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
        const myCourses = data.filter(c => c.faculty && c.faculty._id === user._id);
        setCourses(myCourses);
      } catch (err) { console.error(err); }
    };
    fetchCourses();
  }, [user]);

  useEffect(() => {
    if (selectedCourse) {
      fetchReport(selectedCourse);
    } else {
      setReport(null);
    }
  }, [selectedCourse]);

  const fetchReport = async (courseId) => {
    setLoading(true);
    try {
      const { data } = await axios.get(`http://localhost:5000/api/attendance/report/${courseId}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setReport(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const exportCSV = () => {
    if (!report || !report.report) return;
    
    // Headers
    let csvContent = 'Student Name,Registration Number,Present,Absent,Total Classes,Attendance Percentage,Status\n';
    
    // Rows
    report.report.forEach(r => {
      const cleanName = r.student.name.replace(/,/g, '');
      const cleanReg = r.student.registrationNumber || 'N/A';
      const status = r.isEligible ? 'Eligible' : 'At Risk';
      csvContent += `${cleanName},${cleanReg},${r.present},${r.absent},${r.total},${r.percentage}%,${status}\n`;
    });

    // Create Blob and Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${report.course.courseCode}_Attendance_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getColor = (pct) => pct >= 75 ? 'var(--green-500)' : pct >= 50 ? 'var(--amber-500)' : 'var(--red-500)';

  const chartData = report?.report?.map(r => ({
    name: r.student.name.split(' ')[0],
    percentage: parseFloat(r.percentage),
  })) || [];

  const belowThreshold = report?.report?.filter(r => parseFloat(r.percentage) < 75).length || 0;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ backgroundColor: '#fff', padding: '12px', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)' }}>
          <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gray-900)', marginBottom: '4px' }}>{payload[0].payload.name}</p>
          <p style={{ fontSize: '13px', color: 'var(--gray-600)' }}>
            Attendance: <span style={{ fontWeight: 600, color: 'var(--gray-900)' }}>{payload[0].value}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Layout navItems={navItems} pageTitle="Reports">
      <div className="page-title">Course Analytics</div>
      <div className="page-subtitle">View aggregate attendance metrics and identify students at risk.</div>

      <div className="card mb-6" style={{ padding: '20px' }}>
        <div className="report-controls flex-between">
          <div className="flex-start">
            <select className="input-sys" style={{ width: '280px' }} value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}>
              <option value="">Select a course to view report...</option>
              {courses.map(c => <option key={c._id} value={c._id}>{c.courseCode} — {c.name}</option>)}
            </select>
            {belowThreshold > 0 && report && !loading && (
              <span className="badge badge-red" style={{ padding: '6px 10px' }}>
                <AlertCircle size={12} style={{ marginRight: '4px', verticalAlign: 'text-top' }} /> 
                {belowThreshold} student{belowThreshold > 1 ? 's' : ''} below 75%
              </span>
            )}
          </div>
          
          {report && !loading && (
            <button className="btn btn-secondary" onClick={() => exportCSV()}>
              <Download size={14} /> Export CSV
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="card" style={{ padding: '40px' }}>
          <div className="skeleton skeleton-title" style={{ width: '200px' }}></div>
          <div className="skeleton skeleton-card" style={{ height: '240px', marginBottom: '24px' }}></div>
          <div className="skeleton skeleton-text"></div>
          <div className="skeleton skeleton-text"></div>
        </div>
      )}

      {report && !loading && (
        <>
          {/* Chart */}
          <div className="card mb-6">
            <div className="section-head" style={{ padding: '20px 24px 0', marginBottom: '16px' }}>
              <span className="section-title">Cohort Distribution</span>
            </div>
            <div style={{ padding: '0 24px 24px', height: '280px', minWidth: 0 }}>
              <ResponsiveContainer width="99%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={28}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--gray-500)' }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--gray-500)' }} axisLine={false} tickLine={false} dx={-10} />
                  <Tooltip cursor={{ fill: 'var(--gray-50)' }} content={<CustomTooltip />} />
                  <ReferenceLine y={75} stroke="var(--red-400)" strokeDasharray="4 4" label={{ value: '75% Minimum', position: 'insideTopRight', fontSize: 10, fill: 'var(--red-500)' }} />
                  <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={`cell-${i}`} fill={getColor(entry.percentage)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Report Table */}
          <div className="card">
            <div className="section-head" style={{ padding: '20px 24px 0', marginBottom: 0 }}>
              <span className="section-title">Student Ledger ({report.report.length})</span>
            </div>
            <div className="table-container">
              <table className="table-clean">
                <thead>
                  <tr>
                    <th>Student Information</th>
                    <th>Attendance Records</th>
                    <th>Percentage</th>
                    <th style={{ width: '160px' }}>Progress</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {report.report.length === 0 ? (
                     <tr>
                       <td colSpan={5}>
                         <div className="empty-state">
                           <Users className="empty-icon" />
                           <div className="empty-title">No students enrolled</div>
                           <div className="empty-desc">There is no attendance data to generate a report for this course.</div>
                         </div>
                       </td>
                     </tr>
                  ) : report.report.map((r, i) => {
                    const pct = parseFloat(r.percentage);
                    const isLow = pct < 75;
                    return (
                      <tr key={r.student._id} className={isLow ? 'tr-warning' : ''}>
                        <td>
                          <div style={{ fontWeight: 500, color: 'var(--gray-900)' }}>{r.student.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '2px' }}>{r.student.registrationNumber || 'No ID'}</div>
                        </td>
                        <td>
                          <div style={{ fontSize: '13px' }}>
                            <span style={{ fontWeight: 500, color: 'var(--green-600)' }}>{r.present}</span>
                            <span style={{ color: 'var(--gray-400)', margin: '0 4px' }}>/</span>
                            <span style={{ fontWeight: 500, color: 'var(--gray-700)' }}>{r.total} Classes</span>
                          </div>
                          {r.absent > 0 && <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>Missed: {r.absent}</div>}
                        </td>
                        <td style={{ fontWeight: 600, color: getColor(pct) }}>{r.percentage}%</td>
                        <td>
                          <div className="meter-rail">
                            <div className={`meter-fill ${pct >= 75 ? 'good' : pct >= 50 ? 'warn' : 'bad'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${r.isEligible ? 'badge-green' : 'badge-red'}`}>
                            {r.isEligible ? 'Eligible' : 'At Risk'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!selectedCourse && !loading && (
        <div className="empty-state">
          <FileBarChart className="empty-icon" style={{ opacity: 0.5 }} />
          <div className="empty-title">Select a Course</div>
          <div className="empty-desc">Choose a course from the dropdown above to view the detailed analytics and ledger.</div>
        </div>
      )}
    </Layout>
  );
};

export default FacultyReport;
