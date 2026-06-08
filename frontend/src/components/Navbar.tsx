// src/components/Navbar.tsx
import React from 'react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  currentTab: 'dashboard' | 'admin';
  setCurrentTab: (tab: 'dashboard' | 'admin') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab }) => {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <nav className="glass-card" style={{ padding: '1rem 2rem', borderRadius: '0 0 16px 16px', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontSize: '1.75rem' }}>🛡️</span>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #a78bfa, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            RBAC CONTROL
          </h2>
          <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-secondary))', letterSpacing: '0.05em' }}>SECURE ACCESS CENTER</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        {/* Navigation tabs */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`btn ${currentTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          >
            📋 Tasks Board
          </button>
          
          {/* Admin tab visible only if current user has ADMIN privileges */}
          {user.role === 'ADMIN' && (
            <button
              onClick={() => setCurrentTab('admin')}
              className={`btn ${currentTab === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            >
              ⚙️ Admin Panel
            </button>
          )}
        </div>

        {/* User Identity info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '1px solid var(--glass-border)', paddingLeft: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{user.email}</span>
            <span className={`badge ${user.role === 'ADMIN' ? 'badge-admin' : 'badge-user'}`} style={{ fontSize: '0.65rem', marginTop: '0.25rem' }}>
              {user.role}
            </span>
          </div>

          <button onClick={logout} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', borderColor: 'hsl(var(--accent-danger))', color: '#fca5a5' }}>
            🚪 Logout
          </button>
        </div>
      </div>
    </nav>
  );
};
