import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { LayoutDashboard, BookOpen, GraduationCap, Clock, CheckCircle2, XCircle, Calendar, User } from 'lucide-react';

const StudentDashboard = () => {
  const [stats, setStats] = useState([]);
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
        const { data } = await axios.get('http://localhost:5000/api/attendance/stats', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setStats(data);
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    fetchStats();
  }, [user]);

  const totalClasses = stats.reduce((s, c) => s + c.cappedTotalClasses, 0);
  const totalPresent = stats.reduce((s, c) => s + c.cappedPresentClasses, 0);
  const totalAbsent = totalClasses - totalPresent;
  const overallPct = totalClasses === 0 ? 0 : ((totalPresent / totalClasses) * 100);
  const isEligible = overallPct >= 75;

  const notifications = stats
    .filter(s => parseFloat(s.percentage) < 75)
    .map(s => `Your attendance in ${s.course.name} is currently ${s.percentage}%. Target: 75%.`);

  const filteredStats = stats.filter(s => 
    s.course.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.course.courseCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const chartData = filteredStats.map(s => ({
    name: s.course.courseCode,
    percentage: parseFloat(s.percentage),
    present: s.cappedPresentClasses,
    total: s.cappedTotalClasses,
  }));

  const getBarColor = (pct) => pct >= 75 ? 'var(--green-500)' : pct >= 50 ? 'var(--amber-500)' : 'var(--red-500)';
  
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ backgroundColor: '#fff', padding: '12px', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)' }}>
          <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gray-900)', marginBottom: '4px' }}>{payload[0].payload.name}</p>
          <p style={{ fontSize: '13px', color: 'var(--gray-600)' }}>
            Attendance: <span style={{ fontWeight: 600, color: 'var(--gray-900)' }}>{payload[0].value}%</span>
          </p>
          <p style={{ fontSize: '11px', color: 'var(--gray-400)', marginTop: '4px' }}>
            {payload[0].payload.present} / {payload[0].payload.total} classes attended
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Layout navItems={navItems} pageTitle="Overview" onSearch={setSearchQuery} notifications={notifications}>
      <div className="page-title">Welcome back, {user.name.split(' ')[0]}</div>
      <div className="page-subtitle">Here is your attendance summary for the current semester.</div>

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
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-title">
                Total Classes <Clock size={16} className="kpi-icon" />
              </div>
              <div className="kpi-value">{totalClasses}</div>
              <div className="kpi-meta">Theory: 30 Max · Lab: 10 Max</div>
            </div>
            
            <div className="kpi-card">
              <div className="kpi-title">
                Classes Attended <CheckCircle2 size={16} className="kpi-icon" style={{ color: 'var(--green-500)' }} />
              </div>
              <div className="kpi-value" style={{ color: 'var(--green-600)' }}>{totalPresent}</div>
              <div className="kpi-meta">Includes approved leaves</div>
            </div>
            
            <div className="kpi-card">
              <div className="kpi-title">
                Classes Missed <XCircle size={16} className="kpi-icon" style={{ color: 'var(--red-500)' }} />
              </div>
              <div className="kpi-value" style={{ color: 'var(--red-600)' }}>{totalAbsent}</div>
              <div className="kpi-meta">Counted against eligibility</div>
            </div>
            
            <div className="kpi-card">
              <div className="kpi-title">
                Overall Attendance <GraduationCap size={16} className="kpi-icon" />
              </div>
              <div className="kpi-value">{overallPct.toFixed(1)}%</div>
              <div className="kpi-meta" style={{ marginTop: 'auto' }}>
                <span className={`badge ${isEligible ? 'badge-green' : 'badge-red'}`}>
                  {isEligible ? 'Target Met (≥75%)' : 'Action Required (<75%)'}
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
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--gray-500)' }} axisLine={false} tickLine={false} dy={10} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--gray-500)' }} axisLine={false} tickLine={false} dx={-10} />
                    <Tooltip cursor={{ fill: 'var(--gray-50)' }} content={<CustomTooltip />} />
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
                      const maxC = s.course.maxClasses || (s.course.type === 'lab' ? 10 : 30);
                      
                      return (
                        <tr key={s.course._id} className={isLow ? 'tr-warning' : ''}>
                          <td style={{ fontWeight: 500, color: 'var(--gray-900)' }}>{s.course.name}</td>
                          <td><span className="badge badge-neutral">{s.course.courseCode}</span></td>
                          <td>
                            <span className={`badge ${s.course.type === 'lab' ? 'badge-blue' : 'badge-neutral'}`}>
                              {s.course.type === 'lab' ? 'Lab' : 'Theory'}
                            </span>
                          </td>
                          <td style={{ fontWeight: 500 }}>
                            {s.cappedPresentClasses} / {maxC} <span style={{ color: 'var(--gray-400)', fontWeight: 400, fontSize: '12px' }}>({pct}%)</span>
                          </td>
                          <td>
                            <div className="meter-rail">
                              <div className={`meter-fill ${pct >= 75 ? 'good' : pct >= 50 ? 'warn' : 'bad'}`} style={{ width: `${Math.min(pct, 100)}%` }}></div>
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${s.isEligible ? 'badge-green' : 'badge-red'}`}>
                              {s.isEligible ? 'Eligible' : 'Not Eligible'}
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
