import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Blocks, ArrowRight, Eye, EyeOff } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Real-time validation
  useEffect(() => {
    if (password && confirmPassword && password !== confirmPassword) {
      setError('Passwords do not match');
    } else if (password && password.length < 6) {
      setError('Password must be at least 6 characters');
    } else {
      setError('');
    }
  }, [password, confirmPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword || password.length < 6) return;
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
          <Blocks size={48} style={{ color: 'var(--primary-500)', margin: '0 auto 24px' }} />
          <h2 style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: '16px' }}>
            Empower Your Institution.
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
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
            
            <div className="register-row" style={{ display: 'flex', gap: '16px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Email</label>
                <input className="input-sys" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@university.edu" />
              </div>
              <div className="form-group" style={{ width: '140px' }}>
                <label className="form-label">Role</label>
                <select className="input-sys" style={{ cursor: 'pointer' }} value={role} onChange={e => setRole(e.target.value)}>
                  <option value="student" style={{ background: 'var(--bg-surface)' }}>Student</option>
                  <option value="faculty" style={{ background: 'var(--bg-surface)' }}>Faculty</option>
                  <option value="admin" style={{ background: 'var(--bg-surface)' }}>Admin</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Registration Number <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</span>
              </label>
              <input className="input-sys" type="text" value={registrationNumber} onChange={e => setRegistrationNumber(e.target.value)} placeholder="e.g. 23110318" />
            </div>

            <div className="register-row" style={{ display: 'flex', gap: '16px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input className="input-sys" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min 6 characters" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex' }}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Confirm</label>
                <div style={{ position: 'relative' }}>
                  <input className="input-sys" type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder="Re-enter password" />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex' }}>
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <button 
              className="btn btn-primary" 
              style={{ width: '100%', height: '40px', fontSize: '14px', marginTop: '8px' }}
              type="submit" 
              disabled={loading || !!error}
            >
              {loading ? 'Creating account...' : (
                <>Sign up for AttendEase <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
