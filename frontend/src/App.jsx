import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import FacultyReport from './pages/FacultyReport';
import FacultyLeave from './pages/FacultyLeave';
import StudentDashboard from './pages/StudentDashboard';
import StudentLeave from './pages/StudentLeave';
import Profile from './pages/Profile';

const PrivateRoute = ({ children, role }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--gray-50)', gap: '16px' }}>
      <div style={{ width: '24px', height: '24px', border: '2px solid var(--gray-200)', borderTopColor: 'var(--primary-500)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/" />;
  return children;
};

const App = () => {
  const { user } = useAuth();
  
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/admin/*" element={<PrivateRoute role="admin"><AdminDashboard /></PrivateRoute>} />
        
        <Route path="/faculty" element={<PrivateRoute role="faculty"><FacultyDashboard /></PrivateRoute>} />
        <Route path="/faculty/report" element={<PrivateRoute role="faculty"><FacultyReport /></PrivateRoute>} />
        <Route path="/faculty/leaves" element={<PrivateRoute role="faculty"><FacultyLeave /></PrivateRoute>} />
        
        <Route path="/student" element={<PrivateRoute role="student"><StudentDashboard /></PrivateRoute>} />
        <Route path="/student/leaves" element={<PrivateRoute role="student"><StudentLeave /></PrivateRoute>} />
        <Route path="/student/subjects" element={<PrivateRoute role="student"><StudentDashboard /></PrivateRoute>} />

        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />

        <Route path="/" element={
          user ? (
            user.role === 'admin' ? <Navigate to="/admin" /> :
            user.role === 'faculty' ? <Navigate to="/faculty" /> :
            <Navigate to="/student" />
          ) : <Home />
        } />
      </Routes>
    </Router>
  );
};

export default App;
