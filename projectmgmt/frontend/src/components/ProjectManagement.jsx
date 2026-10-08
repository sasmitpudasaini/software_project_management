import React, { useState, useEffect } from 'react';
import './usermanagement.css';
import './projects.css';
import AdminActions from './AdminActions'; 
import DeleteProject from './DeleteProject';

function getDynamicStatus(startDate, endDate) {
  if (!endDate) return 'Ongoing';
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  if (isNaN(end.getTime())) return 'Ongoing';
  end.setHours(0, 0, 0, 0);

  if (end < today) {
    return 'Completed';
  }
  return 'Ongoing';
}

export default function ProjectManagement({ onRead, currentUser: propCurrentUser }) {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  
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

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Full-page View state ('list' or 'actions')
  const [currentView, setCurrentView] = useState('list');
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectToDelete, setProjectToDelete] = useState(null);

  // Strictly check if user ID is 1
  const currentUserId = Number(currentUser?.id || localStorage.getItem('userId') || 0);
  const isUserOne = currentUserId === 1;

  const getCookie = (name) => {
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
  };

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const headers = { 'Content-Type': 'application/json' };
      
      const requests = [
        fetch('http://localhost:8000/api/projects/', { credentials: 'include', headers }),
        fetch('http://localhost:8000/api/users/', { credentials: 'include', headers }).catch(() => ({ ok: false })),
        fetch('http://localhost:8000/api/auth/current-user/', { credentials: 'include', headers }).catch(() => ({ ok: false }))
      ];

      const [projRes, userRes, authRes] = await Promise.all(requests);

      if (projRes.ok) {
        const projData = await projRes.json();
        const projArray = Array.isArray(projData) ? projData : (projData.results || projData.data || []);
        
        projArray.sort((a, b) => {
          const dateA = new Date(a.created_at || a.createdAt || 0);
          const dateB = new Date(b.created_at || b.createdAt || 0);
          return dateB - dateA;
        });

        setProjects(projArray);
      }

      if (userRes && userRes.ok) {
        const userData = await userRes.json();
        setUsers(Array.isArray(userData) ? userData : (userData.results || userData.data || []));
      }

      if (authRes && authRes.ok) {
        const authData = await authRes.json();
        const activeUsr = authData.user || authData.data || authData;
        if (activeUsr && Object.keys(activeUsr).length > 0) {
          setCurrentUser(activeUsr);
          localStorage.setItem('currentUser', JSON.stringify(activeUsr));
          if (activeUsr.id !== undefined) {
            localStorage.setItem('userId', activeUsr.id.toString());
          }
        }
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const getAssignedUsersArray = (p) => {
    const raw = p.assigned_users || p.assignedUsers || p.users || p.members || p.team || [];
    if (Array.isArray(raw)) {
      return raw.map(u => (typeof u === 'object' && u !== null ? (u.username || u.id?.toString() || u.email) : u)).filter(Boolean);
    }
    if (typeof raw === 'string' && raw.trim() !== '') return raw.split(',').map(s => s.trim()).filter(Boolean);
    return [];
  };

  const getUserDisplayInfo = (uname) => {
    const found = users.find(u => u.username === uname || u.id?.toString() === uname?.toString() || u.email === uname);
    if (found) {
      const roleKey = found.role || found.userRole || found.designation || '';
      let formattedRole = roleKey === 'frontend' ? 'Frontend Developer' : roleKey === 'backend' ? 'Backend Developer' : roleKey === 'fullstack' ? 'Full Stack Developer' : roleKey ? roleKey.charAt(0).toUpperCase() + roleKey.slice(1) : (found.is_staff || found.is_superuser ? 'Admin' : 'Member');
      return {
        name: found.first_name || found.last_name ? `${found.first_name} ${found.last_name}`.trim() : (found.username || found.email),
        role: formattedRole
      };
    }
    return { name: uname, role: '' };
  };

  const handleOpenActions = (p) => {
    setSelectedProject(p);
    setCurrentView('actions');
  };

  // If view is 'actions', render the full-page AdminActions component with delete option for User 1
  if (currentView === 'actions') {
    const projectName = selectedProject?.name || selectedProject?.projectName || selectedProject?.title || selectedProject?.project_name || 'Project';
    return (
      <div className="dash-panel">
        <div className="projects-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 className="projects-title">Project Actions: {projectName}</h3>
            <p className="projects-description">Manage project details, team members, and settings.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isUserOne && (
              <button
                className="btn-danger"
                style={{
                  background: '#dc2626',
                  color: '#fff',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontWeight: '600',
                  fontSize: '0.85rem',
                  border: 'none',
                  cursor: 'pointer'
                }}
                onClick={() => setProjectToDelete(selectedProject)}
              >
                Delete Project
              </button>
            )}
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

        <AdminActions
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
            const csrftoken = getCookie('csrftoken');
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

        {isUserOne && (
          <DeleteProject
            isOpen={Boolean(projectToDelete)}
            onClose={() => setProjectToDelete(null)}
            onSuccess={() => {
              setProjectToDelete(null);
              setCurrentView('list');
              setSelectedProject(null);
              fetchInitialData();
            }}
            project={projectToDelete}
          />
        )}
      </div>
    );
  }

  const filteredProjects = projects.map(p => {
    const startDate = p.startDate || p.start_date || p.start || '';
    const endDate = p.endDate || p.end_date || p.end || '';
    return {
      ...p,
      calculatedStatus: getDynamicStatus(startDate, endDate)
    };
  }).filter(p => {
    const nameVal = (p.name || p.projectName || p.title || p.project_name || p.projectname || '').toLowerCase();
    const matchesSearch = nameVal.includes(searchQuery.toLowerCase());
    const statusVal = p.calculatedStatus;
    const matchesStatus = statusFilter === 'All' || statusVal === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="dash-panel">
      <div className="projects-header projects-header-center">
        <div className="projects-header-info">
          <h3 className="projects-title">Project Management</h3>
          <p className="projects-description">
            Comprehensive overview and management of all database system projects and team assignments. Click any row to view actions.
          </p>
        </div>
        <div className="projects-controls-simple">
          <input
            type="text"
            className="form-input project-search-input"
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
                <td colSpan="6" className="table-loading-cell">
                  Loading projects from database...
                </td>
              </tr>
            ) : filteredProjects.length > 0 ? (
              filteredProjects.map((p, index) => {
                const projectName = p.name || p.projectName || p.title || p.project_name || p.projectname || 'Untitled Project';
                const startDate = p.startDate || p.start_date || p.start || 'N/A';
                const endDate = p.endDate || p.end_date || p.end || 'N/A';
                const statusValue = p.calculatedStatus || 'Ongoing';
                const assignedList = getAssignedUsersArray(p);

                return (
                  <tr 
                    key={p.id || p._id || p.pk || index}
                    onClick={() => handleOpenActions(p)}
                    style={{ cursor: 'pointer', transition: 'background-color 0.15s ease' }}
                    title="Click anywhere to open project actions"
                  >
                    <td><strong>{projectName}</strong></td>
                    <td>
                      <span className={`badge ${statusValue === 'Completed' ? 'badge-success' : 'badge-warning'}`}>
                        {statusValue}
                      </span>
                    </td>
                    <td className="assigned-users-cell">
                      {assignedList.length > 0 ? (
                        <div className="assigned-users-list">
                          {assignedList.map(uname => {
                            const userInfo = getUserDisplayInfo(uname);
                            return (
                              <span
                                key={uname}
                                className="user-chip"
                              >
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
                    <td className="table-actions" onClick={(e) => e.stopPropagation()} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button 
                        className="btn-action" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenActions(p);
                        }}
                      >
                        view
                      </button>
                      {isUserOne && (
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
                          onClick={(e) => {
                            e.stopPropagation();
                            setProjectToDelete(p);
                          }}
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
                <td colSpan="6" className="table-loading-cell">
                  No projects found in database.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isUserOne && (
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