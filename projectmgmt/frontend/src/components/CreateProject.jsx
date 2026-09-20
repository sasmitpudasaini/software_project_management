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

  if (end < today) {
    return 'Completed';
  }
  return 'Ongoing';
}

export default function CreateProject({ onBack }) {
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [projectStatus, setProjectStatus] = useState('Ongoing');
  const [allSystemUsers, setAllSystemUsers] = useState([]);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState({});
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const userRes = await fetch('http://localhost:8000/api/auth/current-user/', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        setCurrentUser(userData.user || userData.data || userData);
      } else {
        const usr = JSON.parse(localStorage.getItem('user') || localStorage.getItem('current_user') || '{}');
        setCurrentUser(usr);
      }
    } catch (e) {
      try {
        const usr = JSON.parse(localStorage.getItem('user') || localStorage.getItem('current_user') || '{}');
        setCurrentUser(usr);
      } catch (err) {
        console.error('Failed to parse current user', err);
      }
    }

    try {
      const response = await fetch('http://localhost:8000/api/users/', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        const usersData = Array.isArray(data) ? data : (data.results || data.data || []);
        setAllSystemUsers(usersData);
      } else {
        setAllSystemUsers([]);
      }
    } catch (err) {
      console.error('Error fetching users from database API:', err);
      setAllSystemUsers([]);
    }
  };

  useEffect(() => {
    const calculated = getDynamicStatus(startDate, endDate);
    setProjectStatus(calculated);
  }, [startDate, endDate]);

  const getUserDisplayInfo = (identifier) => {
    const sysUser = allSystemUsers.find(u => 
      u.username === identifier || 
      u.email === identifier || 
      u.id?.toString() === identifier?.toString()
    );

    const roleKey = sysUser?.role || 'Not assigned';
    let formattedRole = roleKey;
    if (roleKey === 'frontend') formattedRole = 'Frontend Developer';
    else if (roleKey === 'backend') formattedRole = 'Backend Developer';
    else if (roleKey === 'fullstack') formattedRole = 'Full Stack Developer';
    else if (roleKey) {
      formattedRole = roleKey.charAt(0).toUpperCase() + roleKey.slice(1);
    }

    const name = sysUser ? (
      sysUser.first_name || sysUser.last_name 
        ? `${sysUser.first_name} ${sysUser.last_name}`.trim() 
        : sysUser.username || sysUser.email || identifier
    ) : identifier;

    return { name, role: formattedRole, email: sysUser?.email || identifier };
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);

    const initialUserPermissions = {};
    assignedUsers.forEach(uname => {
      initialUserPermissions[uname] = { read: true, edit: false };
    });

    const creatorId = currentUser.id || currentUser.pk || currentUser.username || currentUser.email;
    const finalStatus = getDynamicStatus(startDate, endDate);

    const payload = {
      title: projectName,
      name: projectName,
      description: description,
      start_date: startDate || null,
      end_date: endDate || null,
      status: finalStatus,
      assigned_users: assignedUsers,
      userPermissions: initialUserPermissions,
      created_by: creatorId
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const csrftoken = getCookie('csrftoken');
      const response = await fetch('http://localhost:8000/api/projects/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken,
        },
        credentials: 'include',
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const responseText = await response.text();
      let resData = {};
      try {
        resData = responseText ? JSON.parse(responseText) : {};
      } catch (parseErr) {
        resData = { raw: responseText };
      }

      if (response.ok) {
        setSuccessMessage('Project created successfully!');
        sessionStorage.setItem('activeTab', 'all');
        sessionStorage.setItem('projectReturnTab', 'all');

        setTimeout(() => {
          if (typeof onBack === 'function') {
            onBack('all');
          } else {
            window.location.reload();
          }
        }, 1200);
      } else {
        alert('Failed to create project in database: ' + (resData.detail || JSON.stringify(resData)));
        setSaving(false);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('Error during project creation:', err);
      
      if (err.name === 'AbortError') {
        alert('Request timed out. Your Django backend took too long to respond.');
      } else {
        alert('Network error or server crash. Please check your Django backend terminal/console for errors.');
      }
      setSaving(false);
    }
  };

  return (
    <div className="dash-panel create-project-panel">
      {successMessage && (
        <div className="success-toast">
          <span>✓</span> {successMessage}
        </div>
      )}

      <h3>Create New Project</h3>
      <form onSubmit={handleCreate} className="create-project-form">
        <div>
          <label className="form-label-bold">Project Name</label>
          <input 
            type="text" 
            value={projectName} 
            onChange={(e) => setProjectName(e.target.value)} 
            required
            disabled={Boolean(successMessage)}
            className="form-input-custom"
          />
        </div>
        <div>
          <label className="form-label-bold">Description</label>
          <textarea 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            rows={3}
            disabled={Boolean(successMessage)}
            className="form-textarea-custom"
          />
        </div>
        <div className="date-fields-wrapper">
          <div className="date-field-item">
            <label className="form-label-bold">Start Date</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
              disabled={Boolean(successMessage)}
              className="form-input-custom"
            />
          </div>
          <div className="date-field-item">
            <label className="form-label-bold">End Date</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
              disabled={Boolean(successMessage)}
              className="form-input-custom"
            />
          </div>
        </div>
        <div>
          <label className="form-label-bold">Status (Auto-calculated)</label>
          <input 
            type="text" 
            disabled
            value={projectStatus} 
            className="status-input-custom"
          />
        </div>

        <div>
          <label className="form-label-bold">Assign Users from Database</label>
          <div className="users-checkbox-box">
            {allSystemUsers.length > 0 ? (
              allSystemUsers.map(u => {
                const uname = u.username || u.email;
                const isChecked = assignedUsers.includes(uname);
                const userInfo = getUserDisplayInfo(uname);
                return (
                  <label key={uname} className="users-checkbox-label">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={Boolean(successMessage)}
                      onChange={(e) => {
                        let updated = [...assignedUsers];
                        if (e.target.checked) {
                          if (!updated.includes(uname)) updated.push(uname);
                        } else {
                          updated = updated.filter(item => item !== uname);
                        }
                        setAssignedUsers(updated);
                      }}
                    />
                    <span>{userInfo.name} ({userInfo.role})</span>
                  </label>
                );
              })
            ) : (
              <p className="no-users-text">No users found in database API.</p>
            )}
          </div>
        </div>

        <div className="form-buttons-row">
          <button 
            type="submit" 
            disabled={saving || Boolean(successMessage)}
            className="btn-create-custom"
            style={{ cursor: (saving || successMessage) ? 'not-allowed' : 'pointer', opacity: (saving || successMessage) ? 0.7 : 1 }}
          >
            {saving ? 'Creating Project...' : successMessage ? 'Created!' : 'Create Project'}
          </button>
          <button 
            type="button" 
            onClick={onBack} 
            disabled={saving || Boolean(successMessage)}
            className="btn-cancel-custom"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}