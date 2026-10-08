import React, { useState, useEffect } from 'react';
import './usermanagement.css';
import './projects.css';
import Actions from './Actions'; 

function getDynamicStatus(startDate, endDate) {
  if (!endDate) return 'Ongoing';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  if (isNaN(end.getTime())) return 'Ongoing';
  end.setHours(0, 0, 0, 0);
  return end < today ? 'Completed' : 'Ongoing';
}

export default function AllProjects({ currentUser: propCurrentUser }) {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  const [currentView, setCurrentView] = useState('list');
  const [selectedProject, setSelectedProject] = useState(null);

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const localCurrent = localStorage.getItem('currentUser');
      if (localCurrent) {
        const parsed = JSON.parse(localCurrent);
        return parsed.user || parsed.data || parsed;
      }
    } catch (e) {
      console.error('Error reading localStorage:', e);
    }
    return propCurrentUser || {};
  });

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
        const activeUsr = userData.user || userData.data || userData;
        if (activeUsr && Object.keys(activeUsr).length > 0) {
          setCurrentUser(activeUsr);
          localStorage.setItem('currentUser', JSON.stringify(activeUsr));
          if (activeUsr.id !== undefined) {
            localStorage.setItem('userId', activeUsr.id.toString());
          }
        }
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
    let formattedRole = roleKey === 'frontend' ? 'Frontend Developer' : roleKey === 'backend' ? 'Backend Developer' : roleKey === 'fullstack' ? 'Full Stack Developer' : roleKey === 'super_admin' ? 'Super Admin' : roleKey ? roleKey.charAt(0).toUpperCase() + roleKey.slice(1) : '';
    const name = sysUser ? (sysUser.first_name || sysUser.last_name ? `${sysUser.first_name} ${sysUser.last_name}`.trim() : sysUser.username || sysUser.email || sysUser.name || identifier) : identifier;
    return { name, role: formattedRole, email: sysUser?.email || identifier };
  };

  const handleOpenActions = (p) => {
    setSelectedProject(p);
    setCurrentView('actions');
  };

  if (currentView === 'actions') {
    const projectName = selectedProject?.name || selectedProject?.projectName || selectedProject?.title || selectedProject?.project_name || 'Project';
    return (
      <div className="dash-panel">
        <div className="projects-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 className="projects-title">Project Actions: {projectName}</h3>
            <p className="projects-description">Manage project details, team members, and settings.</p>
          </div>
          <div>
            <button 
              className="btn-secondary" 
              onClick={() => {
                setCurrentView('list');
                setSelectedProject(null);
                fetchInitialData();
              }}
              style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: '600' }}
            >
              ← Back to Projects
            </button>
          </div>
        </div>

        <Actions
          project={selectedProject}
          users={users}
          currentUser={currentUser}
          onProjectUpdated={fetchInitialData}
          onBackToProjects={() => {
            setCurrentView('list');
            setSelectedProject(null);
            fetchInitialData();
          }}
          onSaveTasks={async (updatedTasks) => {
            if (!selectedProject) return;
            const projectId = selectedProject.id || selectedProject._id || selectedProject.pk;
            const csrftoken = document.cookie.split(';').find(c => c.trim().startsWith('csrftoken='))?.split('=')[1];
            const response = await fetch(`http://localhost:8000/api/projects/${projectId}/`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                ...(csrftoken ? { 'X-CSRFToken': csrftoken } : {})
              },
              credentials: 'include',
              body: JSON.stringify({ user_tasks: updatedTasks })
            });
            if (response.ok) {
              const updatedProj = { ...selectedProject, user_tasks: updatedTasks };
              setSelectedProject(updatedProj);
              fetchInitialData();
            } else {
              throw new Error('Failed to save tasks');
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="dash-panel">
      <div className="projects-header">
        <div className="projects-header-info">
          <h3 className="projects-title">All Projects</h3>
          <p className="projects-description">
            Comprehensive overview of all database system projects and assigned users. Click any row to view actions.
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
                <td colSpan="6" className="table-loading-cell">Loading all projects from database...</td>
              </tr>
            ) : filteredProjects.length > 0 ? (
              filteredProjects.map((p, index) => {
                const projectName = p.name || p.projectName || p.title || p.project_name || 'Untitled Project';
                const startDate = p.startDate || p.start_date || 'N/A';
                const endDate = p.endDate || p.end_date || 'N/A';
                const assignedList = getAssignedUsersArray(p);
                const displayStatus = p.calculatedStatus || getDynamicStatus(startDate, endDate);

                return (
                  <tr 
                    key={p.id || p._id || index}
                    onClick={() => handleOpenActions(p)}
                    style={{ cursor: 'pointer', transition: 'background-color 0.15s ease' }}
                    title="Click anywhere to open project actions"
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
                    <td className="date-cell">{startDate}</td>
                    <td className="date-cell">{endDate}</td>
                    <td className="table-actions" onClick={(e) => e.stopPropagation()}>
                      <button 
                        className="btn-action" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenActions(p);
                        }}
                      >
                        view
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="table-loading-cell">No projects found in database.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}