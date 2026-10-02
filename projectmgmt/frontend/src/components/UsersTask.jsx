import React, { useState } from 'react';
import './usermanagement.css';
import './projects.css';
import AddTasks from './AddTasks';

export default function UsersTask({ isOpen, onClose, project, users = [], onProjectUpdate }) {
  const [selectedUserFilter, setSelectedUserFilter] = useState('All');
  const [isAddingTask, setIsAddingTask] = useState(false);

  if (!isOpen || !project) return null;

  const projectName = project.name || project.projectName || project.title || project.project_name || 'Project';
  const userTasksData = project.user_tasks || project.userTasks || [];
  
  const getUserDisplayInfo = (identifier) => {
    if (!identifier || identifier === 'Unassigned') return { name: 'Unassigned User', role: '', username: 'Unassigned' };
    const sysUser = users.find(u => 
      u.username === identifier || 
      u.email === identifier || 
      u.id?.toString() === identifier?.toString() || 
      u.name === identifier ||
      (u.first_name && `${u.first_name} ${u.last_name}`.trim() === identifier)
    );
    const roleKey = sysUser?.role || sysUser?.userRole || sysUser?.designation || '';
    let formattedRole = roleKey === 'frontend' ? 'Frontend Developer' : roleKey === 'backend' ? 'Backend Developer' : roleKey === 'fullstack' ? 'Full Stack Developer' : roleKey ? roleKey.charAt(0).toUpperCase() + roleKey.slice(1) : '';
    const name = sysUser ? (sysUser.first_name || sysUser.last_name ? `${sysUser.first_name} ${sysUser.last_name}`.trim() : sysUser.username || sysUser.email || sysUser.name || identifier) : identifier;
    return { name, role: formattedRole, username: sysUser?.username || identifier };
  };

  const handleSaveTasks = async (updatedTasks) => {
    const updatedProject = {
      ...project,
      user_tasks: updatedTasks,
      userTasks: updatedTasks
    };
    if (onProjectUpdate) {
      await onProjectUpdate(updatedProject);
    }
    setIsAddingTask(false);
  };

  let normalizedTasks = {};
  if (Array.isArray(userTasksData)) {
    userTasksData.forEach((task) => {
      if (!task) return;
      const creatorKey = task.task_created_by || task.username || task.user || task.assigned_user || 'Unassigned';
      if (!normalizedTasks[creatorKey]) normalizedTasks[creatorKey] = [];
      normalizedTasks[creatorKey].push({
        ...task,
        displayName: task.name || `Task ${normalizedTasks[creatorKey].length + 1}`
      });
    });
  }

  const userKeys = Object.keys(normalizedTasks);
  const filteredUserKeys = selectedUserFilter === 'All' 
    ? userKeys 
    : userKeys.filter(uname => uname === selectedUserFilter);

  return (
    <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="modal-card" style={{ background: '#fff', borderRadius: '8px', maxWidth: '800px', width: '90%', maxHeight: '85vh', overflowY: 'auto', padding: '24px' }}>
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h3 className="modal-title" style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b' }}>
              {isAddingTask ? `Add Tasks for: ${projectName}` : `All Users' Tasks: ${projectName}`}
            </h3>
            <p className="modal-subtitle" style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
              {isAddingTask ? 'Create and save a new task item.' : 'Viewing all tasks created by all users for this project.'}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {!isAddingTask && (
              <button 
                className="btn-primary" 
                onClick={() => setIsAddingTask(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: '#2563eb',
                  color: '#fff',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontWeight: '600',
                  fontSize: '0.85rem',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <span style={{ fontSize: '1rem', lineHeight: 1 }}>+</span> Add Task
              </button>
            )}
            <button className="modal-close-btn" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
          </div>
        </div>

        {isAddingTask ? (
          <AddTasks 
            existingTasks={userTasksData}
            onSave={handleSaveTasks}
            users={users}
            projectName={projectName}
            onBack={() => setIsAddingTask(false)}
          />
        ) : (
          <>
            <div style={{ paddingBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #edf2f7', marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#333' }}>Filter by Creator:</label>
              <select 
                value={selectedUserFilter} 
                onChange={(e) => setSelectedUserFilter(e.target.value)}
                style={{ padding: '7px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff' }}
              >
                <option value="All">All Users ({userKeys.length} Creators)</option>
                {userKeys.map(uname => {
                  const info = getUserDisplayInfo(uname);
                  return (
                    <option key={uname} value={uname}>{info.name} ({uname})</option>
                  );
                })}
              </select>
            </div>

            <div className="modal-body">
              {filteredUserKeys.length > 0 ? (
                filteredUserKeys.map((uname) => {
                  const userInfo = getUserDisplayInfo(uname);
                  const tasksList = Array.isArray(normalizedTasks[uname]) ? normalizedTasks[uname] : [];

                  return (
                    <div key={uname} style={{ marginBottom: '24px', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', background: '#f8fafc' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                        <h4 style={{ margin: 0, fontSize: '16px', color: '#1e293b' }}>
                          {userInfo.name} <span style={{ fontSize: '13px', fontWeight: 'normal', color: '#64748b' }}>({uname}) {userInfo.role ? `- ${userInfo.role}` : ''}</span>
                        </h4>
                        <span style={{ fontSize: '12px', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '4px', fontWeight: '500' }}>
                          {tasksList.length} {tasksList.length === 1 ? 'Task' : 'Tasks'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {tasksList.map((task, tIndex) => {
                          const desc = task.description || task.desc || task.task_description || task.content || '';
                          const taskTitle = task.title || task.name || `Task #${tIndex + 1}`;
                          const taskNumberLabel = task.name || `Task ${tIndex + 1}`;

                          return (
                            <div key={tIndex} style={{ background: '#ffffff', padding: '14px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <strong style={{ fontSize: '14px', color: '#0f172a' }}>
                                  {taskNumberLabel}: {taskTitle}
                                </strong>
                                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                                  Created By: {uname}
                                </span>
                              </div>
                              <p style={{ margin: 0, fontSize: '13px', color: '#334155', whiteSpace: 'pre-wrap' }}>
                                {typeof desc === 'object' ? JSON.stringify(desc, null, 2) : desc}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  <p>No tasks found for this project yet.</p>
                </div>
              )}
            </div>
            
            <div className="modal-footer" style={{ marginTop: '20px', paddingTop: '12px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="btn-secondary" onClick={onClose} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #ccc', background: '#fff', cursor: 'pointer', fontWeight: '600' }}>Close</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}