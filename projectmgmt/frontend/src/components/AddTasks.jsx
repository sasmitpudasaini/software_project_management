import React from 'react';

export default function AddTasks({
  userCanManageTasks,
  taskToEdit,
  setTaskToEdit,
  setTaskTitle,
  setTaskDescription,
  handleTaskFormSubmit,
  taskTitle,
  taskDescription,
  taskLoading,
  currentUsername
}) {
  if (!userCanManageTasks) return null;

  return (
    <div id="add-task-section" style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #cbd5e1', paddingBottom: '8px', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b' }}>
          {taskToEdit ? '✏️ Edit Task Item' : '➕ Add New Task'}
        </h3>
        {taskToEdit && (
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setTaskToEdit(null);
              setTaskTitle('');
              setTaskDescription('');
            }}
            style={{ padding: '4px 10px', fontSize: '0.8rem', cursor: 'pointer' }}
          >
            Cancel Edit
          </button>
        )}
      </div>

      <form onSubmit={handleTaskFormSubmit}>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '13px', marginBottom: '4px', display: 'block', fontWeight: '600', color: '#475569' }}>Task Title</label>
          <input
            type="text"
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff', fontSize: '13px' }}
            placeholder="Enter task title..."
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            required
          />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', marginBottom: '4px', display: 'block', fontWeight: '600', color: '#475569' }}>Task Description</label>
          <textarea
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', minHeight: '80px', background: '#fff', fontSize: '13px' }}
            placeholder="Enter task description..."
            value={taskDescription}
            onChange={(e) => setTaskDescription(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-primary" disabled={taskLoading} style={{ padding: '8px 16px', fontSize: '13px', cursor: 'pointer' }}>
          {taskLoading ? 'Saving to Database...' : taskToEdit ? 'Update Task in Database' : `Add Task as ${currentUsername}`}
        </button>
      </form>
    </div>
  );
}