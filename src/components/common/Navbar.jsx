import React from 'react';
import { useDap } from '../../context/DapContext';
import Logo from './Logo';
import { Sun, Moon, User, Shield, LogOut, LayoutDashboard, Home as HomeIcon } from 'lucide-react';

export default function Navbar() {
  const { currentUser, activeView, setActiveView, theme, setTheme, handleLogout } = useDap();

  return (
    <nav className="saas-navbar">
      <div className="saas-navbar__container">
        <div style={{ cursor: 'pointer' }} onClick={() => setActiveView(currentUser ? (currentUser.role === 'admin' ? 'admin-dashboard' : 'student-dashboard') : 'home')}>
          <Logo />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <button 
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} 
            className="saas-button saas-button--secondary" 
            style={{ padding: '0.5rem', borderRadius: '50%' }}
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button 
                onClick={() => setActiveView(currentUser.role === 'admin' ? 'admin-dashboard' : 'student-dashboard')}
                className={`saas-button ${activeView.includes('dashboard') ? 'saas-button--primary' : 'saas-button--secondary'}`}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
              >
                <LayoutDashboard size={16} /> {currentUser.role === 'admin' ? 'Admin Dashboard' : 'Student Portal'}
              </button>

              <button 
                onClick={handleLogout}
                className="saas-button saas-button--secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', color: 'var(--danger)' }}
                title="Secure Logout"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setActiveView('login')}
              className="saas-button saas-button--primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem' }}
            >
              <User size={16} /> Login / Register
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
