// src/App.tsx
import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { AdminPanel } from './pages/AdminPanel';

// Main content dispatcher switching views based on auth and tabs
const MainAppContent: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const [isRegisterView, setIsRegisterView] = useState(false);
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'admin'>('dashboard');

  // 1. Show spinning loader while checking active session cookies
  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
        <div className="spinner" style={{ width: '3.5rem', height: '3.5rem' }}></div>
        <p style={{ fontFamily: 'Outfit, sans-serif', color: 'hsl(var(--text-secondary))', fontSize: '0.9rem', letterSpacing: '0.05em' }}>
          VERIFYING ACCESS CRITERIA...
        </p>
      </div>
    );
  }

  // 2. Unauthenticated views
  if (!isAuthenticated) {
    if (isRegisterView) {
      return <Register onToggleView={() => setIsRegisterView(false)} />;
    }
    return <Login onToggleView={() => setIsRegisterView(true)} />;
  }

  // 3. Authenticated views (Dashboard / Admin Console)
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />
      
      <main style={{ flexGrow: 1, padding: '1rem 0' }}>
        {currentTab === 'dashboard' ? <Dashboard /> : <AdminPanel />}
      </main>

      {/* Footer credits */}
      <footer style={{ padding: '2rem 0', textAlign: 'center', borderTop: '1px solid var(--glass-border)', fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginTop: 'auto' }}>
        🛡️ Secure RBAC & Task Dashboard Assignment © 2026. All Security Barriers Enforced.
      </footer>
    </div>
  );
};

// Top-level App wrapper injecting the AuthContext provider
const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
};

export default App;
