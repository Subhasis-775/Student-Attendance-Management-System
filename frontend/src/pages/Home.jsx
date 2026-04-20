import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Blocks, CheckCircle2, BarChart3, Layers, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user } = useAuth();

  // If user is already logged in, redirect them immediately
  if (user) {
    if (user.role === 'admin') return <Navigate to="/admin" />;
    if (user.role === 'faculty') return <Navigate to="/faculty" />;
    return <Navigate to="/student" />;
  }

  const features = [
    {
      icon: <CheckCircle2 size={24} style={{ color: 'var(--green-500)' }} />,
      title: 'Effortless Tracking',
      description: 'Mark attendance seamlessly. Spend less time calling names and more time educating.'
    },
    {
      icon: <BarChart3 size={24} style={{ color: 'var(--primary-500)' }} />,
      title: 'Visual Analytics',
      description: 'Dynamic dashboards providing instant insights into historical attendance trends.'
    },
    {
      icon: <ShieldCheck size={24} style={{ color: 'var(--red-500)' }} />,
      title: 'Eligibility Detection',
      description: 'Automatic flagging for students falling below the 75% attendance threshold.'
    },
    {
      icon: <Layers size={24} style={{ color: 'var(--amber-500)' }} />,
      title: 'Centralized Platform',
      description: 'One cohesive system for admins, faculty, and students to communicate and track progress.'
    }
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      {/* Navigation Layer */}
      <nav style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', backdropFilter: 'blur(12px)', background: 'var(--bg-glass)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '20px', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
          <Blocks size={24} style={{ color: 'var(--primary-500)' }} /> AttendEase
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Link to="/login" className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: '14px' }}>Log In</Link>
          <Link to="/register" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '14px' }}>Get Started</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '120px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Subtle Background Pattern */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(var(--border-strong) 1px, transparent 1px)', backgroundSize: '32px 32px', opacity: 0.4, pointerEvents: 'none' }}></div>
        
        <div style={{ position: 'relative', zIndex: 10, maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--bg-surface-hover)', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, color: 'var(--primary-600)', marginBottom: '24px', border: '1px solid var(--border-subtle)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary-500)', display: 'inline-block' }}></span> 
            SaaS Academic Operations
          </div>
          <h1 style={{ fontSize: '56px', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: '1.1', marginBottom: '24px', color: 'var(--text-primary)' }}>
            Attendance tracking, <br />
            <span style={{ color: 'var(--primary-500)' }}>magnificently simplified.</span>
          </h1>
          <p style={{ fontSize: '18px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px' }}>
            Elevate your institution with a production-grade infrastructure designed to manage enrollments, track daily attendance, and process leave requests seamlessly.
          </p>
          
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary" style={{ padding: '14px 28px', fontSize: '16px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              Start for Free <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn btn-secondary" style={{ padding: '14px 28px', fontSize: '16px', borderRadius: '8px' }}>
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Features Showcase */}
      <section style={{ padding: '80px 24px', background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)', position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '16px' }}>Built for the Modern University</h2>
            <p style={{ fontSize: '16px', color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto' }}>
              Everything you need to run academic operations from a single dashboard. Stop relying on outdated spreadsheets.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '32px' }}>
            {features.map((pkg, idx) => (
              <div key={idx} style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '32px 24px', transition: 'all 0.3s ease', cursor: 'default' }} 
                   onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
                   onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--bg-surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                  {pkg.icon}
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>{pkg.title}</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  {pkg.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer style={{ padding: '40px 24px', textAlign: 'center', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-base)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '16px' }}>
          <Blocks size={20} /> AttendEase
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
          © {new Date().getFullYear()} AttendEase System. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Home;
