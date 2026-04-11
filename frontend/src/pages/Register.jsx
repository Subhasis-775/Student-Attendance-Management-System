import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Blocks, ArrowRight } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/auth/register', {
        name, email, password, role,
        registrationNumber: registrationNumber || undefined
      });
      const user = await login(email, password);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'faculty') navigate('/faculty');
      else navigate('/student');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-layout">
      {/* Brand Hero Side */}
      <div className="auth-hero">
        <div className="pattern-bg"></div>
        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', maxWidth: '400px' }}>
          <Blocks size={48} style={{ color: 'var(--primary-500)', marginBottom: '24px' }} />
          <h2 style={{ fontSize: '32px', fontWeight: 700, color: 'var(--gray-900)', letterSpacing: '-0.03em', marginBottom: '16px' }}>
            Empower Your Institution.
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--gray-600)', lineHeight: '1.6' }}>
            Join AttendEase to experience frictionless class management, dynamic reporting, and robust core operations.
          </p>
        </div>
      </div>

      {/* Form Side */}
      <div className="auth-panel">
        <div className="auth-form-container" style={{ maxWidth: '440px' }}>
          <div className="auth-header">
            <h1>Create an account</h1>
            <p>Enter your details below to get started.</p>
          </div>

          {error && (
            <div className="alert-toast alert-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="input-sys" type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="John Doe" />
            </div>
            
            <div style={{ display: 'flex', gap: '16px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Email</label>
                <input className="input-sys" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@university.edu" />
              </div>
              <div className="form-group" style={{ width: '140px' }}>
                <label className="form-label">Role</label>
                <select className="input-sys" style={{ cursor: 'pointer' }} value={role} onChange={e => setRole(e.target.value)}>
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Registration Number <span style={{ color: 'var(--gray-400)', fontWeight: 400 }}>(Optional)</span>
              </label>
              <input className="input-sys" type="text" value={registrationNumber} onChange={e => setRegistrationNumber(e.target.value)} placeholder="e.g. 23110318" />
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Password</label>
                <input className="input-sys" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min 6 characters" />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Confirm Password</label>
                <input className="input-sys" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder="Re-enter password" />
              </div>
            </div>

            <button 
              className="btn btn-primary" 
              style={{ width: '100%', height: '40px', fontSize: '14px', marginTop: '8px' }}
              type="submit" 
              disabled={loading}
            >
              {loading ? 'Creating account...' : (
                <>Sign up for AttendEase <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '13px', color: 'var(--gray-500)' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--gray-900)', fontWeight: 500 }}>Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
