import React, { useState, useEffect } from 'react';
import './usermanagement.css';
import './projects.css';
import ReadProject from './ReadProject';
import UpdateProject from './UpdateProject';
import DeleteProject from './DeleteProject';
import UsersTask from './UsersTask';

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
  const [currentUser, setCurrentUser] = useState(propCurrentUser || null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState(null);

  const [isReadModalOpen, setIsReadModalOpen] = useState(false);
  const [projectToRead, setProjectToRead] = useState(null);

  const [isUsersTaskModalOpen, setIsUsersTaskModalOpen] = useState(false);
  const [projectToUsersTask, setProjectToUsersTask] = useState(null);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [projectToAssign, setProjectToAssign] = useState(null);
  const [assignFormUsers, setAssignFormUsers] = useState([]);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);

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
        fetch('http://localhost:8000/api/users/', { credentials: 'include', headers }).catch(() => ({ ok: false }))
      ];

      if (!propCurrentUser) {
        requests.push(fetch('http://localhost:8000/api/auth/current-user/', { credentials: 'include', headers }).catch(() => ({ ok: false })));
      }

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
        setCurrentUser(authData.user || authData.data || authData);
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

  const checkIsSuperAdmin = () => {
    try {
      if (!currentUser) return false;
      const userRole = (currentUser?.role || currentUser?.userRole || currentUser?.user_type || '').toLowerCase();
      const username = (currentUser?.username || currentUser?.email || '').toLowerCase();
      return currentUser?.is_superuser === true || 
             currentUser?.is_superuser === 1 || 
             currentUser?.is_superuser === '1' || 
             currentUser?.isSuperAdmin === true || 
             currentUser?.isSuperuser === true || 
             userRole.includes('super') || 
             username === 'superadmin';
    } catch (e) {
      return false;
    }
  };

  const checkIsAdminOrSuperAdmin = () => {
    try {
      if (!currentUser) return false;
      if (checkIsSuperAdmin()) return true;
      const userRole = (currentUser?.role || currentUser?.userRole || currentUser?.user_type || currentUser?.group || '').toLowerCase();
      const username = (currentUser?.username || currentUser?.email || '').toLowerCase();
      return userRole.includes('admin') || currentUser?.isAdmin === true || currentUser?.is_staff === true || currentUser?.is_admin === true || username === 'admin' || (Array.isArray(currentUser?.groups) && currentUser.groups.some(g => typeof g === 'string' && g.toLowerCase().includes('admin')));
    } catch (e) {
      return false;
    }
  };

  const canEditProject = (p) => {
    if (checkIsAdminOrSuperAdmin()) return true;
    const assigned = getAssignedUsersArray(p);
    const currentName = currentUser?.username || currentUser?.email;
    const currentId = currentUser?.id?.toString();
    return assigned.includes(currentName) || (currentId && assigned.includes(currentId));
  };

  const handleOpenReadModal = (p) => {
    setProjectToRead(p);
    setIsReadModalOpen(true);
  };

  const handleOpenEditModal = (p) => {
    setProjectToEdit(p);
    setIsEditModalOpen(true);
  };

  const handleOpenUsersTaskModal = (p) => {
    setProjectToUsersTask(p);
    setIsUsersTaskModalOpen(true);
  };

  const handleOpenAssignModal = (p) => {
    setProjectToAssign(p);
    setAssignFormUsers(getAssignedUsersArray(p));
    setIsAssignModalOpen(true);
  };

  const handleSaveAssign = async (e) => {
    e.preventDefault();
    if (!projectToAssign) return;
    try {
      const projectId = projectToAssign.id || projectToAssign._id || projectToAssign.pk;
      if (!projectId) {
        alert('Error: Project ID is missing.');
        return;
      }

      const projName = projectToAssign.name || projectToAssign.projectName || projectToAssign.title || projectToAssign.project_name || projectToAssign.projectname || '';
      const csrftoken = getCookie('csrftoken');
      const formattedAssigned = assignFormUsers;
      const startVal = projectToAssign.startDate || projectToAssign.start_date || projectToAssign.start || '';
      const endVal = projectToAssign.endDate || projectToAssign.end_date || projectToAssign.end || '';
      const calculatedStatus = getDynamicStatus(startVal, endVal);

      const response = await fetch(`http://localhost:8000/api/projects/${projectId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(csrftoken ? { 'X-CSRFToken': csrftoken } : {})
        },
        credentials: 'include',
        body: JSON.stringify({
          name: projName,
          projectName: projName,
          title: projName,
          project_name: projName,
          description: projectToAssign.description || projectToAssign.desc || projectToAssign.details || '',
          start_date: startVal || null,
          end_date: endVal || null,
          startDate: startVal || null,
          endDate: endVal || null,
          status: calculatedStatus,
          assigned_users: formattedAssigned,
          assignedUsers: formattedAssigned,
          userPermissions: projectToAssign.userPermissions || projectToAssign.user_permissions || projectToAssign.permissions || {}
        })
      });

      if (response.ok) {
        setIsAssignModalOpen(false);
        setProjectToAssign(null);
        fetchInitialData();
      } else {
        const errorData = await response.json();
        alert('Failed to update user assignments: ' + JSON.stringify(errorData));
      }
    } catch (error) {
      console.error('Error updating assignments:', error);
      alert('Network error while updating assignments.');
    }
  };

  const handleOpenDeleteModal = (p) => {
    setProjectToDelete(p);
    setIsDeleteModalOpen(true);
  };

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
            Comprehensive overview and management of all database system projects and team assignments.
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
                  <tr key={p.id || p._id || p.pk || index}>
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
                    <td className="table-actions">
                      <button className="btn-action" onClick={() => handleOpenReadModal(p)}>View</button>
                      {canEditProject(p) && (
                        <button className="btn-action" onClick={() => handleOpenEditModal(p)}>Edit</button>
                      )}
                      <button className="btn-action" onClick={() => handleOpenUsersTaskModal(p)}>User's Task</button>
                      {checkIsAdminOrSuperAdmin() && (
                        <button 
                          className="btn-primary btn-action-sm" 
                          onClick={() => handleOpenAssignModal(p)}
                        >
                          Assign
                        </button>
                      )}
                      {checkIsAdminOrSuperAdmin() && (
                        <button 
                          className="btn-danger btn-action-sm" 
                          onClick={() => handleOpenDeleteModal(p)}
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

      <ReadProject
        isOpen={isReadModalOpen}
        onClose={() => {
          setIsReadModalOpen(false);
          setProjectToRead(null);
        }}
        project={projectToRead}
        users={users}
      />

      <UpdateProject
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={fetchInitialData}
        project={projectToEdit}
        users={users}
        currentUser={currentUser}
      />

      <DeleteProject
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={fetchInitialData}
        project={projectToDelete}
      />

      <UsersTask
        isOpen={isUsersTaskModalOpen}
        onClose={() => {
          setIsUsersTaskModalOpen(false);
          setProjectToUsersTask(null);
        }}
        project={projectToUsersTask}
        users={users}
      />

      {/* Assign Users Modal */}
      {isAssignModalOpen && projectToAssign && (
        <div className="modal-backdrop">
          <div className="modal-card assign-modal-card">
            <div className="modal-header">
              <h3 className="modal-title">Assign Users to {projectToAssign.name || projectToAssign.projectName || projectToAssign.title || projectToAssign.project_name || 'Project'}</h3>
              <button className="modal-close-btn" onClick={() => setIsAssignModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveAssign} className="modal-body">
              <div className="form-group">
                <label className="form-label">Select Team Members</label>
                <div className="assign-users-container">
                  {users.length > 0 ? (
                    users.map(u => {
                      const uid = u.username || u.id?.toString() || u.email;
                      const isChecked = assignFormUsers.includes(uid);
                      const userInfo = getUserDisplayInfo(uid);
                      return (
                        <label key={uid} className="assign-user-label">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              let updated = [...assignFormUsers];
                              if (e.target.checked) {
                                if (!updated.includes(uid)) updated.push(uid);
                              } else {
                                updated = updated.filter(item => item !== uid);
                              }
                              setAssignFormUsers(updated);
                            }}
                          />
                          <span><strong>{userInfo.name}</strong> {userInfo.role ? `(${userInfo.role})` : ''}</span>
                        </label>
                      );
                    })
                  ) : (
                    <p className="modal-empty-text">No users found in database.</p>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsAssignModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Assignments</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}