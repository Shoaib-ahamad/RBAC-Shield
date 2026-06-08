// src/pages/Dashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { TaskCard, TaskType } from '../components/TaskCard';
import { Modal } from '../components/Modal';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [total, setTotal] = useState(0);
  
  // Query Filters State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [limit] = useState(6); // 6 cards per page
  
  // Loading & Alerts State
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskType | null>(null);
  
  // Form fields state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'PENDING' | 'IN_PROGRESS' | 'COMPLETED'>('PENDING');
  const [assignedToId, setAssignedToId] = useState('');
  
  // Administrators can load users for assignations
  const [usersList, setUsersList] = useState<{ id: string; email: string }[]>([]);

  // Fetches tasks list with pagination and search queries
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const offset = (page - 1) * limit;
      const { data } = await api.get('/tasks', {
        params: {
          search: search || undefined,
          status: statusFilter || undefined,
          limit,
          offset
        }
      });
      setTasks(data.tasks);
      setTotal(data.total);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || "Failed to load tasks" });
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page, limit]);

  // Fetches all users for task assignment dropdown (Admins only)
  const fetchUsers = useCallback(async () => {
    if (user?.role !== 'ADMIN') return;
    try {
      const { data } = await api.get('/users');
      setUsersList(data);
    } catch (err) {
      console.error("Failed to load user list for assignment:", err);
    }
  }, [user]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Reset page when filters change
  const handleFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    setPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  // Open modal in create mode
  const handleOpenCreateModal = () => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setStatus('PENDING');
    setAssignedToId('');
    setIsModalOpen(true);
  };

  // Open modal in edit mode
  const handleOpenEditModal = (task: TaskType) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || '');
    setStatus(task.status);
    setAssignedToId(task.assignedToId || '');
    setIsModalOpen(true);
  };

  // Submits either a Create or Update task request
  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!title.trim()) {
      setMessage({ type: 'error', text: 'Title is required' });
      return;
    }

    try {
      if (editingTask) {
        // UPDATE (Includes optimistic version checking)
        await api.put(`/tasks/${editingTask.id}`, {
          title,
          description: description || null,
          status,
          assignedToId: assignedToId || null,
          version: editingTask.version // Send current client version
        });
        setMessage({ type: 'success', text: 'Task updated successfully' });
      } else {
        // CREATE
        await api.post('/tasks', {
          title,
          description: description || null,
          status,
          assignedToId: assignedToId || null
        });
        setMessage({ type: 'success', text: 'Task created successfully' });
      }
      setIsModalOpen(false);
      fetchTasks();
    } catch (err: any) {
      const errMsg = err.response?.data?.error || "Action failed";
      setMessage({ type: 'error', text: errMsg });
    }
  };

  // Handles quick status dropdown toggle on the card (incorporates OCC versioning)
  const handleQuickStatusChange = async (id: string, newStatus: TaskType['status'], currentVersion: number) => {
    setMessage(null);
    try {
      await api.put(`/tasks/${id}`, {
        status: newStatus,
        version: currentVersion // Send current client version to verify concurrency
      });
      setMessage({ type: 'success', text: 'Task status updated' });
      fetchTasks();
    } catch (err: any) {
      // OCC Failure will output: "Task was modified by another user. Please reload the task and try again."
      const errMsg = err.response?.data?.error || "Failed to update status";
      setMessage({ type: 'error', text: errMsg });
      fetchTasks(); // Force reload to fetch the latest database state
    }
  };

  // Deletes task
  const handleDeleteTask = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    setMessage(null);
    try {
      await api.delete(`/tasks/${id}`);
      setMessage({ type: 'success', text: 'Task deleted successfully' });
      fetchTasks();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || "Delete failed" });
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="container" style={{ paddingBottom: '3rem' }}>
      
      {/* Search and Action Toolbar */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>Tasks Dashboard</h1>
            <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-secondary))' }}>
              Manage, filter, and track task lifecycles securely
            </p>
          </div>
          <button onClick={handleOpenCreateModal} className="btn btn-primary">
            ➕ Create New Task
          </button>
        </div>

        {/* Filters and Inputs row */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search box */}
          <div style={{ flexGrow: 1, minWidth: '200px' }}>
            <input
              type="text"
              placeholder="🔍 Search tasks by title or description..."
              className="form-input"
              style={{ width: '100%' }}
              value={search}
              onChange={handleSearchChange}
            />
          </div>

          {/* Status filter selector */}
          <div style={{ minWidth: '150px' }}>
            <select
              className="form-input"
              style={{ width: '100%' }}
              value={statusFilter}
              onChange={(e) => handleFilterChange(e.target.value)}
            >
              <option value="">📁 All Statuses</option>
              <option value="PENDING">⏳ Pending</option>
              <option value="IN_PROGRESS">⚙️ In Progress</option>
              <option value="COMPLETED">✅ Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Action alerts displaying */}
      {message && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: '2rem' }}>
          <span>{message.type === 'success' ? '✅' : '⚠️'}</span>
          <span>{message.text}</span>
        </div>
      )}

      {/* Grid of Task Cards */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div className="spinner" style={{ width: '3rem', height: '3rem' }}></div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem', color: 'hsl(var(--text-secondary))' }}>
          <span style={{ fontSize: '3rem' }}>📭</span>
          <h3 style={{ marginTop: '1rem' }}>No tasks found</h3>
          <p style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>Try refining your search queries or create a task.</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={handleOpenEditModal}
                onDelete={handleDeleteTask}
                onStatusChange={handleQuickStatusChange}
              />
            ))}
          </div>

          {/* Pagination Toolbar */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '2rem' }}>
              <button
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="btn btn-secondary"
                style={{ padding: '0.5rem 1rem' }}
              >
                ◀ Previous
              </button>
              <span style={{ fontSize: '0.9rem', color: 'hsl(var(--text-secondary))' }}>
                Page <strong>{page}</strong> of <strong>{totalPages}</strong>
              </span>
              <button
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="btn btn-secondary"
                style={{ padding: '0.5rem 1rem' }}
              >
                Next ▶
              </button>
            </div>
          )}
        </>
      )}

      {/* Create / Edit Dialog Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTask ? '✏️ Edit Task Details' : '➕ Create New Task'}
      >
        <form onSubmit={handleSubmitTask}>
          <div className="form-group">
            <label className="form-label" htmlFor="task-title">Task Title</label>
            <input
              id="task-title"
              type="text"
              placeholder="e.g. Audit API Versioning"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="task-desc">Description</label>
            <textarea
              id="task-desc"
              placeholder="Provide a detailed summary of the task..."
              className="form-input"
              style={{ minHeight: '100px', resize: 'vertical' }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="task-status">Status</label>
            <select
              id="task-status"
              className="form-input"
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
            >
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          {/* User Assignee (Visible to all, but list populated only if Admin) */}
          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label" htmlFor="task-assignee">Assignee</label>
            {user?.role === 'ADMIN' ? (
              <select
                id="task-assignee"
                className="form-input"
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
              >
                <option value="">-- Unassigned --</option>
                {usersList.map(u => (
                  <option key={u.id} value={u.id}>{u.email}</option>
                ))}
              </select>
            ) : (
              // Non-admins can just leave it unassigned, or paste a UUID if they know it.
              // For a simple UX, they can select self or leave blank.
              <select
                id="task-assignee"
                className="form-input"
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
              >
                <option value="">-- Unassigned --</option>
                <option value={user?.id}>Assign to Myself ({user?.email})</option>
              </select>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              {editingTask ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
