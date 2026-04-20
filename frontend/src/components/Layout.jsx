import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Search, Bell, Blocks, PanelLeftClose, Menu, X, User as UserIcon } from 'lucide-react';

const Layout = ({ children, navItems, pageTitle, onSearch, notifications }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const [showNotifications, setShowNotifications] = React.useState(false);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

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
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand-title">
            <Blocks className="brand-icon" />
            AttendEase
          </div>
          {/* Close button visible only on mobile */}
          <button
            className="btn-icon sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-content">
          <div className="mb-2" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 12px' }}>
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
                  <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--gray-900)', lineHeight: '1.2' }}>{user?.name.split(' ')[0]}</span>
                  <span style={{ fontSize: '11px', color: 'var(--gray-500)', textTransform: 'capitalize' }}>{user?.role}</span>
                </div>
             </div>
             <button onClick={() => { logout(); navigate('/login'); }} className="btn-icon" title="Logout">
               <LogOut size={16} />
             </button>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <main className="main-area">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            {/* Hamburger menu for mobile */}
            <button
              className="btn-icon mobile-menu-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <button className="btn-icon desktop-sidebar-btn">
              <PanelLeftClose size={18} />
            </button>
            <div className="breadcrumb">
              <span className="breadcrumb-prefix">AttendEase</span>
              <span style={{ margin: '0 8px', color: 'var(--gray-300)' }}>/</span>
              <span>{getPageTitle()}</span>
            </div>
          </div>
          
          <div className="topbar-right">
            {/* Context-aware Search */}
            {onSearch && (
              <div className="topbar-search input-sys">
                <Search size={14} style={{ color: 'var(--gray-400)', marginRight: '8px', flexShrink: 0 }} />
                <input 
                  type="text" 
                  placeholder="Search subjects..." 
                  onChange={(e) => onSearch(e.target.value)}
                  style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '13px' }} 
                />
              </div>
            )}
            
            {/* Notification Bell Dropdown */}
            <div className="notif-dropdown" style={{ position: 'relative' }}>
              <button className="btn-icon" onClick={() => setShowNotifications(!showNotifications)}>
                <Bell size={18} />
                {notifications && notifications.length > 0 && (
                  <span style={{ position: 'absolute', top: '4px', right: '4px', width: '6px', height: '6px', backgroundColor: 'var(--red-500)', borderRadius: '50%' }}></span>
                )}
              </button>
              
              {showNotifications && (
                <div className="notif-panel">
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gray-900)', marginBottom: '12px', borderBottom: '1px solid var(--gray-100)', paddingBottom: '8px' }}>
                    Alerts & Notifications
                  </div>
                  {(!notifications || notifications.length === 0) ? (
                    <div style={{ fontSize: '13px', color: 'var(--gray-500)', textAlign: 'center', padding: '16px 0' }}>All caught up!</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
                      {notifications.map((notif, idx) => (
                        <div key={idx} style={{ padding: '12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--red-50)', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '12px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--red-600)', marginBottom: '4px' }}>Attention Required</div>
                          <div style={{ color: 'var(--gray-700)' }}>{notif}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
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
