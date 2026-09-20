import React, { useState, useEffect } from 'react';
import './usermanagement.css';
import './projects.css';
import './curd.css';

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

function getDynamicStatus(startDate, endDate) {
  if (!endDate) return 'Ongoing';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  if (isNaN(end.getTime())) return 'Ongoing';
  end.setHours(0, 0, 0, 0);
  return end < today ? 'Completed' : 'Ongoing';
}

export default function UpdateProject({ isOpen, onClose, onSuccess, project, users, currentUser }) {
  const [editForm, setEditForm] = useState({
    id: '',
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'Ongoing',
    assignedUsers: [],
    userPermissions: {}
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (project) {
      const startVal = project.startDate || project.start_date || project.start || '';
      const endVal = project.endDate || project.end_date || project.end || '';
      const formattedStart = startVal ? startVal.split('T')[0] : '';
      const formattedEnd = endVal ? endVal.split('T')[0] : '';
      
      const rawAssigned = project.assigned_users || project.assignedUsers || project.users || project.members || project.team || [];
      let assignedVal = [];
      if (Array.isArray(rawAssigned)) {
        assignedVal = rawAssigned.map(u => (typeof u === 'object' && u !== null ? (u.username || u.id?.toString() || u.email) : u)).filter(Boolean);
      } else if (typeof rawAssigned === 'string' && rawAssigned.trim() !== '') {
        assignedVal = rawAssigned.split(',').map(s => s.trim()).filter(Boolean);
      }

      setEditForm({
        id: project.id || project._id || project.pk || '',
        name: project.name || project.projectName || project.title || project.project_name || '',
        description: project.description || project.desc || '',
        startDate: formattedStart,
        endDate: formattedEnd,
        status: getDynamicStatus(formattedStart, formattedEnd),
        assignedUsers: assignedVal,
        userPermissions: project.userPermissions || project.user_permissions || project.permissions || {}
      });
    }
  }, [project]);

  if (!isOpen || !project) return null;

  const getUserDisplayInfo = (uname) => {
    const found = users?.find(u => u.username === uname || u.id?.toString() === uname?.toString() || u.email === uname);
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
      return currentUser?.is_superuser === true || currentUser?.is_superuser === 1 || currentUser?.is_superuser === '1' || currentUser?.isSuperAdmin === true || currentUser?.isSuperuser === true || userRole.includes('super') || username === 'superadmin';
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

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const csrftoken = getCookie('csrftoken');
      const calculatedStatus = getDynamicStatus(editForm.startDate, editForm.endDate);
      const response = await fetch(`http://localhost:8000/api/projects/${editForm.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(csrftoken ? { 'X-CSRFToken': csrftoken } : {})
        },
        credentials: 'include',
        body: JSON.stringify({
          name: editForm.name,
          projectName: editForm.name,
          title: editForm.name,
          project_name: editForm.name,
          description: editForm.description,
          start_date: editForm.startDate || null,
          end_date: editForm.endDate || null,
          startDate: editForm.startDate || null,
          endDate: editForm.endDate || null,
          status: calculatedStatus,
          assigned_users: editForm.assignedUsers,
          assignedUsers: editForm.assignedUsers,
          userPermissions: editForm.userPermissions
        })
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const errorData = await response.json();
        alert('Failed to update project: ' + JSON.stringify(errorData));
      }
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Network error while updating project.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <h3 className="modal-title">Edit Project</h3>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSaveEdit} className="modal-body">
          <div className="form-group">
            <label className="form-label">Project Name</label>
            <input
              type="text"
              className="form-input"
              required
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              rows="3"
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            />
          </div>

          <div className="grid-two-cols form-group">
            <div>
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="form-input"
                value={editForm.startDate}
                onChange={(e) => {
                  const newStart = e.target.value;
                  setEditForm(prev => ({
                    ...prev,
                    startDate: newStart,
                    status: getDynamicStatus(newStart, prev.endDate)
                  }));
                }}
              />
            </div>
            <div>
              <label className="form-label">End Date</label>
              <input
                type="date"
                className="form-input"
                value={editForm.endDate}
                onChange={(e) => {
                  const newEnd = e.target.value;
                  setEditForm(prev => ({
                    ...prev,
                    endDate: newEnd,
                    status: getDynamicStatus(prev.startDate, newEnd)
                  }));
                }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Status (Auto-calculated)</label>
            <input
              type="text"
              className="form-input"
              disabled
              value={getDynamicStatus(editForm.startDate, editForm.endDate)}
            />
          </div>

          {checkIsAdminOrSuperAdmin() && (
            <div className="form-group">
              <label className="form-label">Assigned Users</label>
              <div className="users-checkbox-box">
                {users && users.length > 0 ? (
                  users.map(u => {
                    const uid = u.username || u.id?.toString() || u.email;
                    const isChecked = editForm.assignedUsers.includes(uid);
                    const userInfo = getUserDisplayInfo(uid);
                    return (
                      <label key={uid} className="users-checkbox-label">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            let updatedAssigned = [...editForm.assignedUsers];
                            if (e.target.checked) {
                              if (!updatedAssigned.includes(uid)) updatedAssigned.push(uid);
                            } else {
                              updatedAssigned = updatedAssigned.filter(item => item !== uid);
                            }
                            setEditForm({ ...editForm, assignedUsers: updatedAssigned });
                          }}
                        />
                        <span>{userInfo.name} ({userInfo.role})</span>
                      </label>
                    );
                  })
                ) : (
                  <p className="no-users-text">No users found in database.</p>
                )}
              </div>
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn-secondary" disabled={saving} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}