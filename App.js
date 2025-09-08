import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// API functions
const api = {
  getTasks: () => axios.get(`${API_BASE_URL}/tasks`),
  createTask: (text) => axios.post(`${API_BASE_URL}/tasks`, { text }),
  updateTask: (id, updates) => axios.put(`${API_BASE_URL}/tasks/${id}`, updates),
  toggleTask: (id) => axios.patch(`${API_BASE_URL}/tasks/${id}/toggle`),
  deleteTask: (id) => axios.delete(`${API_BASE_URL}/tasks/${id}`)
};

// Task Item Component
const TaskItem = ({ task, onToggle, onDelete, onEdit }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(task.text);

  const handleEdit = () => {
    setIsEditing(true);
    setEditText(task.text);
  };

  const handleSave = async () => {
    const trimmedText = editText.trim();
    if (trimmedText && trimmedText !== task.text) {
      await onEdit(task.id, trimmedText);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditText(task.text);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`task-item ${task.completed ? 'completed' : ''}`}>
      <input
        type="checkbox"
        className="task-checkbox"
        checked={task.completed}
        onChange={() => onToggle(task.id)}
      />

      <div className="task-content">
        {isEditing ? (
          <input
            type="text"
            className="task-edit-input"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={handleSave}
            onKeyPress={handleKeyPress}
            autoFocus
          />
        ) : (
          <span className="task-text" onClick={handleEdit}>
            {task.text}
          </span>
        )}

        <div className="task-meta">
          <span className="task-date">
            {formatDate(task.created_at)}
          </span>
        </div>
      </div>

      <div className="task-actions">
        {isEditing ? (
          <div className="edit-actions">
            <button onClick={handleSave} className="save-btn">
              ✓
            </button>
            <button onClick={handleCancel} className="cancel-btn">
              ✕
            </button>
          </div>
        ) : (
          <button onClick={() => onDelete(task.id)} className="delete-btn">
            🗑️
          </button>
        )}
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  const [tasks, setTasks] = useState([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load tasks on component mount
  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      const response = await api.getTasks();
      if (response.data.success) {
        setTasks(response.data.data);
      }
      setError(null);
    } catch (err) {
      console.error('Error loading tasks:', err);
      setError('Failed to load tasks. Please check if the server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    const trimmedText = newTaskText.trim();

    if (!trimmedText) return;

    try {
      const response = await api.createTask(trimmedText);
      if (response.data.success) {
        setTasks(prevTasks => [response.data.data, ...prevTasks]);
        setNewTaskText('');
      }
    } catch (err) {
      console.error('Error creating task:', err);
      setError('Failed to create task');
    }
  };

  const handleToggleTask = async (id) => {
    try {
      const response = await api.toggleTask(id);
      if (response.data.success) {
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task.id === id ? response.data.data : task
          )
        );
      }
    } catch (err) {
      console.error('Error toggling task:', err);
      setError('Failed to update task');
    }
  };

  const handleEditTask = async (id, newText) => {
    try {
      const response = await api.updateTask(id, { text: newText });
      if (response.data.success) {
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task.id === id ? response.data.data : task
          )
        );
      }
    } catch (err) {
      console.error('Error updating task:', err);
      setError('Failed to update task');
    }
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      const response = await api.deleteTask(id);
      if (response.data.success) {
        setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
      }
    } catch (err) {
      console.error('Error deleting task:', err);
      setError('Failed to delete task');
    }
  };

  const completedCount = tasks.filter(task => task.completed).length;
  const totalCount = tasks.length;

  if (isLoading) {
    return (
      <div className="app">
        <div className="loading">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>📝 To-Do List</h1>
        <div className="stats">
          <span className="stat-item">
            Total: <strong>{totalCount}</strong>
          </span>
          <span className="stat-item">
            Completed: <strong>{completedCount}</strong>
          </span>
          <span className="stat-item">
            Remaining: <strong>{totalCount - completedCount}</strong>
          </span>
        </div>
      </header>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <form className="add-task-form" onSubmit={handleAddTask}>
        <input
          type="text"
          className="new-task-input"
          placeholder="Add a new task..."
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
        />
        <button type="submit" className="add-task-btn">
          Add Task
        </button>
      </form>

      <div className="tasks-container">
        {tasks.length === 0 ? (
          <div className="empty-state">
            <p>No tasks yet. Add one above to get started!</p>
          </div>
        ) : (
          <div className="tasks-list">
            {tasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={handleToggleTask}
                onDelete={handleDeleteTask}
                onEdit={handleEditTask}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;