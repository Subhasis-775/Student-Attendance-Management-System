import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { User, Shield, KeyRound, Save, AlertCircle, CheckCircle2, LayoutDashboard, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';

const Profile = () => {
  const { user } = useAuth();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Password visibility states
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const navItems = [
    { path: user?.role === 'admin' ? '/admin' : user?.role === 'faculty' ? '/faculty' : '/student', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { path: '/profile', icon: <User size={18} />, label: 'Profile' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError("New passwords don't match");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);
      const config = {
        headers: { Authorization: `Bearer ${user.token}` }
      };

      await axios.put('http://localhost:5000/api/auth/change-password', {
        currentPassword,
        newPassword
      }, config);

      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout navItems={navItems} pageTitle="My Profile">
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        
        {/* Profile Details Card */}
        <div className="card">
          <div className="section-head" style={{ padding: '20px 24px 0', borderBottom: '1px solid var(--gray-100)', paddingBottom: '16px', marginBottom: '0' }}>
            <span className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={20} className="text-primary-500" />
              User Information
            </span>
          </div>
          
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--primary-100)', color: 'var(--primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 600 }}>
                {user?.name?.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--gray-900)', margin: 0 }}>{user?.name}</h3>
                <span className="badge" style={{ marginTop: '4px', background: 'var(--primary-50)', color: 'var(--primary-700)', textTransform: 'capitalize' }}>
                  {user?.role} Role
                </span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--gray-100)', paddingTop: '16px', marginTop: '8px' }}>
              <div className="grid" style={{ gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--gray-500)', fontWeight: 500, marginBottom: '4px' }}>Email Address</div>
                  <div style={{ fontSize: '14px', color: 'var(--gray-800)' }}>{user?.email}</div>
                </div>
                {user?.registrationNumber && (
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--gray-500)', fontWeight: 500, marginBottom: '4px' }}>Registration / ID Number</div>
                    <div style={{ fontSize: '14px', color: 'var(--gray-800)' }}>{user?.registrationNumber}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="card">
          <div className="section-head" style={{ padding: '20px 24px 0', borderBottom: '1px solid var(--gray-100)', paddingBottom: '16px', marginBottom: '0', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
            <span className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={20} className="text-primary-500" />
              Security Settings
            </span>
            <p style={{ fontSize: '13px', color: 'var(--gray-500)', margin: 0 }}>
              Update your password to keep your account secure.
            </p>
          </div>

          <div style={{ padding: '24px' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', backgroundColor: 'var(--red-50)', color: 'var(--red-700)', borderRadius: 'var(--radius-md)', fontSize: '13px' }}>
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}
              
              {success && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', backgroundColor: 'var(--green-50)', color: 'var(--green-700)', borderRadius: 'var(--radius-md)', fontSize: '13px' }}>
                  <CheckCircle2 size={16} />
                  Password updated successfully!
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Current Password</label>
                <div className="input-sys" style={{ position: 'relative', paddingLeft: '36px', paddingRight: '40px' }}>
                  <KeyRound size={16} style={{ position: 'absolute', left: '12px', color: 'var(--gray-400)' }} />
                  <input
                    type={showCurrent ? "text" : "password"}
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', height: '100%', fontSize: '14px' }}
                    required
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowCurrent(!showCurrent)}
                    style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)', display: 'flex', padding: 0 }}
                  >
                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">New Password</label>
                <div className="input-sys" style={{ position: 'relative', paddingLeft: '36px', paddingRight: '40px' }}>
                  <KeyRound size={16} style={{ position: 'absolute', left: '12px', color: 'var(--gray-400)' }} />
                  <input
                    type={showNew ? "text" : "password"}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', height: '100%', fontSize: '14px' }}
                    required
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowNew(!showNew)}
                    style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)', display: 'flex', padding: 0 }}
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <div className="input-sys" style={{ position: 'relative', paddingLeft: '36px', paddingRight: '40px' }}>
                  <KeyRound size={16} style={{ position: 'absolute', left: '12px', color: 'var(--gray-400)' }} />
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', height: '100%', fontSize: '14px' }}
                    required
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowConfirm(!showConfirm)}
                    style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)', display: 'flex', padding: 0 }}
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                style={{ marginTop: '8px', display: 'flex', justifyContent: 'center', width: '100%' }}
              >
                {loading ? (
                  <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'var(--white)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                ) : (
                  <>
                    <Save size={16} />
                    Update Password
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

      </div>
    </Layout>
  );
};

export default Profile;
