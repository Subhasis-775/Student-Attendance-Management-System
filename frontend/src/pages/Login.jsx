import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Blocks, ArrowRight } from 'lucide-react';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(identifier, password);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'faculty') navigate('/faculty');
      else navigate('/student');
    } catch (err) {
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      {/* Brand Hero Side */}
      <div className="auth-hero">
        <div className="pattern-bg"></div>
        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', maxWidth: '400px' }}>
          <Blocks size={48} style={{ color: 'var(--primary-500)', marginBottom: '24px' }} />
          <h2 style={{ fontSize: '32px', fontWeight: 700, color: 'var(--gray-900)', letterSpacing: '-0.03em', marginBottom: '16px' }}>
            Elevate Your Academic Operations.
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--gray-600)', lineHeight: '1.6' }}>
            The all-in-one attendance management platform designed for modern universities. Professional, fast, and reliable.
          </p>
        </div>
      </div>

      {/* Form Side */}
      <div className="auth-panel">
        <div className="auth-form-container">
          <div className="auth-header">
            <h1>Welcome back</h1>
            <p>Log in to access your AttendEase dashboard.</p>
          </div>

          {error && (
            <div className="alert-toast alert-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email or Registration No.</label>
              <input 
                className="input-sys" 
                type="text" 
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)} 
                required
                placeholder="e.g. john@university.edu" 
              />
            </div>
            
            <div className="form-group mb-6">
              <div className="flex-between mb-2">
                <label className="form-label" style={{ margin: 0 }}>Password</label>
                <a href="#" style={{ fontSize: '12px', color: 'var(--primary-600)', fontWeight: 500 }}>Forgot password?</a>
              </div>
              <input 
                className="input-sys" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)} 
                required
                placeholder="Enter your password" 
              />
            </div>

            <button 
              className="btn btn-primary" 
              style={{ width: '100%', height: '40px', fontSize: '14px' }}
              type="submit" 
              disabled={loading}
            >
              {loading ? 'Signing in...' : (
                <>Sign in to dashboard <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '13px', color: 'var(--gray-500)' }}>
            Don't have an account? <Link to="/register" style={{ color: 'var(--gray-900)', fontWeight: 500 }}>Create one</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
