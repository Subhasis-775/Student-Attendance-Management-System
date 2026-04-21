import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { LayoutDashboard, BookOpen, GraduationCap, Clock, CheckCircle2, XCircle, Calendar, User, Download } from 'lucide-react';
import { motion } from 'framer-motion';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ backgroundColor: 'var(--bg-glass)', backdropFilter: 'blur(12px)', padding: '12px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)' }}>
        <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{payload[0].payload.name}</p>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Attendance: <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{payload[0].value}%</span>
        </p>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
          {payload[0].payload.present} / {payload[0].payload.total} classes attended
        </p>
      </div>
    );
  }
  return null;
};

const StudentDashboard = () => {
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [overall, setOverall] = useState({ attended: 0, totalClasses: 0, percentage: '0.00', eligibility: 'Not Eligible' });
  const [monthlyOverall, setMonthlyOverall] = useState({ attended: 0, totalClasses: 0, percentage: '0.00', eligibility: 'Not Eligible' });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  
  const navItems = [
    { path: '/student', label: 'Overview', icon: <LayoutDashboard /> },
    { path: '/student/subjects', label: 'My Subjects', icon: <BookOpen /> },
    { path: '/student/leaves', label: 'Leave Requests', icon: <Calendar /> },
    { path: '/profile', label: 'Profile', icon: <User /> },
  ];

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const headers = { Authorization: `Bearer ${user.token}` };
        const [cumulativeRes, monthlyRes] = await Promise.all([
          axios.get('http://localhost:5000/api/attendance/cumulative', { headers }),
          axios.get(`http://localhost:5000/api/attendance/monthly?month=${selectedMonth}`, { headers }),
        ]);

        setMonthlyStats(monthlyRes.data.courses || []);
        setOverall(cumulativeRes.data.overall || { attended: 0, totalClasses: 0, percentage: '0.00', eligibility: 'Not Eligible' });
        setMonthlyOverall(monthlyRes.data.overall || { attended: 0, totalClasses: 0, percentage: '0.00', eligibility: 'Not Eligible' });
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    fetchStats();
  }, [user, selectedMonth]);

  const totalClasses = Number(overall.totalClasses || 0);
  const totalPresent = Number(overall.attended || 0);
  const totalAbsent = totalClasses - totalPresent;
  const overallPct = Number(overall.percentage || 0);
  const isEligible = overall.eligibility === 'Eligible';

  const notifications = monthlyStats
    .filter(s => parseFloat(s.percentage) < 75)
    .map(s => `Monthly attendance in ${s.course.name} is ${s.percentage}%. Target: 75%.`);

  const filteredStats = monthlyStats.filter(s => 
    s.course.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.course.courseCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const chartData = filteredStats.map(s => ({
    name: s.course.courseCode,
    percentage: parseFloat(s.percentage),
    present: s.attended,
    total: s.totalClasses,
  }));

  const getBarColor = (pct) => pct >= 75 ? 'var(--green-500)' : pct >= 50 ? 'var(--amber-500)' : 'var(--red-500)';

  const exportMonthlyCSV = () => {
    const monthLabel = selectedMonth || new Date().toISOString().slice(0, 7);
    const safeName = (user.name || 'student').replace(/,/g, ' ').trim();
    const safeReg = (user.registrationNumber || 'N/A').replace(/,/g, ' ').trim();

    const headerRows = [
      ['Student Name', safeName],
      ['Registration Number', safeReg],
      ['Month', monthLabel],
      ['Overall Attended', monthlyOverall.attended ?? 0],
      ['Overall Total Classes', monthlyOverall.totalClasses ?? 0],
      ['Overall Percentage', `${monthlyOverall.percentage ?? '0.00'}%`],
      ['Overall Eligibility', monthlyOverall.eligibility ?? 'Not Eligible'],
      [],
      ['Subject Name', 'Course Code', 'Type', 'Attended', 'Total Classes', 'Percentage', 'Eligibility', 'Below 75%'],
    ];

    const subjectRows = monthlyStats.map((item) => ([
      (item.course?.name || 'N/A').replace(/,/g, ' '),
      (item.course?.courseCode || 'N/A').replace(/,/g, ' '),
      item.course?.type || 'theory',
      item.attended ?? 0,
      item.totalClasses ?? 0,
      `${item.percentage ?? '0.00'}%`,
      item.eligibility || 'Not Eligible',
      item.belowThreshold ? 'Yes' : 'No',
    ]));

    const allRows = [...headerRows, ...subjectRows];
    const csvContent = allRows
      .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${safeReg}_${monthLabel}_Monthly_Attendance_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  return (
    <Layout navItems={navItems} pageTitle="Overview" onSearch={setSearchQuery} notifications={notifications}>
      <div className="page-title">Welcome back, {user.name.split(' ')[0]}</div>
      <div className="page-subtitle">Track monthly and cumulative attendance with dynamic eligibility status.</div>

      {loading ? (
        <>
          <div className="kpi-grid">
            <div className="skeleton skeleton-card"></div>
            <div className="skeleton skeleton-card"></div>
            <div className="skeleton skeleton-card"></div>
            <div className="skeleton skeleton-card"></div>
          </div>
          <div className="skeleton skeleton-card" style={{ height: '300px', marginBottom: '24px' }}></div>
        </>
      ) : (
        <>
          {/* KPIs */}
          <motion.div className="kpi-grid" initial="hidden" animate="visible" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }}>
            <motion.div className="kpi-card" variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } } }}>
              <div className="kpi-title">
                Total Classes <Clock size={16} className="kpi-icon" />
              </div>
              <div className="kpi-value">{totalClasses}</div>
              <div className="kpi-meta">Cumulative (monthly class cap enforced at backend)</div>
            </motion.div>
            
            <motion.div className="kpi-card" variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } } }}>
              <div className="kpi-title">
                Classes Attended <CheckCircle2 size={16} className="kpi-icon" style={{ color: 'var(--green-500)' }} />
              </div>
              <div className="kpi-value" style={{ color: 'var(--green-600)' }}>{totalPresent}</div>
              <div className="kpi-meta">Includes approved leaves</div>
            </motion.div>
            
            <motion.div className="kpi-card" variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } } }}>
              <div className="kpi-title">
                Classes Missed <XCircle size={16} className="kpi-icon" style={{ color: 'var(--red-500)' }} />
              </div>
              <div className="kpi-value" style={{ color: 'var(--red-600)' }}>{totalAbsent}</div>
              <div className="kpi-meta">Counted against eligibility</div>
            </motion.div>
            
            <motion.div className="kpi-card" variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } } }}>
              <div className="kpi-title">
                Overall Attendance <GraduationCap size={16} className="kpi-icon" />
              </div>
              <div className="kpi-value text-gradient" style={{ display: 'inline-block' }}>{overallPct.toFixed(1)}%</div>
              <div className="kpi-meta" style={{ marginTop: 'auto' }}>
                <span className={`badge ${isEligible ? 'badge-green' : 'badge-red'}`}>
                  {isEligible ? 'Eligible' : 'Not Eligible'}
                </span>
              </div>
            </motion.div>
          </motion.div>

          <div className="card mb-6" style={{ padding: '16px 20px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100%', background: 'linear-gradient(90deg, var(--primary-50), transparent)', opacity: 0.3, zIndex: 0, pointerEvents: 'none' }}></div>
            <div className="flex-between" style={{ position: 'relative', zIndex: 1 }}>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Monthly Report</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {monthlyOverall.attended} / {monthlyOverall.totalClasses} classes attended in {selectedMonth}
                </div>
              </div>
              <div className="flex-start">
                <input className="input-sys" type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
                <button className="btn btn-secondary" type="button" onClick={exportMonthlyCSV} disabled={monthlyStats.length === 0}>
                  <Download size={14} /> Download CSV
                </button>
                <span className={`badge ${monthlyOverall.eligibility === 'Eligible' ? 'badge-green' : 'badge-red'}`}>
                  {monthlyOverall.eligibility}
                </span>
              </div>
            </div>
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <div className="card mb-6">
              <div className="section-head" style={{ padding: '20px 24px 0', marginBottom: 0 }}>
                <span className="section-title">Subject Performance</span>
              </div>
              <div style={{ padding: '24px', height: '300px', minWidth: 0 }}>
                <ResponsiveContainer width="99%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={32}>
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} dy={10} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} dx={-10} />
                    <Tooltip cursor={{ fill: 'var(--bg-surface-hover)' }} content={<CustomTooltip />} />
                    <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, i) => (
                        <Cell key={`cell-${i}`} fill={getBarColor(entry.percentage)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Detailed Table */}
          <div className="card">
            <div className="section-head" style={{ padding: '20px 24px 0' }}>
              <span className="section-title">Enrolled Subjects</span>
              {filteredStats.some(s => parseFloat(s.percentage) < 75) && (
                <span className="badge badge-amber">Warning: Low Attendance</span>
              )}
            </div>
            
            <div className="table-container">
              <table className="table-clean">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Code</th>
                    <th>Type</th>
                    <th>Attendance</th>
                    <th style={{ width: '160px' }}>Progress</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStats.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <div className="empty-state">
                          <BookOpen className="empty-icon" />
                          <div className="empty-title">No subjects found</div>
                          <div className="empty-desc">{searchQuery ? 'No subjects match your search.' : 'You are not enrolled in any courses for the current semester.'}</div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredStats.map(s => {
                      const pct = parseFloat(s.percentage);
                      const isLow = pct < 75;
                      return (
                        <tr key={s.course._id} className={isLow ? 'tr-warning' : ''}>
                          <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{s.course.name}</td>
                          <td><span className="badge badge-neutral">{s.course.courseCode}</span></td>
                          <td>
                            <span className={`badge ${s.course.type === 'lab' ? 'badge-blue' : 'badge-neutral'}`}>
                              {s.course.type === 'lab' ? 'Lab' : 'Theory'}
                            </span>
                          </td>
                          <td style={{ fontWeight: 500 }}>
                            {s.attended} / {s.totalClasses} <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '12px' }}>({pct}%)</span>
                          </td>
                          <td>
                            <div className="meter-rail">
                              <div className={`meter-fill ${pct >= 75 ? 'good' : pct >= 50 ? 'warn' : 'bad'}`} style={{ width: `${Math.min(pct, 100)}%` }}></div>
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${s.eligibility === 'Eligible' ? 'badge-green' : 'badge-red'}`}>
                              {s.eligibility}
                            </span>
                          </td>
                        </tr>
                      );
                    })
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

export default StudentDashboard;
