import React, { useState } from 'react';
import './dashboard.css';

export default function AddTasks({ initialTasks = [], onSave, onBack }) {
  // Initialize with Task 1 by default if no initial tasks are provided
  const [tasks, setTasks] = useState(
    initialTasks.length > 0
      ? initialTasks
      : [
          {
            id: Date.now(),
            name: 'Task 1',
            title: '',
            description: '',
            createdAt: new Date().toISOString().split('T')[0]
          }
        ]
  );

  const handleInputChange = (index, field, value) => {
    const updatedTasks = [...tasks];
    updatedTasks[index][field] = value;
    setTasks(updatedTasks);
  };

  const handleAddNewTask = () => {
    const nextTaskNumber = tasks.length + 1;
    const newTask = {
      id: Date.now() + Math.random(),
      name: `Task ${nextTaskNumber}`,
      title: '',
      description: '',
      createdAt: new Date().toISOString().split('T')[0]
    };
    setTasks([...tasks, newTask]);
  };

  const handleDeleteTask = (index) => {
    const updatedTasks = tasks.filter((_, i) => i !== index);
    // Re-sequence task names so they remain sequential (Task 1, Task 2, Task 3...)
    const resequenced = updatedTasks.map((t, i) => ({
      ...t,
      name: `Task ${i + 1}`
    }));
    setTasks(resequenced);
  };

  const handleSaveAll = (e) => {
    e.preventDefault();
    if (onSave) {
      onSave(tasks);
    }
  };

  return (
    <div className="dash-panel" style={{ padding: '24px' }}>
      {/* Header section with the New Task button on the top right */}
      <div 
        className="projects-header" 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '20px' 
        }}
      >
        <div className="projects-header-info">
          <h3 className="projects-title">Task Management</h3>
          <p className="projects-description">
            Create and manage multiple tasks. Each new task automatically increments its sequential name.
          </p>
        </div>
        <div>
          <button 
            type="button" 
            onClick={handleAddNewTask}
            style={{ 
              backgroundColor: '#235778', 
              color: '#fff', 
              padding: '10px 18px', 
              borderRadius: '6px', 
              border: 'none', 
              cursor: 'pointer', 
              fontWeight: '600',
              fontSize: '14px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            + New Task
          </button>
        </div>
      </div>

      <form onSubmit={handleSaveAll}>
        {/* Scrollable container for multiple tasks */}
        <div 
          style={{ 
            maxHeight: '480px', 
            overflowY: 'auto', 
            paddingRight: '6px', 
            marginBottom: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          {tasks.map((task, index) => (
            <div 
              key={task.id || index} 
              style={{ 
                border: '1px solid #e0e0e0', 
                borderRadius: '8px', 
                padding: '18px', 
                backgroundColor: '#ffffff',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#235778' }}>
                  {task.name}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '12px', color: '#666' }}>
                    Created: {task.createdAt}
                  </span>
                  {tasks.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => handleDeleteTask(index)}
                      style={{ 
                        background: 'transparent', 
                        border: 'none', 
                        color: '#e74c3c', 
                        cursor: 'pointer', 
                        fontWeight: 'bold',
                        fontSize: '16px'
                      }}
                      title="Delete Task"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px', color: '#333' }}>
                  Task Header / Title
                </label>
                <input 
                  type="text" 
                  value={task.title} 
                  onChange={(e) => handleInputChange(index, 'title', e.target.value)} 
                  placeholder="Enter task header..." 
                  required
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px', color: '#333' }}>
                  Description
                </label>
                <textarea 
                  value={task.description} 
                  onChange={(e) => handleInputChange(index, 'description', e.target.value)} 
                  placeholder="Enter task description..." 
                  rows="3"
                  required
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px', resize: 'vertical' }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Form Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          {onBack && (
            <button 
              type="button" 
              onClick={onBack}
              style={{ padding: '10px 20px', borderRadius: '6px', border: '1px solid #ccc', background: '#fff', cursor: 'pointer', fontWeight: '600' }}
            >
              Cancel
            </button>
          )}
          <button 
            type="submit" 
            style={{ padding: '10px 20px', borderRadius: '6px', border: 'none', background: '#235778', color: '#fff', cursor: 'pointer', fontWeight: '600' }}
          >
            Save All Tasks
          </button>
        </div>
      </form>
    </div>
  );
}