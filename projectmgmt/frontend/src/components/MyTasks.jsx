import React, { useState, useEffect } from 'react';
import Actions from './Actions';
import './usermanagement.css';
import './projects.css';

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
  const [initialShowOnlyMyTasks, setInitialShowOnlyMyTasks] = useState(false);

  const [currentUser, setCurrentUser] = useState(() => {
    if (propCurrentUser && Object.keys(propCurrentUser).length > 0) {
      return propCurrentUser;
    }
    try {
      const localCurrent = localStorage.getItem('currentUser');
      if (localCurrent) {
        const parsed = JSON.parse(localCurrent);
        const userObj = parsed.user || parsed.data || parsed;
        if (userObj && (userObj.username || userObj.email || userObj.name)) {
          return userObj;
        }
      }
      const localUser = localStorage.getItem('user');
      if (localUser) {
        const parsed = JSON.parse(localUser);
        const userObj = parsed.user || parsed.data || parsed;
        if (userObj && (userObj.username || userObj.email || userObj.name)) {
          return userObj;
        }
      }
    } catch (e) {
      console.error('Error reading localStorage initial state:', e);
    }
    return {};
  });

  useEffect(() => {
    if (propCurrentUser && Object.keys(propCurrentUser).length > 0) {
      setCurrentUser(propCurrentUser);
    }
  }, [propCurrentUser]);

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
      
      let activeUsr = (propCurrentUser && Object.keys(propCurrentUser).length > 0) ? propCurrentUser : null;
      try {
        if (!activeUsr || !activeUsr.username) {
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
        }
      } catch (e) {
        console.error('Error reading localStorage:', e);
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

  const effectiveUser = (propCurrentUser && Object.keys(propCurrentUser).length > 0) ? propCurrentUser : currentUser;
  const activeUsername = effectiveUser?.username || effectiveUser?.email || effectiveUser?.name || 'User';

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

  if (selectedProjectForTasks) {
    return (
      <Actions 
        project={selectedProjectForTasks} 
        users={users} 
        currentUser={effectiveUser} 
        initialShowOnlyMyTasks={initialShowOnlyMyTasks}
        onProjectUpdated={fetchInitialData}
        onBackToProjects={() => {
          setSelectedProjectForTasks(null);
          setInitialShowOnlyMyTasks(false);
          fetchInitialData();
        }}
        onSaveTasks={async () => {
          await fetchInitialData();
        }}
      />
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
              <th className="table-actions">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" className="table-loading-cell">Loading projects from database...</td>
              </tr>
            ) : filteredProjects.length > 0 ? (
              filteredProjects.map((p, index) => {
                const projectName = p.name || p.projectName || p.title || p.project_name || 'Untitled Project';
                const assignedList = getAssignedUsersArray(p);
                const displayStatus = p.calculatedStatus || getDynamicStatus(p.startDate || p.start_date || '', p.endDate || p.end_date || '');

                return (
                  <tr 
                    key={p.id || p._id || index}
                    onClick={() => {
                      setInitialShowOnlyMyTasks(true);
                      setSelectedProjectForTasks(p);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
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
                    <td className="table-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        className="btn-action"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: '#059669',
                          color: '#fff',
                          padding: '8px 14px',
                          borderRadius: '6px',
                          fontWeight: '600',
                          fontSize: '0.85rem',
                          border: 'none',
                          cursor: 'pointer',
                          boxShadow: '0 2px 4px rgba(5, 150, 105, 0.2)'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setInitialShowOnlyMyTasks(true);
                          setSelectedProjectForTasks(p);
                        }}
                      >
                        View Tasks
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="4" className="table-loading-cell">No projects found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}