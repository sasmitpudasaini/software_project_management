import React, { useState, useEffect } from 'react';
import './usermanagement.css';
import './projects.css';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [selectedUserIndex, setSelectedUserIndex] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [editRole, setEditRole] = useState('frontend');
  const [canRead, setCanRead] = useState(true);
  const [canUpdate, setCanUpdate] = useState(false);
  const [canCreate, setCanCreate] = useState(false);

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

  useEffect(() => {
    fetch('http://localhost:8000/api/users/', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        const userList = Array.isArray(data) ? data : (data.results || data.data || []);
        const regularUsers = userList.filter(
          (u) => !u.is_superuser && !u.is_staff && u.role !== 'super_admin' && u.role !== 'Admin' && u.role !== 'SuperAdmin'
        );
        setUsers(regularUsers);
      })
      .catch((err) => console.error('Error fetching users from database:', err));
  }, []);

  const toggleVerify = async (index) => {
    const user = users[index];
    const newApprovalStatus = !user.is_approved;

    try {
      const csrftoken = getCookie('csrftoken');
      const response = await fetch(`http://localhost:8000/api/users/${user.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(csrftoken ? { 'X-CSRFToken': csrftoken } : {})
        },
        credentials: 'include',
        body: JSON.stringify({ is_approved: newApprovalStatus }),
      });

      if (response.ok) {
        const updated = [...users];
        updated[index].is_approved = newApprovalStatus;
        setUsers(updated);
      } else {
        alert('Failed to update verification status.');
      }
    } catch (err) {
      console.error('Network error:', err);
    }
  };

  const handleOpenModal = (index) => {
    const user = users[index];
    setSelectedUserIndex(index);
    setEditRole(user.role || 'frontend');
    setCanRead(user.can_read_project ?? true);
    setCanUpdate(user.can_update_project ?? false);
    setCanCreate(user.can_create_project ?? false);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUserIndex(null);
  };

  const handleSavePermissions = async (e) => {
    e.preventDefault();
    if (selectedUserIndex === null) return;

    const user = users[selectedUserIndex];
    const payload = {
      role: editRole,
      can_read_project: canRead,
      can_update_project: canUpdate,
      can_create_project: canCreate,
    };

    try {
      const csrftoken = getCookie('csrftoken');
      const response = await fetch(`http://localhost:8000/api/users/${user.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(csrftoken ? { 'X-CSRFToken': csrftoken } : {})
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const updated = [...users];
        updated[selectedUserIndex] = {
          ...user,
          role: editRole,
          can_read_project: canRead,
          can_update_project: canUpdate,
          can_create_project: canCreate,
        };
        setUsers(updated);
        handleCloseModal();
      } else {
        const errData = await response.json();
        alert('Failed to save permissions: ' + JSON.stringify(errData));
      }
    } catch (err) {
      console.error('Network error:', err);
    }
  };

  return (
    <div className="dash-panel">
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 5px 0', color: '#1e293b' }}>User Management & Permissions</h3>
        <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
          Verify user accounts and manage granular module access control.
        </p>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>NAME</th>
              <th>EMAIL</th>
              <th>VERIFY</th>
              <th style={{ textAlign: 'right' }}>PERMISSIONS</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((u, index) => (
                <tr key={u.id || index}>
                  <td>
                    <strong>
                      {u.first_name || u.last_name 
                        ? `${u.first_name} ${u.last_name}`.trim() 
                        : u.username || 'Unnamed User'}
                    </strong>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'capitalize' }}>
                      Role: {u.role || 'Not assigned'}
                    </div>
                  </td>
                  <td style={{ color: '#475569' }}>{u.email}</td>
                  <td>
                    <button
                      className={`btn-action ${u.is_approved ? 'btn-revoke' : 'btn-approve'}`}
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      onClick={() => toggleVerify(index)}
                    >
                      {u.is_approved ? 'Verified ✓' : 'Verify'}
                    </button>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn-manage-perms"
                      onClick={() => handleOpenModal(index)}
                    >
                      Manage Permissions
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  No regular registered users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && selectedUserIndex !== null && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Configure Permissions</h3>
                <div className="modal-subtitle">
                  User: <strong>{users[selectedUserIndex].email}</strong>
                </div>
              </div>
              <button className="modal-close-btn" onClick={handleCloseModal}>✕</button>
            </div>

            <form onSubmit={handleSavePermissions} className="modal-body">
              <div className="auth-field" style={{ marginBottom: '20px' }}>
                <label className="auth-label">Assigned Project Role</label>
                <select
                  className="auth-input"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  required
                >
                  <option value="frontend">Frontend Developer</option>
                  <option value="backend">Backend Developer</option>
                  <option value="fullstack">Full Stack Developer</option>
                </select>
              </div>

              <div className="permission-section-box">
                <div className="permission-section-title">Projects Module Access</div>
                
                <div className="permission-row">
                  <span>Software Projects Permissions</span>
                  <div className="permission-checkboxes">
                    <label>
                      <input
                        type="checkbox"
                        checked={canRead}
                        onChange={(e) => setCanRead(e.target.checked)}
                      /> Read
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={canUpdate}
                        onChange={(e) => setCanUpdate(e.target.checked)}
                      /> Update
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={canCreate}
                        onChange={(e) => setCanCreate(e.target.checked)}
                      /> Create
                    </label>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}