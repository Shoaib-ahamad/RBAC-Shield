// src/pages/AdminPanel.tsx
import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

interface UserItem {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
}

export const AdminPanel: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Retrieve user list from the admin endpoint
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const { data } = await api.get('/users');
      setUsers(data);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || "Failed to load user list" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle role modification triggers
  const handleRoleChange = async (targetUserId: string, newRole: string) => {
    setMessage(null);
    try {
      const { data } = await api.put(`/users/${targetUserId}/role`, { role: newRole });
      setMessage({ type: 'success', text: data.message || "User role updated successfully" });
      fetchUsers(); // Refresh the list
    } catch (err: any) {
      // Catches and outputs: "You cannot modify your own role. Please ask another administrator to do this."
      const errMsg = err.response?.data?.error || "Failed to update role";
      setMessage({ type: 'error', text: errMsg });
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '3rem' }}>
      
      {/* Intro Header */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>⚙️ Administrative Console</h1>
        <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-secondary))' }}>
          Monitor system accounts and modify security clearance roles.
        </p>
      </div>

      {/* Action logs display */}
      {message && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: '2rem' }}>
          <span>{message.type === 'success' ? '🛡️' : '⚠️'}</span>
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Admin Content */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div className="spinner" style={{ width: '3rem', height: '3rem' }}></div>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '1.5rem', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'hsl(var(--text-secondary))', fontSize: '0.875rem' }}>
                <th style={{ padding: '1rem' }}>User Email</th>
                <th style={{ padding: '1rem' }}>Unique Account ID</th>
                <th style={{ padding: '1rem' }}>Joined Date</th>
                <th style={{ padding: '1rem' }}>Current Role</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Security Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = u.id === currentUser?.id;
                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.02)', fontSize: '0.9rem' }}>
                    
                    {/* Email column */}
                    <td style={{ padding: '1rem', fontWeight: 500 }}>
                      {u.email} {isSelf && <span style={{ fontSize: '0.75rem', color: 'hsl(var(--accent-secondary))' }}>(You)</span>}
                    </td>

                    {/* ID column */}
                    <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
                      {u.id}
                    </td>

                    {/* Date column */}
                    <td style={{ padding: '1rem', color: 'hsl(var(--text-secondary))' }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>

                    {/* Status badge column */}
                    <td style={{ padding: '1rem' }}>
                      <span className={`badge ${u.role === 'ADMIN' ? 'badge-admin' : 'badge-user'}`}>
                        {u.role}
                      </span>
                    </td>

                    {/* Actions column */}
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      {isSelf ? (
                        <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', fontStyle: 'italic' }}>
                          Locked (Self)
                        </span>
                      ) : (
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="form-input"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', display: 'inline-block', width: '110px' }}
                        >
                          <option value="USER">USER</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      )}
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};
