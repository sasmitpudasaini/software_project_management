import React, { useState, useEffect } from 'react';
import './usermanagement.css';
import './projects.css';
import ReadProject from './ReadProject';
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

// Fixed helper function to extract Django CSRF token from cookies
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim(); // Fixed: using cookies[i] instead of cookies array
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

export default function MyTasks({ onRead }) {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  const [selectedProjectForRead, setSelectedProjectForRead] = useState(null);
  const [isReadModalOpen, setIsReadModalOpen] = useState(false);

  const [selectedProjectForAddTask, setSelectedProjectForAddTask] = useState(null);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);

  const [currentUser, setCurrentUser] = useState({});

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    let result = projects.map(p => {
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
      const userRes = await fetch('http://localhost:8000/api/auth/current-user/', { credentials: 'include', headers });
      if (userRes.ok) {
        const userData = await userRes.json();
        setCurrentUser(userData.user || userData.data || userData);
      }
      const projRes = await fetch('http://localhost:8000/api/projects/', { credentials: 'include', headers });
      if (projRes.ok) {
        const data = await projRes.json();
        const projArray = Array.isArray(data) ? data : (data.results || data.data || []);
        
        projArray.sort((a, b) => {
          const dateA = new Date(a.created_at || a.createdAt || 0);
          const dateB = new Date(b.created_at || b.createdAt || 0);
          return dateB - dateA;
        });

        setProjects(projArray);
      }
      const usersRes = await fetch('http://localhost:8000/api/users/', { credentials: 'include', headers });
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(Array.isArray(data) ? data : (data.results || data.data || []));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAssignedUsersArray = (proj) => {
    if (!proj) return [];
    const raw = proj.assigned_users || proj.assignedUsers || proj.users || proj.members || proj.team;
    if (Array.isArray(raw)) {
      return raw.map(u => (typeof u === 'object' && u !== null ? [u.username, u.email, u.id?.toString()] : [u?.toString()])).flat().filter(Boolean);
    }
    if (typeof raw === 'string' && raw.trim() !== '') return raw.split(',').map(s => s.trim()).filter(Boolean);
    const perms = proj.userPermissions || proj.user_permissions || proj.permissions;
    if (perms && typeof perms === 'object') {
      return Object.keys(perms).filter(key => {
        const val = perms[key];
        return typeof val === 'object' && val !== null ? val.read || val.edit || val.update : Boolean(val);
      });
    }
    return [];
  };

  const getUserDisplayInfo = (identifier) => {
    const sysUser = users.find(u => u.username === identifier || u.email === identifier || u.id?.toString() === identifier?.toString() || u.name === identifier);
    const roleKey = sysUser?.role || sysUser?.userRole || sysUser?.designation || '';
    let formattedRole = roleKey === 'frontend' ? 'Frontend Developer' : roleKey === 'backend' ? 'Backend Developer' : roleKey === 'fullstack' ? 'Full Stack Developer' : roleKey ? roleKey.charAt(0).toUpperCase() + roleKey.slice(1) : '';
    const name = sysUser ? (sysUser.first_name || sysUser.last_name ? `${sysUser.first_name} ${sysUser.last_name}`.trim() : sysUser.username || sysUser.email || sysUser.name || identifier) : identifier;
    return { name, role: formattedRole, email: sysUser?.email || identifier };
  };

  const handleOpenRead = (p) => {
    setSelectedProjectForRead(p);
    setIsReadModalOpen(true);
  };

  const handleOpenAddTask = (p) => {
    setSelectedProjectForAddTask(p);
    setIsAddTaskModalOpen(true);
  };

  const handleSaveTasks = async (tasks) => {
    if (!selectedProjectForAddTask) return;
    try {
      const csrftoken = getCookie('csrftoken');
      const headers = { 
        'Content-Type': 'application/json',
        ...(csrftoken ? { 'X-CSRFToken': csrftoken } : {})
      };
      
      const projId = selectedProjectForAddTask.id || selectedProjectForAddTask._id;
      
      const res = await fetch(`http://localhost:8000/api/projects/${projId}/`, {
        method: 'PATCH',
        credentials: 'include',
        headers,
        body: JSON.stringify({ user_tasks: tasks })
      });

      if (res.ok) {
        setIsAddTaskModalOpen(false);
        setSelectedProjectForAddTask(null);
        fetchInitialData();
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error('Failed to save tasks to user_tasks column:', errorData);
        alert('Failed to save tasks to database. Check console for details.');
      }
    } catch (err) {
      console.error('Error saving tasks:', err);
      alert('Error saving tasks.');
    }
  };

  return (
    <div className="dash-panel">
      <div className="projects-header">
        <div className="projects-header-info">
          <h3 className="projects-title">My Tasks</h3>
          <p className="projects-description">
            Manage your assigned tasks and view project details.
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
                <td colSpan="6" className="table-loading-cell">Loading tasks and projects...</td>
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
                      <button 
                        className="btn-action" 
                        onClick={() => {
                          sessionStorage.setItem('projectReturnTab', 'my-tasks');
                          handleOpenRead(p);
                        }}
                      >
                        View
                      </button>
                      <button 
                        className="btn-action" 
                        onClick={() => handleOpenAddTask(p)}
                      >
                        Add task
                      </button>
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

      <ReadProject
        isOpen={isReadModalOpen}
        onClose={() => {
          setIsReadModalOpen(false);
          setSelectedProjectForRead(null);
        }}
        project={selectedProjectForRead}
        users={users}
      />

      {isAddTaskModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal-content" style={{ background: '#fff', borderRadius: '8px', width: '650px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
            <AddTasks 
              initialTasks={selectedProjectForAddTask?.user_tasks || selectedProjectForAddTask?.tasks || []}
              onSave={handleSaveTasks}
              onBack={() => {
                setIsAddTaskModalOpen(false);
                setSelectedProjectForAddTask(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}