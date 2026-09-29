import React, { useState, useEffect } from 'react';
import './usermanagement.css';
import './projects.css';
import AddTasks from './AddTasks';

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
      let fetchedUsers = [];
      if (usersRes.ok) {
        const data = await usersRes.json();
        fetchedUsers = Array.isArray(data) ? data : (data.results || data.data || []);
        setUsers(fetchedUsers);
      }

      const projRes = await fetch('http://localhost:8000/api/projects/', { credentials: 'include', headers });
      if (projRes.ok) {
        const data = await projRes.json();
        const projArray = Array.isArray(data) ? data : (data.results || data.data || []);
        projArray.sort((a, b) => new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0));
        setProjects(projArray);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Display username from localStorage
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
    const sysUser = users.find(u => u.username === identifier || u.email === identifier || u.id?.toString() === identifier?.toString() || u.name === identifier || (u.first_name && `${u.first_name} ${u.last_name}`.trim() === identifier));
    const roleKey = sysUser?.role || sysUser?.userRole || sysUser?.designation || '';
    let formattedRole = roleKey === 'frontend' ? 'Frontend Developer' : roleKey === 'backend' ? 'Backend Developer' : roleKey === 'fullstack' ? 'Full Stack Developer' : roleKey ? roleKey.charAt(0).toUpperCase() + roleKey.slice(1) : '';
    const name = sysUser ? (sysUser.username || sysUser.email || sysUser.name || identifier) : identifier;
    return { name, role: formattedRole, email: sysUser?.email || identifier };
  };

  const [selectedProjectForAddTask, setSelectedProjectForAddTask] = useState(null);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);

  const [selectedProjectForViewTasks, setSelectedProjectForViewTasks] = useState(null);
  const [isViewTasksModalOpen, setIsViewTasksModalOpen] = useState(false);
  const [taskUserFilter, setTaskUserFilter] = useState('All');

  const handleOpenAddTask = (p) => {
    setSelectedProjectForAddTask(p);
    setIsAddTaskModalOpen(true);
  };

  const handleOpenViewTasks = (p) => {
    setSelectedProjectForViewTasks(p);
    setTaskUserFilter('All');
    setIsViewTasksModalOpen(true);
  };

  const handleSaveTasks = async (updatedTasksList) => {
    if (!selectedProjectForAddTask) return;
    try {
      const csrftoken = getCookie('csrftoken');
      const headers = { 
        'Content-Type': 'application/json',
        ...(csrftoken ? { 'X-CSRFToken': csrftoken } : {})
      };
      
      const projId = selectedProjectForAddTask.id || selectedProjectForAddTask._id || selectedProjectForAddTask.pk;
      
      const res = await fetch(`http://localhost:8000/api/projects/${projId}/`, {
        method: 'PATCH',
        credentials: 'include',
        headers,
        body: JSON.stringify({ user_tasks: updatedTasksList })
      });

      if (res.ok) {
        setIsAddTaskModalOpen(false);
        setSelectedProjectForAddTask(null);
        fetchInitialData();
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert('Failed to save tasks to database: ' + JSON.stringify(errorData));
      }
    } catch (err) {
      console.error('Error saving tasks:', err);
      alert('Network error while saving tasks.');
    }
  };

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
                    <td className="table-actions">
                      <button className="btn-action" onClick={() => handleOpenViewTasks(p)}>View Task</button>
                      <button className="btn-action" onClick={() => handleOpenAddTask(p)}>Add Task</button>
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

      {/* Add Task Modal */}
      {isAddTaskModalOpen && selectedProjectForAddTask && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal-content" style={{ background: '#fff', borderRadius: '8px', width: '650px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
            <AddTasks
              existingTasks={Array.isArray(selectedProjectForAddTask?.user_tasks) ? selectedProjectForAddTask.user_tasks : (Array.isArray(selectedProjectForAddTask?.tasks) ? selectedProjectForAddTask.tasks : [])}
              onSave={handleSaveTasks}
              currentUser={currentUser}
              users={users}
              projectName={selectedProjectForAddTask?.name || selectedProjectForAddTask?.projectName || selectedProjectForAddTask?.title || 'Project'}
              onBack={() => {
                setIsAddTaskModalOpen(false);
                setSelectedProjectForAddTask(null);
              }}
            />
          </div>
        </div>
      )}

      {/* View Tasks Modal with User Filter */}
      {isViewTasksModalOpen && selectedProjectForViewTasks && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal-content" style={{ background: '#fff', borderRadius: '8px', width: '700px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', color: '#1e293b' }}>
                  Tasks for: {selectedProjectForViewTasks.name || selectedProjectForViewTasks.projectName || selectedProjectForViewTasks.title || 'Project'}
                </h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>View tasks created by team members across the system.</p>
              </div>
              <button className="modal-close-btn" onClick={() => setIsViewTasksModalOpen(false)}>✕</button>
            </div>

            {/* Filter by User Name */}
            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>Filter by Creator:</label>
              <select
                className="form-select"
                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', flex: 1 }}
                value={taskUserFilter}
                onChange={(e) => setTaskUserFilter(e.target.value)}
              >
                <option value="All">All Users</option>
                {users.map(u => {
                  const uName = u.username || u.email;
                  return (
                    <option key={u.id || u.username} value={uName}>{uName} ({u.email || u.username})</option>
                  );
                })}
              </select>
            </div>

            {/* Tasks List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px', overflowY: 'auto', marginBottom: '20px' }}>
              {(() => {
                const allTasks = Array.isArray(selectedProjectForViewTasks?.user_tasks) 
                  ? selectedProjectForViewTasks.user_tasks 
                  : (Array.isArray(selectedProjectForViewTasks?.tasks) ? selectedProjectForViewTasks.tasks : []);

                const filteredTasks = allTasks.filter(t => {
                  if (taskUserFilter === 'All') return true;
                  return t.task_created_by === taskUserFilter;
                });

                if (filteredTasks.length > 0) {
                  return filteredTasks.map((t, idx) => (
                    <div key={t.id || idx} style={{ background: '#fff', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                        <strong style={{ fontSize: '1rem', color: '#1e293b' }}>{t.title}</strong>
                        <span style={{ fontSize: '0.75rem', background: '#eff6ff', color: '#1d4ed8', padding: '2px 8px', borderRadius: '4px', fontWeight: '500' }}>
                          By: {t.task_created_by || 'Unknown User'}
                        </span>
                      </div>
                      <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#475569' }}>{t.description || 'No description provided.'}</p>
                      {t.created_at && (
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          Created at: {new Date(t.created_at).toLocaleString()}
                        </div>
                      )}
                    </div>
                  ));
                } else {
                  return (
                    <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', fontStyle: 'italic', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      No tasks found matching the selected creator filter.
                    </div>
                  )
                }
              })()}
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '15px' }}>
              <button type="button" className="btn-secondary" onClick={() => setIsViewTasksModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}