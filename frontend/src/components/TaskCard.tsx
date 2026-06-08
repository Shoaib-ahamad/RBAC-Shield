// src/components/TaskCard.tsx
import React from 'react';
import { useAuth } from '../context/AuthContext';

export interface TaskType {
  id: string;
  title: string;
  description: string | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  version: number;
  createdById: string;
  createdBy: { id: string; email: string };
  assignedToId: string | null;
  assignedTo: { id: string; email: string } | null;
  createdAt: string;
}

interface TaskCardProps {
  task: TaskType;
  onEdit: (task: TaskType) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, newStatus: TaskType['status'], currentVersion: number) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onDelete, onStatusChange }) => {
  const { user } = useAuth();

  if (!user) return null;

  // Security Check: Only the task creator or an administrator can modify or delete a task
  const isOwner = task.createdById === user.id;
  const isAdmin = user.role === 'ADMIN';
  const canModify = isOwner || isAdmin;

  // Return appropriate badge CSS class name based on status
  const getStatusClass = (status: TaskType['status']) => {
    switch (status) {
      case 'PENDING': return 'badge-pending';
      case 'IN_PROGRESS': return 'badge-progress';
      case 'COMPLETED': return 'badge-completed';
      default: return 'badge-user';
    }
  };

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem', transition: 'all 0.2s' }}>
      
      {/* Task Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
        <h4 style={{ fontSize: '1.1rem', fontWeight: 600, wordBreak: 'break-word' }}>{task.title}</h4>
        <span className={`badge ${getStatusClass(task.status)}`}>
          {task.status.replace('_', ' ')}
        </span>
      </div>

      {/* Task Description */}
      <p style={{ fontSize: '0.9rem', color: 'hsl(var(--text-secondary))', flexGrow: 1, whiteSpace: 'pre-line' }}>
        {task.description || 'No description provided.'}
      </p>

      {/* Task Metadata */}
      <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', borderTop: '1px solid var(--glass-border)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <div>✍️ Creator: <strong style={{ color: 'hsl(var(--text-secondary))' }}>{task.createdBy.email}</strong></div>
        <div>👤 Assignee: <strong style={{ color: 'hsl(var(--text-secondary))' }}>{task.assignedTo?.email || 'Unassigned'}</strong></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
          <span>📅 {new Date(task.createdAt).toLocaleDateString()}</span>
          <span>🔄 Version: <strong>v{task.version}</strong></span>
        </div>
      </div>

      {/* Actions Layer */}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', borderTop: '1px solid var(--glass-border)', paddingTop: '0.75rem', justifyContent: 'space-between', alignItems: 'center' }}>
        
        {/* Status quick toggle (Only allowed if user can modify) */}
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {canModify ? (
            <select
              value={task.status}
              onChange={(e) => onStatusChange(task.id, e.target.value as TaskType['status'], task.version)}
              className="form-input"
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', width: '110px', height: '30px' }}
            >
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
          ) : (
            <span style={{ fontSize: '0.75rem', fontStyle: 'italic' }}>View Only</span>
          )}
        </div>

        {/* Edit/Delete commands */}
        {canModify && (
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button
              onClick={() => onEdit(task)}
              className="btn btn-secondary"
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', height: '30px' }}
              title="Edit Task"
            >
              ✏️ Edit
            </button>
            <button
              onClick={() => onDelete(task.id)}
              className="btn btn-danger"
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', height: '30px' }}
              title="Delete Task"
            >
              🗑️ Delete
            </button>
          </div>
        )}
      </div>

    </div>
  );
};
