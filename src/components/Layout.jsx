import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Package,
  Settings,
  TrendingUp,
  LogOut,
  Menu,
  X,
  Milk,
  DollarSign,
  ClipboardList,
  IndianRupee,
  User
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import DynamicBackground from './DynamicBackground';


const Layout = ({ children }) => {
  const { user, logout, t, language, changeLanguage } = useAuth();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const location = useLocation();

  const adminMenu = [
    { name: t('dashboard'), icon: LayoutDashboard, path: '/' },
    { name: t('stock_control'), icon: ClipboardList, path: '/stock' },
    { name: t('financials'), icon: IndianRupee, path: '/financials' },
    { name: t('reports'), icon: TrendingUp, path: '/reports' },
    { name: t('settings'), icon: Settings, path: '/settings' },
  ];

  const staffMenu = [
    { name: t('dashboard'), icon: LayoutDashboard, path: '/' },
    { name: t('stock_control'), icon: ClipboardList, path: '/stock' },
    { name: t('settings'), icon: Settings, path: '/settings' },
  ];

  const menuItems = user?.role === 'ADMIN' ? adminMenu : staffMenu;

  const currentPath = location.pathname;
  const currentMenu = menuItems.find(item => item.path === currentPath);

  return (
    <div className={`layout-container lang-${language?.toLowerCase() || 'english'}`}>
      <DynamicBackground />

      {/* Sidebar - Desktop Only */}
      <aside className="sidebar desktop-only">
        <div className="sidebar-header">
          <img src="/favicon.png" alt="Logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
          <span className="brand-name">Aavinam</span>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;

            return (
              <Link
                key={item.name}
                to={item.path}
                className={`nav-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={20} style={{ flexShrink: 0 }} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-language-selector">
            {[
              { id: 'English', label: 'EN' },
              { id: 'Tamil', label: 'TA' },
              { id: 'Hindi', label: 'HI' }
            ].map((lang) => (
              <button
                key={lang.id}
                onClick={() => changeLanguage(lang.id)}
                className={`sidebar-lang-btn ${language === lang.id ? 'active' : ''}`}
                title={lang.id}
              >
                {lang.label}
              </button>
            ))}
          </div>

          <div className="user-profile">
            <div className="avatar">
              {user?.username ? user.username[0].toUpperCase() : '?'}
            </div>
            <div className="user-info">
              <div className="username">{user?.username || t('guest')}</div>
              <div className="role">{t(user?.role?.toLowerCase() || 'no_role')}</div>
            </div>
          </div>
          <button onClick={() => setShowLogoutConfirm(true)} className="logout-btn">
            <LogOut size={18} style={{ flexShrink: 0 }} /> <span>{t('logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Top Header - Mobile Only Branding or Page Title */}
        <header className="top-header">
          <div className="flex items-center gap-2">
            <img src="/favicon.png" alt="Logo" className="mobile-only" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
            <h1 className="page-title">
              {currentMenu?.name || 'Aavinam'}
            </h1>
          </div>

          <div className="user-avatar-mobile mobile-only">
            <div className="avatar-small">
              {user?.username ? user.username[0].toUpperCase() : '?'}
            </div>
          </div>
        </header>

        <div className="app-container">
          {children}
        </div>
      </main>

      {/* Bottom Bar - Mobile/Tablet Only */}
      <nav className="bottom-bar mobile-tablet-only">
        {menuItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path;

          return (
            <Link
              key={item.name}
              to={item.path}
              className={`bottom-nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={22} style={{ flexShrink: 0 }} />
              <span className="nav-label">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="modal-overlay logout-overlay">
          <div className="modal-content logout-card">
            <div className="logout-card-header">
              <div className="logout-icon-wrapper">
                <LogOut size={28} />
              </div>
              <h3>{t('ready_to_leave')}</h3>
              <p>{t('logout_warning')}</p>
            </div>
            
            <div className="logout-card-actions">
              <button 
                onClick={() => setShowLogoutConfirm(false)} 
                className="btn-secondary"
              >
                {t('stay_logged_in')}
              </button>
              <button 
                onClick={logout} 
                className="btn-danger"
              >
                {t('yes_logout')}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .layout-container {
          display: flex;
          min-height: 100vh;
          background: transparent;
        }


        /* Sidebar Styles */
        .sidebar {
          width: 200px;
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-right: 1px solid rgba(255, 255, 255, 0.3);

          position: fixed;
          top: 0;
          bottom: 0;
          left: 0;
          display: flex;
          flex-direction: column;
          z-index: 50;
        }

        .sidebar-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 24px;
          border-bottom: 1px solid var(--border);
        }

        .brand-name {
          font-weight: 800;
          font-size: 1.5rem;
          color: var(--text-main);
        }

        .sidebar-nav {
          flex: 1;
          padding: 20px 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 12px;
          color: var(--text-muted);
          text-decoration: none;
          font-weight: 500;
          transition: all 0.2s;
        }

        .nav-link:hover {
          background: #f1f5f9;
          color: var(--text-main);
        }

        .nav-link.active {
          background: #eff6ff;
          color: var(--primary);
          font-weight: 600;
        }

        .sidebar-footer {
          padding: 20px 16px;
          border-top: 1px solid var(--border);
        }

        .user-profile {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          padding: 8px;
          background: #f8fafc;
          border-radius: 14px;
        }

        .sidebar-language-selector {
          display: flex;
          gap: 4px;
          margin-bottom: 12px;
          padding: 4px;
          background: #f1f5f9;
          border-radius: 10px;
        }

        .sidebar-lang-btn {
          flex: 1;
          padding: 6px 0;
          font-size: 0.65rem;
          font-weight: 800;
          border-radius: 8px;
          color: var(--text-muted);
          transition: all 0.2s;
        }

        .sidebar-lang-btn:hover {
          color: var(--text-main);
          background: rgba(255, 255, 255, 0.5);
        }

        .sidebar-lang-btn.active {
          background: white;
          color: var(--primary);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .avatar {
          width: 40px;
          height: 40px;
          background: var(--primary);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 1.1rem;
        }

        .user-info .username {
          font-weight: 600;
          font-size: 0.95rem;
          color: var(--text-main);
        }

        .user-info .role {
          font-size: 0.75rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .logout-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border-radius: 10px;
          color: #ef4444;
          background: #fef2f2;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .logout-btn:hover {
          background: #fee2e2;
        }

        /* Main Content Styles */
        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .top-header {
          height: 64px;
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.3);

          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          position: sticky;
          top: 0;
          z-index: 40;
        }

        .page-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-main);
        }

        .app-container {
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
        }

        /* Bottom Bar Styles */
        .bottom-bar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 70px;
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-top: 1px solid rgba(255, 255, 255, 0.2);

          display: flex;
          align-items: center;
          justify-content: space-around;
          padding: 0 10px;
          z-index: 100;
        }

        .bottom-nav-link {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          color: var(--text-muted);
          text-decoration: none;
          padding: 8px;
          flex: 1;
          transition: all 0.2s;
        }

        .bottom-nav-link.active {
          color: var(--primary);
        }

        .nav-label {
          font-size: 0.65rem;
          font-weight: 600;
        }

        .user-avatar-mobile .avatar-small {
          width: 32px;
          height: 32px;
          background: var(--primary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 0.8rem;
        }

        /* Responsive Visibility */
        .desktop-only { display: none; }
        .mobile-only { display: block; }
        .mobile-tablet-only { display: flex; }

        @media (min-width: 1024px) {
          .desktop-only { display: flex; }
          .mobile-only { display: none; }
          .mobile-tablet-only { display: none; }
          .main-content { margin-left: 260px; }
          .top-header { padding: 0 32px; }
          .app-container { padding: 32px; }
        }

        @media (max-width: 1023px) {
          .main-content { margin-bottom: 70px; } /* Space for bottom bar */
        }

        /* Logout Modal Styles */
        .logout-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.5);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
          animation: fadeIn 0.2s ease-out;
        }

        .logout-card {
          width: 100%;
          max-width: 400px;
          background: white;
          border-radius: 24px;
          padding: 32px;
          text-align: center;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .logout-icon-wrapper {
          width: 64px;
          height: 64px;
          background: #fef2f2;
          color: #ef4444;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
        }

        .logout-card h3 {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 12px;
        }

        .logout-card p {
          color: var(--text-muted);
          line-height: 1.6;
          margin-bottom: 32px;
          font-size: 0.95rem;
        }

        .logout-card-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .btn-secondary {
          padding: 12px;
          border-radius: 12px;
          font-weight: 600;
          background: #f8fafc;
          color: var(--text-main);
          border: 1px solid var(--border);
          transition: all 0.2s;
        }

        .btn-secondary:hover {
          background: #f1f5f9;
        }

        .btn-danger {
          padding: 12px;
          border-radius: 12px;
          font-weight: 600;
          background: #ef4444;
          color: white;
          transition: all 0.2s;
          box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.2);
        }

        .btn-danger:hover {
          background: #dc2626;
          transform: translateY(-1px);
          box-shadow: 0 6px 8px -1px rgba(239, 68, 68, 0.3);
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* Language specific adjustments */
        .lang-tamil .logout-card h3 { font-size: 1.3rem; }
        .lang-hindi .logout-card h3 { font-size: 1.4rem; }
      `}</style>
    </div>
  );
};

export default Layout;

