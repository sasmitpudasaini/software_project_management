import React from 'react';
import './usermanagement.css';
import './projects.css';

export default function UsersTask({ isOpen, onClose, project, users = [] }) {
  if (!isOpen || !project) return null;

  const projectName = project.name || project.projectName || project.title || project.project_name || 'Project';
  
  // Retrieve user_tasks data from the project object
  const userTasksData = project.user_tasks || project.userTasks || {};
  
  // Normalize tasks into a dictionary structure: { username: [ { description, task_created_at, title, ... } ] }
  let normalizedTasks = {};
  if (Array.isArray(userTasksData)) {
    userTasksData.forEach(task => {
      const uname = task.username || task.user || task.assigned_user || 'General';
      if (!normalizedTasks[uname]) normalizedTasks[uname] = [];
      normalizedTasks[uname].push(task);
    });
  } else if (userTasksData && typeof userTasksData === 'object') {
    normalizedTasks = userTasksData;
  }

  const getUserDisplayInfo = (identifier) => {
    const sysUser = users.find(u => u.username === identifier || u.email === identifier || u.id?.toString() === identifier?.toString() || u.name === identifier);
    const roleKey = sysUser?.role || sysUser?.userRole || sysUser?.designation || '';
    let formattedRole = roleKey === 'frontend' ? 'Frontend Developer' : roleKey === 'backend' ? 'Backend Developer' : roleKey === 'fullstack' ? 'Full Stack Developer' : roleKey ? roleKey.charAt(0).toUpperCase() + roleKey.slice(1) : '';
    const name = sysUser ? (sysUser.first_name || sysUser.last_name ? `${sysUser.first_name} ${sysUser.last_name}`.trim() : sysUser.username || sysUser.email || sysUser.name || identifier) : identifier;
    return { name, role: formattedRole };
  };

  const userKeys = Object.keys(normalizedTasks);

  return (
    <div className="modal-backdrop">
      <div className="modal-card" style={{ maxWidth: '700px', width: '90%', maxHeight: '85vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">User's Tasks: {projectName}</h3>
            <p className="modal-subtitle" style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
              Pre-coding task descriptions and created dates for assigned users.
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ padding: '20px' }}>
          {userKeys.length > 0 ? (
            userKeys.map((uname) => {
              const userInfo = getUserDisplayInfo(uname);
              const tasksList = Array.isArray(normalizedTasks[uname]) ? normalizedTasks[uname] : [normalizedTasks[uname]];

              return (
                <div key={uname} style={{ marginBottom: '24px', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', background: '#f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                    <h4 style={{ margin: 0, fontSize: '16px', color: '#1e293b' }}>
                      {userInfo.name} {userInfo.role && <span style={{ fontSize: '13px', fontWeight: 'normal', color: '#64748b' }}>({userInfo.role})</span>}
                    </h4>
                    <span style={{ fontSize: '12px', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '4px', fontWeight: '500' }}>
                      {tasksList.length} {tasksList.length === 1 ? 'Task' : 'Tasks'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {tasksList.map((task, tIndex) => {
                      const desc = task.description || task.desc || task.task_description || task.content || JSON.stringify(task);
                      const createdAt = task.task_created_at || task.taskCreatedAt || task.created_at || task.createdAt || 'N/A';
                      const taskTitle = task.title || task.name || `Task #${tIndex + 1}`;

                      return (
                        <div key={tIndex} style={{ background: '#ffffff', padding: '12px 14px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <strong style={{ fontSize: '14px', color: '#0f172a' }}>{taskTitle}</strong>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>
                              Task Created At: {createdAt}
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
              <p>No user tasks recorded for this project yet.</p>
            </div>
          )}
        </div>
        <div className="modal-footer" style={{ padding: '12px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}