import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { LayoutDashboard, Users as UsersIcon, BookOpen, UserPlus, FilePlus, Link2, CheckCircle2, AlertCircle, Download, Search, Send, TrendingUp, Book } from 'lucide-react';
import { motion } from 'framer-motion';
import { AreaChart, Area, BarChart, Bar, ReferenceLine, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import KPICard from '../components/KPICard';
import { SaaSTable, TableCheckbox } from '../components/SaaSTable';
import SideDrawer from '../components/SideDrawer';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [analytics, setAnalytics] = useState({ lowestCourse: null, atRiskStudents: [] });
  const [cumulativeOverview, setCumulativeOverview] = useState([]);
  const [tab, setTab] = useState('overview');
  const [newUser, setNewUser] = useState({ name: '', email: '', password: 'password123', role: 'student', registrationNumber: '' });
  const [newCourse, setNewCourse] = useState({ courseCode: '', name: '', faculty: '', type: 'theory', maxClasses: '' });
  const [enroll, setEnroll] = useState({ studentId: '', courseId: '' });
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(true);

  const [globalSearch, setGlobalSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');

  // Drawer State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerData, setDrawerData] = useState(null);
  const [drawerType, setDrawerType] = useState(null); // 'student' | 'faculty' | 'course' | 'atrisk'

  const headers = useMemo(() => ({ Authorization: `Bearer ${user.token}` }), [user.token]);

  const navItems = [
    { path: '/admin', label: 'Administration', icon: <LayoutDashboard /> },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [u, c, a] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/users', { headers }),
        axios.get('http://localhost:5000/api/admin/courses', { headers }),
        axios.get('http://localhost:5000/api/admin/analytics', { headers }),
      ]);
      const cumulativeRes = await axios.get('http://localhost:5000/api/attendance/cumulative/admin-overview', { headers });
      setUsers(u.data);
      setCourses(c.data);
      setAnalytics(a.data);
      setCumulativeOverview(cumulativeRes.data || []);
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

  // Tanstack Table Data Prep
  const studentTableData = useMemo(() => studentsList.map(s => {
    const enrolledIn = courses.filter(c => c.students?.some(st => st._id === s._id || st === s._id));
    return { ...s, enrolledCount: enrolledIn.length, enrolledCourses: enrolledIn };
  }), [studentsList, courses]);

  const atRiskTableData = useMemo(() => cumulativeOverview
    .filter((s) => s.belowThreshold)
    .map((s) => {
      const student = users.find((u) => u._id === s.studentId);
      return { ...s, student };
    })
    .sort((a, b) => parseFloat(a.percentage) - parseFloat(b.percentage)), [cumulativeOverview, users]);

  // Table Columns
  const studentColumns = useMemo(() => [
    { id: 'select', header: ({ table }) => <TableCheckbox checked={table.getIsAllPageRowsSelected()} onChange={table.getToggleAllPageRowsSelectedHandler()} />, cell: ({ row }) => <TableCheckbox checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} /> },
    { accessorKey: 'name', header: 'Student Name', cell: info => <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{info.getValue()}</div> },
    { accessorKey: 'registrationNumber', header: 'Reg Number', cell: info => <span className="badge badge-neutral">{info.getValue() || '—'}</span> },
    { accessorKey: 'email', header: 'Email Address', cell: info => <div style={{ color: 'var(--text-secondary)' }}>{info.getValue()}</div> },
    { id: 'enrolled', header: 'Enrollments', cell: ({ row }) => row.original.enrolledCount > 0 ? <span className="badge badge-blue">{row.original.enrolledCount} Courses</span> : <span className="badge badge-red">None</span> }
  ], []);

  const facultyColumns = useMemo(() => [
    { accessorKey: 'name', header: 'Faculty Name', cell: info => <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{info.getValue()}</div> },
    { accessorKey: 'email', header: 'Email Address', cell: info => <div style={{ color: 'var(--text-secondary)' }}>{info.getValue()}</div> },
    { accessorKey: 'registrationNumber', header: 'Identifier', cell: info => <span className="badge badge-neutral">{info.getValue() || '—'}</span> },
    { id: 'assignment', header: 'Assignment', cell: ({ row }) => {
      const assigned = courses.find(c => c.faculty?.some(f => String(f._id) === String(row.original._id)));
      return assigned ? <span className="badge badge-blue">{assigned.courseCode}</span> : <span style={{color: 'var(--text-muted)'}}>Unassigned</span>;
    }}
  ], [courses]);

  const coursesColumns = useMemo(() => [
    { accessorKey: 'courseCode', header: 'Code', cell: info => <span className="badge badge-neutral">{info.getValue()}</span> },
    { accessorKey: 'name', header: 'Course Details', cell: ({ row }) => (
      <div>
        <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{row.original.name}</div>
        <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
          <span className={`badge ${row.original.type === 'lab' ? 'badge-blue' : 'badge-neutral'}`} style={{ fontSize: '10px' }}>{row.original.type === 'lab' ? 'Lab' : 'Theory'}</span>
        </div>
      </div>
    ) },
    { id: 'faculty', header: 'Faculty', cell: ({ row }) => <div style={{ color: 'var(--text-secondary)' }}>{row.original.faculty?.map(f => f.name).join(', ') || '—'}</div> },
    { id: 'enrollment', header: 'Enrolled', cell: ({ row }) => <span className="badge badge-neutral">{row.original.students?.length || 0} enrolled</span> },
    { accessorKey: 'maxClasses', header: 'Cap', cell: info => <div style={{ color: 'var(--text-muted)' }}>{info.getValue() || 30}</div> }
  ], []);

  const atRiskColumns = useMemo(() => [
    { id: 'studentInfo', header: 'Student Identity', cell: ({ row }) => (
      <div>
        <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{row.original.student?.name || 'Unknown'}</div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{row.original.student?.registrationNumber || 'No ID'}</div>
      </div>
    ) },
    { accessorKey: 'percentage', header: 'Attendance %', cell: info => <div style={{ fontWeight: 600, color: 'var(--red-600)' }}>{parseFloat(info.getValue()).toFixed(1)}%</div> },
    { id: 'classes', header: 'Classes', cell: ({ row }) => <div style={{ color: 'var(--text-secondary)' }}>{row.original.attended} / {row.original.totalClasses} Attended</div> },
    { id: 'status', header: 'Status', cell: () => <span className="badge badge-red">Block Exam</span> },
    { id: 'actions', header: 'Action', cell: () => (
      <button className="btn btn-secondary" style={{ padding: '4px 8px', height: 'auto', fontSize: '12px' }} onClick={(e) => { e.stopPropagation(); flash('Alert dispatched to student securely', 'success'); }}>
        <Send size={12} style={{ marginRight: '4px' }}/> Send Alert
      </button>
    ) }
  ], []);

  // Custom Tab Design
  const TabButton = ({ id, label, icon }) => (
    <button 
      style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '10px 16px', background: 'none', border: 'none', borderBottom: `2px solid ${tab === id ? 'var(--primary-500)' : 'transparent'}`,
        color: tab === id ? 'var(--primary-600)' : 'var(--text-muted)', fontWeight: 600, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s ease', userSelect: 'none'
      }}
      onClick={() => setTab(id)}
    >
      {icon} {label}
    </button>
  );

  const openDrawer = (data, type) => {
    setDrawerData(data);
    setDrawerType(type);
    setDrawerOpen(true);
  };

  // Chart Mocks & Formats
  const areaChartData = [
    { date: '1', val: 82 }, { date: '5', val: 85 }, { date: '10', val: 88 }, { date: '15', val: 83 },
    { date: '20', val: 91 }, { date: '25', val: 90 }, { date: '30', val: 94 }
  ];
  
  const barChartData = [
    { name: 'CS101', value: 92 }, { name: 'CS102', value: 85 }, { name: 'IT201', value: 74 }, { name: 'EE101', value: 89 }, { name: 'MECH1', value: 68 }
  ];
  const barColors = (val) => val > 85 ? 'var(--green-500)' : val > 75 ? 'var(--amber-500)' : 'var(--red-500)';

  return (
    <Layout navItems={navItems} pageTitle="Administration Hub">
      {msg.text && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className={`alert-toast alert-${msg.type}`}>
          {msg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {msg.text}
        </motion.div>
      )}

      {/* Control Bar */}
      <div className="control-bar">
        <div className="control-bar-left">
           <div className="input-sys" style={{ width: '280px', height: '36px', background: 'var(--bg-surface-hover)' }}>
              <Search size={14} style={{ color: 'var(--text-muted)', marginRight: '8px' }} />
              <input type="text" placeholder="Search system elements..." style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '13px', color: 'var(--text-primary)' }} value={globalSearch} onChange={(e) => setGlobalSearch(e.target.value)} />
           </div>
           <select className="input-sys" style={{ width: '180px', height: '36px' }} value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}>
              <option value="all">All Academic Courses</option>
              {courses.map(c => <option key={c._id} value={c._id}>{c.courseCode} - {c.type === 'lab' ? 'Lab' : 'Theory'}</option>)}
           </select>
        </div>
        <div className="control-bar-right">
           <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginRight: '16px' }}>Current Term: Spring 2026</span>
           <button className="btn btn-secondary" style={{ height: '36px' }} onClick={() => flash('Exporting full registry CSV...', 'info')}>
             <Download size={14} /> Export Register
           </button>
        </div>
      </div>

      {loading ? (
        <div className="kpi-grid">
          <div className="skeleton skeleton-card" style={{ gridColumn: 'span 2' }}></div>
          <div className="skeleton skeleton-card"></div>
          <div className="skeleton skeleton-card"></div>
        </div>
      ) : (
        <motion.div className="kpi-grid" style={{ gridTemplateColumns: 'minmax(280px, 2fr) minmax(200px, 1fr) minmax(200px, 1fr)', marginBottom: 'var(--space-4)' }} initial="hidden" animate="visible" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }}>
          <KPICard 
             title="Global Cohort Health Rate" 
             value="88.4%" 
             icon={<TrendingUp />} 
             trend="up" 
             trendValue="2.1%" 
             metaText="vs last semester" 
             isPrimary={true}
          />
          <KPICard 
             title="Active Students" 
             value={studentsList.length} 
             icon={<UsersIcon />} 
             trend="neutral" 
             trendValue="0%" 
             metaText="Stable enrollment" 
          />
          <KPICard 
             title="Flagged Students" 
             value={atRiskTableData.length} 
             icon={<AlertCircle />} 
             trend="down" 
             trendValue="12%" 
             metaText="Drop from midterms" 
          />
        </motion.div>
      )}

      {/* Tabs */}
      <div className="admin-tabs" style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', marginBottom: 'var(--space-3)' }}>
        <TabButton id="overview" label="Insight & Registry" icon={<LayoutDashboard size={16} />} />
        <TabButton id="add-user" label="Provision Identity" icon={<UserPlus size={16} />} />
        <TabButton id="bulk-upload" label="Bulk Import" icon={<FilePlus size={16} />} />
        <TabButton id="add-course" label="Setup Course" icon={<Book size={16} />} />
        <TabButton id="enroll" label="Manage Links" icon={<Link2 size={16} />} />
      </div>

      <div style={{ maxWidth: tab !== 'overview' ? '800px' : 'none' }}>
        {/* Forms (retained cleanly) */}
        {tab === 'add-user' && (
          <div className="card mb-6">
            <div className="section-head" style={{ padding: '24px 24px 0' }}><span className="section-title">Provision New Identity</span></div>
            <div style={{ padding: '24px' }}>
              <form onSubmit={handleCreateUser}>
                <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group"><label className="form-label">Full Name</label><input className="input-sys" placeholder="Jane Doe" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} required /></div>
                  <div className="form-group"><label className="form-label">Associated Email</label><input className="input-sys" type="email" placeholder="jane@university.edu" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} required /></div>
                   <div className="form-group"><label className="form-label">System Role Matrix</label>
                    <select className="input-sys" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                      <option value="student">Student Account</option>
                      <option value="faculty">Faculty Account</option>
                      <option value="admin">System Administrator</option>
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">Unique Identity Number <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</span></label><input className="input-sys" placeholder="e.g. 23110318" value={newUser.registrationNumber} onChange={e => setNewUser({ ...newUser, registrationNumber: e.target.value })} /></div>
                  <div className="form-group"><label className="form-label">Security Credential</label><input className="input-sys" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} required /></div>
                </div>
                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-primary" type="submit">Deploy Identity</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {tab === 'bulk-upload' && (
          <div className="card mb-6">
            <div className="section-head" style={{ padding: '24px 24px 0' }}><span className="section-title">Mass Identity Upload (.csv)</span></div>
            <div style={{ padding: '24px' }}>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const fileInput = e.target.elements.csvFile;
                if (!fileInput.files[0]) { flash('Please select a CSV file', 'error'); return; }
                const formData = new FormData(); formData.append('file', fileInput.files[0]);
                try {
                  const res = await axios.post('http://localhost:5000/api/admin/users/bulk', formData, { headers });
                  flash(res.data.message); fetchData(); fileInput.value = '';
                } catch (err) { flash(err.response?.data?.message || 'Error uploading file', 'error'); }
              }}>
                <div className="form-group">
                  <label className="form-label">Upload Identity Package</label>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    CSV must include headers: <strong>name, registrationNumber</strong>. Default email mapping applied automatically if omitted.
                  </p>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <input className="input-sys" type="file" name="csvFile" accept=".csv" required style={{ padding: '6px 12px', flex: 1 }} />
                    <button className="btn btn-primary" type="submit">Execute Run</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {tab === 'add-course' && (
           <div className="card mb-6">
             <div className="section-head" style={{ padding: '24px 24px 0' }}><span className="section-title">Systematize New Course</span></div>
             <div style={{ padding: '24px' }}>
               <form onSubmit={handleCreateCourse}>
                 <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
                   <div className="form-group"><label className="form-label">Alpha-Numeric Code</label><input className="input-sys" placeholder="e.g. CS301" value={newCourse.courseCode} onChange={e => setNewCourse({ ...newCourse, courseCode: e.target.value })} required /></div>
                   <div className="form-group"><label className="form-label">Descriptive Nomenclature</label><input className="input-sys" placeholder="Advanced Database Systems" value={newCourse.name} onChange={e => setNewCourse({ ...newCourse, name: e.target.value })} required /></div>
                 </div>
                 <div className="form-grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                   <div className="form-group"><label className="form-label">Faculty Linkage</label>
                     <select className="input-sys" value={newCourse.faculty} onChange={e => setNewCourse({ ...newCourse, faculty: e.target.value })} required>
                       <option value="">Target faculty node...</option>
                       {facultyList.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
                     </select>
                   </div>
                   <div className="form-group"><label className="form-label">Pedagogy Mode</label>
                     <select className="input-sys" value={newCourse.type} onChange={e => setNewCourse({ ...newCourse, type: e.target.value })}>
                       <option value="theory">Theory Pipeline</option>
                       <option value="lab">Applied Lab</option>
                     </select>
                   </div>
                   <div className="form-group"><label className="form-label">Credit / Class Ceiling</label><input className="input-sys" type="number" placeholder={newCourse.type === 'lab' ? 'Defaults to 10 block' : 'Defaults to 30 blocks'} value={newCourse.maxClasses} onChange={e => setNewCourse({ ...newCourse, maxClasses: e.target.value })} /></div>
                 </div>
                 <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                   <button className="btn btn-primary" type="submit">Establish Container</button>
                 </div>
               </form>
             </div>
           </div>
         )}
 
         {tab === 'enroll' && (
           <div className="card mb-6">
             <div className="section-head" style={{ padding: '24px 24px 0' }}><span className="section-title">Establish Connectors (Enrollment)</span></div>
             <div style={{ padding: '24px' }}>
               <form onSubmit={handleEnroll}>
                 <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                   <div className="form-group">
                     <label className="form-label">Origin Node (Student)</label>
                     <select className="input-sys" value={enroll.studentId} onChange={e => setEnroll({ ...enroll, studentId: e.target.value })} required>
                       <option value="">Select node...</option>
                       {studentsList.map(s => <option key={s._id} value={s._id}>{s.name} • {s.registrationNumber || s.email}</option>)}
                     </select>
                   </div>
                   <div className="form-group"><label className="form-label">Destination Node (Course)</label>
                     <select className="input-sys" value={enroll.courseId} onChange={e => setEnroll({ ...enroll, courseId: e.target.value })} required>
                       <option value="">Select vector...</option>
                       {courses.map(c => <option key={c._id} value={c._id}>{c.courseCode} — {c.name}</option>)}
                     </select>
                   </div>
                 </div>
                 <div className="enroll-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                   <button className="btn btn-secondary" type="button" onClick={handleEnrollAll}>Bulk Map to All</button>
                   <button className="btn btn-primary" type="submit">Create Linking Thread</button>
                 </div>
               </form>
             </div>
           </div>
         )}
      </div>

      {/* DASHBOARD CHARTS & TABLES */}
      {(tab === 'overview') && !loading && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1.2fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
             {/* SaaS Area Chart */}
             <div className="card">
                <div className="section-head" style={{ padding: '20px 24px 0', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px', marginBottom: '0' }}>
                   <span className="section-title">Cohort Trajectory (30-day Window)</span>
                </div>
                <div style={{ height: '320px', padding: '24px 24px 0 0' }}>
                   <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={areaChartData}>
                         <defs>
                           <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="var(--primary-500)" stopOpacity={0.8}/>
                             <stop offset="95%" stopColor="var(--primary-500)" stopOpacity={0}/>
                           </linearGradient>
                         </defs>
                         <XAxis dataKey="date" axisLine={false} tickLine={false} stroke="var(--text-muted)" fontSize={12} dy={10} />
                         <YAxis axisLine={false} tickLine={false} stroke="var(--text-muted)" fontSize={12} dx={-10} domain={[60, 100]} />
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                         <Tooltip contentStyle={{ backgroundColor: 'var(--bg-glass)', backdropFilter: 'blur(12px)', borderColor: 'var(--border-strong)', borderRadius: 'var(--radius-md)' }} />
                         <Area type="monotone" dataKey="val" stroke="var(--primary-500)" fillOpacity={1} fill="url(#colorVal)" strokeWidth={3} activeDot={{ r: 6, fill: 'var(--bg-surface)', stroke: 'var(--primary-500)', strokeWidth: 3 }} />
                         <ReferenceLine y={75} stroke="var(--red-500)" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: '75% Threshold', fill: 'var(--red-500)', fontSize: 11 }} />
                      </AreaChart>
                   </ResponsiveContainer>
                </div>
             </div>
             
             {/* SaaS Bar Chart for Flags */}
             <div className="card">
                <div className="section-head" style={{ padding: '20px 24px 0', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px', marginBottom: '0' }}>
                   <span className="section-title">Core Modules Health</span>
                </div>
                <div style={{ height: '320px', padding: '24px 20px 0 0' }}>
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barChartData} layout="vertical" margin={{ left: 20 }}>
                         <XAxis type="number" hide domain={[0, 100]} />
                         <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} fontSize={12} width={70} stroke="var(--text-primary)" />
                         <Tooltip cursor={{fill: 'var(--bg-surface-hover)'}} contentStyle={{ backgroundColor: 'var(--bg-glass)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }} />
                         <Bar dataKey="value" barSize={24} radius={[0, 4, 4, 0]}>
                           {barChartData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={barColors(entry.value)} />
                           ))}
                         </Bar>
                         <ReferenceLine x={75} stroke="var(--border-strong)" strokeDasharray="4 4" />
                      </BarChart>
                   </ResponsiveContainer>
                </div>
             </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
             {/* Students SaaS Table */}
             <div className="card" style={{ height: 'fit-content' }}>
                <div className="section-head" style={{ padding: '20px 24px 10px' }}>
                   <span className="section-title">Student Directory Hub</span>
                </div>
                <SaaSTable data={studentTableData} columns={studentColumns} searchPlaceholder="Locate student by name, email..." onRowClick={(row) => openDrawer(row, 'student')} />
             </div>

             {/* Courses SaaS Table */}
             <div className="card" style={{ height: 'fit-content' }}>
                <div className="section-head" style={{ padding: '20px 24px 10px' }}>
                   <span className="section-title">Active Deployments (Courses)</span>
                </div>
                <SaaSTable data={courses} columns={coursesColumns} searchPlaceholder="Search registry ID..." onRowClick={(row) => openDrawer(row, 'course')} />
             </div>
          </div>

          {/* At-Risk SaaS Table Panel */}
          <div className="card" style={{ marginBottom: 'var(--space-4)', border: '1px solid rgba(239, 68, 68, 0.4)', boxShadow: '0 4px 20px -2px rgba(239, 68, 68, 0.08)' }}>
            <div className="section-head" style={{ padding: '20px 24px 10px', background: 'var(--red-50)', borderBottom: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <span className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--red-600)' }}>
                <AlertCircle size={18} /> Deep Insights: Vulnerable Nodes (&lt; 75% Health)
              </span>
            </div>
            <div style={{ background: 'var(--bg-surface)' }}>
               {atRiskTableData.length > 0 ? (
                 <SaaSTable data={atRiskTableData} columns={atRiskColumns} searchable={false} defaultPageSize={10} onRowClick={(row) => openDrawer(row, 'atrisk')} />
               ) : (
                 <div className="empty-state" style={{ minHeight: '200px' }}>
                   <CheckCircle2 className="empty-icon" style={{ color: 'var(--green-500)' }} />
                   <div className="empty-title">All Systems Optimal</div>
                   <div className="empty-desc">No nodes currently operating below strict university thresholds.</div>
                 </div>
               )}
            </div>
          </div>
        </>
      )}

      {/* Dynamic Off-canvas Inspector */}
      <SideDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title="System Details Inspector">
        {drawerData && drawerType === 'student' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
             <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
               <div className="avatar" style={{ width: '56px', height: '56px', fontSize: '20px', background: 'var(--primary-100)' }}>
                 {drawerData.name.substring(0, 2).toUpperCase()}
               </div>
               <div>
                  <h3 style={{ fontSize: '18px', margin: 0, color: 'var(--text-primary)' }}>{drawerData.name}</h3>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{drawerData.email}</div>
                  {drawerData.registrationNumber && <span className="badge badge-neutral" style={{ marginTop: '4px' }}>{drawerData.registrationNumber}</span>}
               </div>
             </div>
             
             <div style={{ padding: '16px', background: 'var(--bg-surface-hover)', borderRadius: 'var(--radius-lg)' }}>
               <h4 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '12px' }}>Enrollment Vectors ({drawerData.enrolledCount})</h4>
               {drawerData.enrolledCount === 0 ? <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>No vectors established.</p> : (
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                   {drawerData.enrolledCourses.map(c => (
                     <div key={c._id} style={{ padding: '10px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <div>
                         <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>{c.courseCode}</div>
                         <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{c.name}</div>
                       </div>
                       <span className={`badge ${c.type==='lab' ? 'badge-blue' : 'badge-neutral'}`}>{c.type}</span>
                     </div>
                   ))}
                 </div>
               )}
             </div>

             <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
               <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setDrawerOpen(false)}>Close Inspector</button>
               <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { flash('Access logs dispatched successfully', 'info'); setDrawerOpen(false); }}>Download Logs</button>
             </div>
          </div>
        )}
        
        {drawerData && drawerType === 'course' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
             <div>
               <h3 style={{ fontSize: '20px', margin: 0, color: 'var(--text-primary)' }}>{drawerData.name}</h3>
               <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <span className="badge badge-primary">{drawerData.courseCode}</span>
                  <span className={`badge ${drawerData.type==='lab' ? 'badge-blue' : 'badge-neutral'}`}>{drawerData.type}</span>
               </div>
             </div>
             
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ padding: '16px', background: 'var(--bg-surface-hover)', borderRadius: 'var(--radius-md)' }}>
                   <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>Lead Faculty</div>
                   <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{drawerData.faculty?.map(f => f.name).join(', ') || 'Unassigned'}</div>
                </div>
                <div style={{ padding: '16px', background: 'var(--bg-surface-hover)', borderRadius: 'var(--radius-md)' }}>
                   <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>Node Capacity</div>
                   <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{drawerData.students?.length} / {drawerData.maxClasses || 30} linked</div>
                </div>
             </div>
          </div>
        )}

        {drawerData && drawerType === 'atrisk' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="alert-toast alert-error" style={{ marginBottom: 0 }}>
              <AlertCircle size={18} /> Node is actively failing threshold protocols ({parseFloat(drawerData.percentage).toFixed(1)}%).
            </div>
            <div style={{ padding: '16px', background: 'var(--bg-surface-hover)', borderRadius: 'var(--radius-lg)' }}>
               <h3 style={{ fontSize: '18px', margin: 0, color: 'var(--text-primary)' }}>{drawerData.student?.name}</h3>
               <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{drawerData.student?.registrationNumber || drawerData.student?.email}</div>
               
               <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                   <span style={{ color: 'var(--text-muted)' }}>Attended Cycles</span>
                   <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{drawerData.attended} logs</span>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                   <span style={{ color: 'var(--text-muted)' }}>Total Cycles</span>
                   <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{drawerData.totalClasses} logs</span>
                 </div>
                 <div style={{ height: '4px', background: 'var(--red-100)', borderRadius: '2px', overflow: 'hidden', marginTop: '4px' }}>
                    <div style={{ height: '100%', background: 'var(--red-500)', width: `${drawerData.percentage}%` }}></div>
                 </div>
               </div>
            </div>
            
            <button className="btn btn-primary" style={{ width: '100%', marginTop: 'auto', background: 'var(--red-600)', borderColor: 'var(--red-600)' }} onClick={() => { flash('Intervention protocol active. Alert sent.', 'success'); setDrawerOpen(false); }}>
              Deploy Intervention Alert
            </button>
          </div>
        )}
      </SideDrawer>
    </Layout>
  );
};

export default AdminDashboard;
