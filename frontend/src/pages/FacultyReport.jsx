import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { PenSquare, FileBarChart, Download, Users, AlertCircle, FileText, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { SaaSTable } from '../components/SaaSTable';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ backgroundColor: 'var(--bg-glass)', backdropFilter: 'blur(12px)', padding: '12px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)' }}>
        <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{payload[0].payload.name}</p>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Attendance: <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{payload[0].value}%</span>
        </p>
      </div>
    );
  }
  return null;
};

const FacultyReport = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
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
        const myCourses = data.filter(c => c.faculty && c.faculty.some(f => String(f._id) === String(user._id)));
        setCourses(myCourses);
      } catch (err) { console.error(err); }
    };
    fetchCourses();
  }, [user]);

  const fetchReport = async (courseId, month = selectedMonth) => {
    setLoading(true);
    try {
      const { data } = await axios.get(`http://localhost:5000/api/attendance/report/${courseId}?month=${month}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setReport(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleCourseChange = (courseId) => {
    setSelectedCourse(courseId);
    if (!courseId) {
      setReport(null);
      return;
    }
    fetchReport(courseId, selectedMonth);
  };

  const handleMonthChange = (month) => {
    setSelectedMonth(month);
    if (selectedCourse) fetchReport(selectedCourse, month);
  };

  const exportCSV = () => {
    if (!report || !report.report) return;
    
    // Headers
    let csvContent = 'Student Name,Registration Number,Present,Absent,Total Classes,Attendance Percentage,Status\n';
    
    // Rows
    report.report.forEach(r => {
      const cleanName = r.student.name.replace(/,/g, '');
      const cleanReg = r.student.registrationNumber || 'N/A';
      const status = r.isEligible ? 'Eligible' : 'Not Eligible';
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

  const ledgerColumns = useMemo(() => [
    { id: 'info', header: 'Student Information', cell: ({ row }) => {
      const r = row.original;
      return (
        <div>
          <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{r.student.name}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{r.student.registrationNumber || 'No ID'}</div>
        </div>
      );
    } },
    { id: 'records', header: 'Attendance Records', cell: ({ row }) => {
      const r = row.original;
      return (
        <div>
          <div style={{ fontSize: '13px' }}>
            <span style={{ fontWeight: 500, color: 'var(--green-600)' }}>{r.present}</span>
            <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>/</span>
            <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{r.total} Classes</span>
          </div>
          {r.absent > 0 && <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Missed: {r.absent}</div>}
        </div>
      );
    } },
    { id: 'percentage', header: 'Percentage', accessorKey: 'percentage', cell: ({ row }) => {
      const pct = parseFloat(row.original.percentage);
      return <div style={{ fontWeight: 600, color: getColor(pct) }}>{pct}%</div>;
    } },
    { id: 'progress', header: 'Progress', cell: ({ row }) => {
      const pct = parseFloat(row.original.percentage);
      return (
        <div style={{ minWidth: '120px' }}>
          <div className="meter-rail">
            <div className={`meter-fill ${pct >= 75 ? 'good' : pct >= 50 ? 'warn' : 'bad'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
          </div>
        </div>
      );
    } },
    { id: 'status', header: 'Status', cell: ({ row }) => {
      const r = row.original;
      return (
        <span className={`badge ${r.isEligible ? 'badge-green' : 'badge-red'}`}>
          {r.isEligible ? 'Eligible' : 'Not Eligible'}
        </span>
      );
    } }
  ], []);

  return (
    <Layout navItems={navItems} pageTitle="Reports">
      <div className="page-title">Course Analytics</div>
      <div className="page-subtitle">Monthly attendance report with below-threshold flagging and eligibility status.</div>

      <motion.div className="card mb-6" style={{ padding: '20px' }} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 100 }}>
        <div className="report-controls flex-between">
          <div className="flex-start">
            <select className="input-sys" style={{ width: '280px' }} value={selectedCourse} onChange={e => handleCourseChange(e.target.value)}>
              <option value="">Select a course to view report...</option>
              {courses.map(c => <option key={c._id} value={c._id}>{c.courseCode} — {c.name}</option>)}
            </select>
            <input className="input-sys" type="month" value={selectedMonth} onChange={(e) => handleMonthChange(e.target.value)} />
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
      </motion.div>

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
          <motion.div className="card mb-6" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 100 }}>
            <div className="section-head" style={{ padding: '20px 24px 0', marginBottom: '16px' }}>
              <span className="section-title">Cohort Distribution</span>
            </div>
            <div style={{ padding: '0 24px 24px', height: '280px', minWidth: 0 }}>
              <ResponsiveContainer width="99%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPct" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary-500)" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="var(--primary-500)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" tick={false} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} dx={-10} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={75} stroke="var(--red-500)" strokeDasharray="4 4" label={{ value: '75% Threshold', position: 'insideTopRight', fontSize: 10, fill: 'var(--red-500)' }} />
                  <Area type="monotone" dataKey="percentage" stroke="var(--primary-500)" fillOpacity={1} fill="url(#colorPct)" activeDot={{ r: 6, fill: 'var(--bg-surface)', stroke: 'var(--primary-500)', strokeWidth: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Report Table */}
          <motion.div className="card" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 100 }}>
            <div className="section-head" style={{ padding: '20px 24px 10px', marginBottom: 0 }}>
              <span className="section-title">Student Ledger ({report.report.length})</span>
            </div>
            {report.report.length === 0 ? (
              <div className="empty-state">
                <Users className="empty-icon" />
                <div className="empty-title">No students enrolled</div>
                <div className="empty-desc">There is no attendance data to generate a report for this course.</div>
              </div>
            ) : (
              <SaaSTable
                data={report.report}
                columns={ledgerColumns}
                searchPlaceholder="Search ledger... "
                defaultPageSize={10}
              />
            )}
          </motion.div>
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
