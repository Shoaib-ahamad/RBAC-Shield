// src/pages/Login.tsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface LoginProps {
  onToggleView: () => void;
}

export const Login: React.FC<LoginProps> = ({ onToggleView }) => {
  const { login, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setMessage(null);

    if (!email || !password) {
      setMessage({ type: 'error', text: 'All fields are required' });
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      // Success will automatically update global context and trigger dashboard redirect
    } catch (err: any) {
      const errMsg = err.response?.data?.error || "Login request failed. Please check your credentials.";
      setMessage({ type: 'error', text: errMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: 'radial-gradient(circle at top, rgba(99, 102, 241, 0.1) 0%, rgba(6, 8, 20, 1) 70%)' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem' }}>
        
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span style={{ fontSize: '3rem' }}>🛡️</span>
          <h2 style={{ fontSize: '1.8rem', marginTop: '0.5rem', fontWeight: 800 }} className="glow-text">Welcome Back</h2>
          <p style={{ fontSize: '0.875rem', color: 'hsl(var(--text-secondary))', marginTop: '0.25rem' }}>
            Access the secure RBAC and Task management system
          </p>
        </div>

        {/* Feedback message display */}
        {message && (
          <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
            <span>{message.type === 'success' ? '✅' : '❌'}</span>
            <span>{message.text}</span>
          </div>
        )}

        {/* Form elements */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="name@domain.com"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', height: '45px', marginBottom: '1.5rem' }}
            disabled={loading}
          >
            {loading ? <div className="spinner" style={{ margin: '0 auto' }}></div> : 'Sign In'}
          </button>
        </form>

        {/* View Toggle */}
        <div style={{ textAlign: 'center', fontSize: '0.875rem', color: 'hsl(var(--text-secondary))' }}>
          Don't have an account?{' '}
          <button
            onClick={onToggleView}
            style={{ background: 'transparent', border: 'none', color: 'hsl(var(--accent-secondary))', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
            disabled={loading}
          >
            Create Account
          </button>
        </div>

        {/* Seed account helpers */}
        <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(255, 255, 255, 0.01)', border: '1px dashed var(--glass-border)', borderRadius: '8px', fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
          <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'hsl(var(--text-secondary))' }}>💡 Quick Test credentials:</div>
          <div>👤 User Admin: <strong style={{ color: 'hsl(var(--text-secondary))' }}>admin@system.com</strong> / AdminPass123</div>
          <div style={{ marginTop: '0.25rem' }}>👥 Regular User: <strong style={{ color: 'hsl(var(--text-secondary))' }}>user@system.com</strong> / UserPass123</div>
        </div>

      </div>
    </div>
  );
};
