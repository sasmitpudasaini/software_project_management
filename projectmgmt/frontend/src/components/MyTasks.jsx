import React, { useState, useEffect } from 'react';
import './usermanagement.css';
import './projects.css';
import DeleteProject from './DeleteProject';

function getDynamicStatus(startDate, endDate) {
  if (!endDate) return 'Ongoing';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  if (isNaN(end.getTime())) return 'Ongoing';
  end.setHours(0, 0, 0, 0);
  return end < today ? 'Completed' : 'Ongoing';
}

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

export default function MyTasks({ currentUser: propCurrentUser }) {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  
  const [selectedProjectForTasks, setSelectedProjectForTasks] = useState(null);
  const [selectedUserFilter, setSelectedUserFilter] = useState('All');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [submittingTask, setSubmittingTask] = useState(false);

  // Delete modal state
  const [projectToDelete, setProjectToDelete] = useState(null);

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const localCurrent = localStorage.getItem('currentUser');
      if (localCurrent) {
        const parsed = JSON.parse(localCurrent);
        return parsed.user || parsed.data || parsed;
      }
      const localUser = localStorage.getItem('user');
      if (localUser) {
        const parsed = JSON.parse(localUser);
        return parsed.user || parsed.data || parsed;
      }
    } catch (e) {
      console.error('Error reading localStorage initial state:', e);
    }
    return propCurrentUser || {};
  });

  // Strict Superuser Check from Database
  const isSuperuser = Boolean(currentUser?.is_superuser);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    let result = (projects || []).map(p => {
      const startDate = p.startDate || p.start_date || '';
      const endDate = p.endDate || p.end_date || '';
      return { ...p, calculatedStatus: getDynamicStatus(startDate, endDate) };
    });

    if (statusFilter !== 'All') {
      result = result.filter(p => p.calculatedStatus === statusFilter);
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => {
        const name = p.name || p.projectName || p.title || p.project_name || '';
        const desc = p.description || p.desc || '';
        return name.toLowerCase().includes(q) || desc.toLowerCase().includes(q);
      });
    }
    setFilteredProjects(result);
  }, [projects, searchQuery, statusFilter]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const headers = { 'Content-Type': 'application/json' };
      
      let activeUsr = null;
      try {
        const localCurrent = localStorage.getItem('currentUser');
        if (localCurrent) {
          const parsed = JSON.parse(localCurrent);
          activeUsr = parsed.user || parsed.data || parsed;
        }
        if (!activeUsr) {
          const localUser = localStorage.getItem('user');
          if (localUser) {
            const parsed = JSON.parse(localUser);
            activeUsr = parsed.user || parsed.data || parsed;
          }
        }
      } catch (e) {
        console.error('Error reading localStorage:', e);
      }

      if (!activeUsr || Object.keys(activeUsr).length === 0) {
        activeUsr = propCurrentUser;
      }

      if (activeUsr && Object.keys(activeUsr).length > 0) {
        setCurrentUser(activeUsr);
      }

      const usersRes = await fetch('http://localhost:8000/api/users/', { credentials: 'include', headers });
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(Array.isArray(data) ? data : (data.results || data.data || []));
      }

      const projRes = await fetch('http://localhost:8000/api/projects/', { credentials: 'include', headers });
      if (projRes.ok) {
        const data = await projRes.json();
        const projArray = Array.isArray(data) ? data : (data.results || data.data || []);
        projArray.sort((a, b) => new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0));
        setProjects(projArray);

        if (selectedProjectForTasks) {
          const currentId = selectedProjectForTasks.id || selectedProjectForTasks._id;
          const updatedCurrent = projArray.find(p => (p.id || p._id) === currentId);
          if (updatedCurrent) {
            setSelectedProjectForTasks(updatedCurrent);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const activeUsername = currentUser?.username || currentUser?.email || 'User';

  const getAssignedUsersArray = (proj) => {
    if (!proj) return [];
    const raw = proj.assigned_users || proj.assignedUsers || proj.users || proj.members || proj.team;
    if (Array.isArray(raw)) {
      return raw.map(u => (typeof u === 'object' && u !== null ? [u.username, u.email, u.id?.toString()] : [u?.toString()])).flat().filter(Boolean);
    }
    if (typeof raw === 'string' && raw.trim() !== '') return raw.split(',').map(s => s.trim()).filter(Boolean);
    return [];
  };

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

  const handleSaveTasks = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim()) {
      alert('Please enter a task title.');
      return;
    }

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
      console.error('Error reading localStorage:', err);
    }

    const finalUser = activeUser || currentUser;
    const creatorUsername = finalUser?.username || finalUser?.email || 'User';

    const newTask = {
      id: Date.now().toString(),
      title: taskTitle.trim(),
      description: taskDescription.trim(),
      task_created_by: creatorUsername,
      created_at: new Date().toISOString()
    };

    const existingTasks = selectedProjectForTasks.user_tasks || selectedProjectForTasks.userTasks || [];
    const updatedTasks = [...existingTasks, newTask];

    setSubmittingTask(true);
    try {
      const projectId = selectedProjectForTasks.id || selectedProjectForTasks._id;
      const csrftoken = getCookie('csrftoken');
      const headers = {
        'Content-Type': 'application/json',
        ...(csrftoken ? { 'X-CSRFToken': csrftoken } : {})
      };
      
      const res = await fetch(`http://localhost:8000/api/projects/${projectId}/`, {
        method: 'PATCH',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          user_tasks: updatedTasks
        })
      });

      if (res.ok) {
        const savedProj = await res.json();
        setSelectedProjectForTasks(savedProj);
      } else {
        const updatedProj = {
          ...selectedProjectForTasks,
          user_tasks: updatedTasks,
          userTasks: updatedTasks
        };
        setSelectedProjectForTasks(updatedProj);
      }

      setTaskTitle('');
      setTaskDescription('');
      setIsAddingTask(false);
      await fetchInitialData();
    } catch (err) {
      console.error('Error saving task to database:', err);
    } finally {
      setSubmittingTask(false);
    }
  };

  if (selectedProjectForTasks) {
    const project = selectedProjectForTasks;
    const projectName = project.name || project.projectName || project.title || project.project_name || 'Project';
    const userTasksData = project.user_tasks || project.userTasks || [];
    
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
      <div className="dash-panel">
        <div className="projects-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 className="projects-title">
              {isAddingTask ? `Add Tasks for: ${projectName}` : `All Users' Tasks: ${projectName}`}
            </h3>
            <p className="projects-description">
              {isAddingTask ? 'Create and save a new task item.' : 'Viewing all tasks created by all users for this project.'}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                  padding: '8px 14px',
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
            <button 
              className="btn-secondary" 
              onClick={() => {
                setSelectedProjectForTasks(null);
                setSelectedUserFilter('All');
                setIsAddingTask(false);
                fetchInitialData();
              }}
              style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: '600' }}
            >
              ← Back to Projects
            </button>
          </div>
        </div>

        {isAddingTask ? (
          <form onSubmit={handleSaveTasks} style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: '#1e293b' }}>Add New Task Item</h4>
            <div className="auth-field" style={{ marginBottom: '16px' }}>
              <label className="auth-label" style={{ fontSize: '0.85rem', marginBottom: '6px', display: 'block', fontWeight: '600' }}>Task Title</label>
              <input
                type="text"
                className="form-input"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                placeholder="Enter task title..."
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                required
              />
            </div>
            <div className="auth-field" style={{ marginBottom: '16px' }}>
              <label className="auth-label" style={{ fontSize: '0.85rem', marginBottom: '6px', display: 'block', fontWeight: '600' }}>Task Description</label>
              <textarea
                className="form-input"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', minHeight: '100px' }}
                placeholder="Enter task description..."
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn-primary" disabled={submittingTask} style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
                {submittingTask ? 'Saving to Database...' : 'Add & Save to Database'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setIsAddingTask(false)} style={{ padding: '8px 16px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <div style={{ paddingBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #edf2f7', marginBottom: '20px' }}>
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

            <div className="dash-panel-body">
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
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <p>No tasks found for this project yet.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="dash-panel">
      <div className="projects-header">
        <div className="projects-header-info">
          <h3 className="projects-title">My Tasks</h3>
          <p className="projects-description">
            Manage your project tasks across all projects. Logged in as: <strong>{activeUsername}</strong>
          </p>
        </div>
        <div className="projects-controls">
          <input
            type="text"
            className="form-input project-search-input-wide"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select
            className="form-select project-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Ongoing">Ongoing</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>PROJECT NAME</th>
              <th>STATUS</th>
              <th>ASSIGNED USERS & ROLES</th>
              <th>START DATE</th>
              <th>END DATE</th>
              <th className="table-actions">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="table-loading-cell">Loading projects from database...</td>
              </tr>
            ) : filteredProjects.length > 0 ? (
              filteredProjects.map((p, index) => {
                const projectName = p.name || p.projectName || p.title || p.project_name || 'Untitled Project';
                const startDate = p.startDate || p.start_date || 'N/A';
                const endDate = p.endDate || p.end_date || 'N/A';
                const assignedList = getAssignedUsersArray(p);
                const displayStatus = p.calculatedStatus || getDynamicStatus(startDate, endDate);

                return (
                  <tr key={p.id || p._id || index}>
                    <td><strong>{projectName}</strong></td>
                    <td>
                      <span className={`badge ${displayStatus === 'Completed' ? 'badge-success' : 'badge-warning'}`}>{displayStatus}</span>
                    </td>
                    <td className="assigned-users-cell">
                      {assignedList.length > 0 ? (
                        <div className="assigned-users-list">
                          {assignedList.map(uname => {
                            const userInfo = getUserDisplayInfo(uname);
                            return (
                              <span key={uname} className="user-chip">
                                <strong>{userInfo.name}</strong> {userInfo.role ? `(${userInfo.role})` : ''}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="no-users-text">No users assigned</span>
                      )}
                    </td>
                    <td className="date-cell">{startDate}</td>
                    <td className="date-cell">{endDate}</td>
                    <td className="table-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        className="btn-action"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: '#2563eb',
                          color: '#fff',
                          padding: '8px 14px',
                          borderRadius: '6px',
                          fontWeight: '600',
                          fontSize: '0.85rem',
                          border: 'none',
                          cursor: 'pointer',
                          boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
                        }}
                        onClick={() => setSelectedProjectForTasks(p)}
                      >
                        <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>+</span> Project Tasks
                      </button>
                      {isSuperuser && (
                        <button
                          className="btn-danger"
                          style={{
                            background: '#dc2626',
                            color: '#fff',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            fontWeight: '600',
                            fontSize: '0.85rem',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                          onClick={() => setProjectToDelete(p)}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="table-loading-cell">No projects found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Project Modal */}
      {isSuperuser && (
        <DeleteProject
          isOpen={Boolean(projectToDelete)}
          onClose={() => setProjectToDelete(null)}
          onSuccess={fetchInitialData}
          project={projectToDelete}
        />
      )}
    </div>
  );
}