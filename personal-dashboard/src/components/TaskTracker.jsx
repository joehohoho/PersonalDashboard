import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import CalendarPicker from './CalendarPicker';
import TaskNotes from './TaskNotes';
import '../styles/TaskTracker.css';

function TaskTracker() {
  const [tasks, setTasks] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isTableOpen, setIsTableOpen] = useState(true);
  const [statusFilter, setStatusFilter] = useState('active');
  const [editingTask, setEditingTask] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    due_date: '',
    status: 'active'
  });

  useEffect(() => {
    fetchTasks();
  }, [statusFilter]);

  const fetchTasks = async () => {
    try {
      let query = supabase
        .from('user_tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter === 'active') {
        query = query.eq('status', 'active');
      } else if (statusFilter === 'pending') {
        query = query.eq('status', 'pending');
      } else if (statusFilter === 'completed') {
        query = query.eq('status', 'completed');
      } else if (statusFilter === 'cancelled') {
        query = query.eq('status', 'cancelled');
      }
      // If statusFilter is 'all', no filter is applied

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching tasks:', error);
        setError(`Error loading tasks: ${error.message}. Please make sure the user_tasks table exists in your database.`);
      } else {
        setTasks(data || []);
        setError(null);
      }
    } catch (err) {
      console.error('Unexpected error fetching tasks:', err);
      setError(`Unexpected error: ${err.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const taskData = {
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        due_date: formData.due_date || null,
        status: formData.status
      };

      let result;
      let error;

      if (editingTask) {
        result = await supabase
          .from('user_tasks')
          .update(taskData)
          .eq('id', editingTask.id)
          .select();
        error = result.error;
      } else {
        result = await supabase
          .from('user_tasks')
          .insert([taskData])
          .select();
        error = result.error;
      }

      if (error) {
        console.error('Error saving task:', error);
        setError(`Error saving task: ${error.message}. ${error.hint || ''} Please check your database connection and ensure the user_tasks table exists.`);
        setLoading(false);
      } else {
        setFormData({
          name: '',
          description: '',
          due_date: '',
          status: 'active'
        });
        setEditingTask(null);
        setIsFormOpen(false);
        setError(null);
        await fetchTasks();
        setLoading(false);
      }
    } catch (err) {
      console.error('Unexpected error saving task:', err);
      setError(`Unexpected error: ${err.message}`);
      setLoading(false);
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setFormData({
      name: task.name,
      description: task.description || '',
      due_date: task.due_date || '',
      status: task.status
    });
    setIsFormOpen(true);
    // Scroll to form
    document.querySelector('.task-form-card')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  };

  const handleDelete = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      const { error } = await supabase
        .from('user_tasks')
        .delete()
        .eq('id', taskId);

      if (error) {
        console.error('Error deleting task:', error);
      } else {
        fetchTasks();
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    // Parse date string (YYYY-MM-DD) directly to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active':
        return 'status-badge active';
      case 'pending':
        return 'status-badge pending';
      case 'completed':
        return 'status-badge completed';
      case 'cancelled':
        return 'status-badge cancelled';
      default:
        return 'status-badge';
    }
  };

  const isOverdue = (dueDate, status) => {
    if (!dueDate || status === 'completed' || status === 'cancelled') return false;
    // Parse date string directly to avoid timezone issues
    const [year, month, day] = dueDate.split('-').map(Number);
    const due = new Date(year, month - 1, day);
    due.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return due < today;
  };

  return (
    <div className="task-tracker">
      <div className="task-tracker-content">
        {error && (
          <div className="error-message">
            <span>⚠️ {error}</span>
            <button onClick={() => setError(null)} className="error-close">×</button>
          </div>
        )}
        <div className="task-form-card">
          <div className="card-header" onClick={() => setIsFormOpen(!isFormOpen)}>
            <h3>{editingTask ? 'Edit Task' : 'New Task'}</h3>
            <button className="collapse-btn">
              {isFormOpen ? '▼' : '▶'}
            </button>
          </div>

          {isFormOpen && (
            <form onSubmit={handleSubmit} className="task-form">
              <div className="form-group">
                <label htmlFor="taskName">Task Name</label>
                <input
                  id="taskName"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Enter task name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                  placeholder="Enter task description (optional)"
                />
              </div>

              <div className="form-group">
                <label htmlFor="dueDate">Due Date</label>
                <CalendarPicker
                  value={formData.due_date}
                  onChange={(date) => setFormData({ ...formData, due_date: date })}
                  placeholder="Select due date (optional)"
                />
              </div>

              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  required
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="form-actions">
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? 'Saving...' : editingTask ? 'Update Task' : 'Save Task'}
                </button>
                {editingTask && (
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => {
                      setEditingTask(null);
                      setFormData({
                        name: '',
                        description: '',
                        due_date: '',
                        status: 'active'
                      });
                    }}
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          )}
        </div>

        <div className="task-table-card">
          <div className="card-header" onClick={() => setIsTableOpen(!isTableOpen)}>
            <h3>Task List</h3>
            <button className="collapse-btn">
              {isTableOpen ? '▼' : '▶'}
            </button>
          </div>

          {isTableOpen && (
            <>
              <div className="filter-section">
                <label htmlFor="statusFilter">Filter by Status:</label>
                <select
                  id="statusFilter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="all">All Tasks</option>
                </select>
              </div>

              <div className="table-container">
                <table className="task-table">
                  <thead>
                    <tr>
                      <th>Task Name</th>
                      <th>Description</th>
                      <th>Due Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="no-tasks">
                          No tasks found
                        </td>
                      </tr>
                    ) : (
                      tasks.map(task => (
                        <tr 
                          key={task.id}
                          className={isOverdue(task.due_date, task.status) ? 'overdue' : ''}
                        >
                          <td className="task-name">{task.name}</td>
                          <td className="task-description">
                            {task.description || '-'}
                          </td>
                          <td className={`task-due-date ${isOverdue(task.due_date, task.status) ? 'overdue-date' : ''}`}>
                            {formatDate(task.due_date)}
                            {isOverdue(task.due_date, task.status) && (
                              <span className="overdue-badge">Overdue</span>
                            )}
                          </td>
                          <td>
                            <span className={getStatusBadgeClass(task.status)}>
                              {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <TaskNotes taskId={task.id} taskName={task.name} />
                              <button
                                onClick={() => handleEdit(task)}
                                className="edit-btn"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(task.id)}
                                className="delete-btn"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default TaskTracker;

