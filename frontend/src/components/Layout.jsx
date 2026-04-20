import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Search, Bell, Blocks, PanelLeftClose, Menu, X, User as UserIcon, Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Layout = ({ children, navItems, pageTitle, onSearch, notifications }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const [showNotifications, setShowNotifications] = React.useState(false);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  // Theme Management
  const [theme, setTheme] = React.useState(localStorage.getItem('attendease-theme') || 'light');

  React.useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('attendease-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const getPageTitle = () => {
    if (pageTitle) return pageTitle;
    const item = navItems.find(i => location.pathname === i.path || (i.path !== '/admin' && i.path !== '/faculty' && i.path !== '/student' && location.pathname.startsWith(i.path)));
    return item ? item.label : 'Overview';
  };

  // Close sidebar when navigating on mobile
  const handleNavClick = (path) => {
    navigate(path);
    setSidebarOpen(false);
  };

  // Close notifications when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (showNotifications && !e.target.closest('.notif-dropdown')) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  return (
    <div className="app-container">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="sidebar-overlay"
            style={{ display: 'block' }} // override css display:none
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand-title">
            <Blocks className="brand-icon" />
            AttendEase
          </div>
          {/* Close button visible only on mobile */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="btn-icon sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </motion.button>
        </div>

        <div className="sidebar-content">
          <div className="mb-2" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 12px' }}>
            Menu
          </div>
          {navItems.map(item => {
            const isActive = location.pathname === item.path || 
              (item.path !== '/admin' && item.path !== '/faculty' && item.path !== '/student' && location.pathname.startsWith(item.path));
              
            return (
              <div
                key={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleNavClick(item.path)}
              >
                {item.icon}
                {item.label}
              </div>
            );
          })}
        </div>

        <div className="sidebar-footer">
          <div className="flex-between">
             <div className="flex-start" style={{ gap: '8px' }}>
                <div className="avatar" style={{ width: '28px', height: '28px', fontSize: '11px' }}>{initials}</div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)', lineHeight: '1.2' }}>{user?.name.split(' ')[0]}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{user?.role}</span>
                </div>
             </div>
             <motion.button whileTap={{ scale: 0.9 }} onClick={() => { logout(); navigate('/login'); }} className="btn-icon" title="Logout">
               <LogOut size={16} />
             </motion.button>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <main className="main-area">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            {/* Hamburger menu for mobile */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              className="btn-icon mobile-menu-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }} className="btn-icon desktop-sidebar-btn">
              <PanelLeftClose size={18} />
            </motion.button>
            <div className="breadcrumb">
              <span className="breadcrumb-prefix">AttendEase</span>
              <span style={{ margin: '0 8px', color: 'var(--text-muted)' }}>/</span>
              <span>{getPageTitle()}</span>
            </div>
          </div>
          
          <div className="topbar-right">
            {/* Context-aware Search */}
            {onSearch && (
              <div className="topbar-search input-sys">
                <Search size={14} style={{ color: 'var(--text-muted)', marginRight: '8px', flexShrink: 0 }} />
                <input 
                  type="text" 
                  placeholder="Search subjects..." 
                  onChange={(e) => onSearch(e.target.value)}
                  style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '13px', color: 'var(--text-primary)' }} 
                />
              </div>
            )}
            
            {/* Theme Toggle */}
            <motion.button whileTap={{ scale: 0.9 }} className="btn-icon" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </motion.button>

            {/* Notification Bell Dropdown */}
            <div className="notif-dropdown" style={{ position: 'relative' }}>
              <motion.button whileTap={{ scale: 0.9 }} className="btn-icon" onClick={() => setShowNotifications(!showNotifications)}>
                <Bell size={18} />
                {notifications && notifications.length > 0 && (
                  <span style={{ position: 'absolute', top: '4px', right: '4px', width: '6px', height: '6px', backgroundColor: 'var(--red-500)', borderRadius: '50%' }}></span>
                )}
              </motion.button>
              
              <AnimatePresence>
              {showNotifications && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="notif-panel"
                >
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
                    Alerts & Notifications
                  </div>
                  {(!notifications || notifications.length === 0) ? (
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', padding: '16px 0' }}>All caught up!</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
                      {notifications.map((notif, idx) => (
                        <div key={idx} style={{ padding: '12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--red-50)', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '12px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--red-600)', marginBottom: '4px' }}>Attention Required</div>
                          <div style={{ color: 'var(--text-secondary)' }}>{notif}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="content-frame">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
