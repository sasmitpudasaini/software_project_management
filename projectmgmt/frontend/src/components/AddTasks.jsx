import React, { useState } from 'react';
import './usermanagement.css';
import './projects.css';

export default function AddTasks({ existingTasks = [], onSave, currentUser, users = [], projectName, onBack }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmitTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter a task title.');
      return;
    }

    // Retrieve active user straight from localStorage to guarantee correct username tagging
    let activeUser = null;
    try {
      const localCurrent = localStorage.getItem('currentUser');
      if (localCurrent) {
        const parsed = JSON.parse(localCurrent);
        activeUser = parsed.user || parsed.data || parsed;
      }
      if (!activeUser) {
        const localUser = localStorage.getItem('user');
        if (localUser) {
          const parsed = JSON.parse(localUser);
          activeUser = parsed.user || parsed.data || parsed;
        }
      }
    } catch (err) {
      console.error('Error reading localStorage in AddTasks:', err);
    }

    const finalUser = activeUser || currentUser;
    const creatorUsername = finalUser?.username || finalUser?.email || 'User';

    const newTask = {
      id: Date.now().toString(),
      title: title.trim(),
      description: description.trim(),
      task_created_by: creatorUsername,
      created_at: new Date().toISOString()
    };

    // Combine with existing tasks and immediately save to the database
    const updatedTasks = [...(existingTasks || []), newTask];

    setLoading(true);
    try {
      await onSave(updatedTasks);
      setTitle('');
      setDescription('');
    } catch (err) {
      console.error('Error saving task to database:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-body" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, color: '#1e293b' }}>Add Tasks for: {projectName}</h3>
        <button className="btn-secondary" onClick={onBack} style={{ padding: '6px 12px' }}>Cancel</button>
      </div>

      <form onSubmit={handleSubmitTask} style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: '#334155' }}>Add New Task Item</h4>
        <div className="auth-field" style={{ marginBottom: '12px' }}>
          <label className="auth-label" style={{ fontSize: '0.85rem', marginBottom: '4px', display: 'block' }}>Task Title</label>
          <input
            type="text"
            className="form-input"
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
            placeholder="Enter task title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="auth-field" style={{ marginBottom: '12px' }}>
          <label className="auth-label" style={{ fontSize: '0.85rem', marginBottom: '4px', display: 'block' }}>Task Description</label>
          <textarea
            className="form-input"
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', minHeight: '80px' }}
            placeholder="Enter task description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '8px 16px' }}>
          {loading ? 'Saving to Database...' : 'Add & Save to Database'}
        </button>
      </form>

      <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '15px' }}>
        <button type="button" className="btn-secondary" onClick={onBack}>Close</button>
      </div>
    </div>
  );
}