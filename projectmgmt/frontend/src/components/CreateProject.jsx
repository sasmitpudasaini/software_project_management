import React, { useState, useEffect } from 'react';

// Helper function to extract Django CSRF token from cookies
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

// Helper function to dynamically calculate status based on start and end dates
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

  useEffect(() => {
    loadSystemUsers();
    try {
      const usr = JSON.parse(localStorage.getItem('user') || localStorage.getItem('current_user') || '{}');
      setCurrentUser(usr);
    } catch (e) {
      console.error('Failed to parse current user from localStorage', e);
    }
  }, []);

  // Automatically update status whenever start or end date changes
  useEffect(() => {
    const calculated = getDynamicStatus(startDate, endDate);
    setProjectStatus(calculated);
  }, [startDate, endDate]);

  const loadSystemUsers = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/users/', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        const usersData = Array.isArray(data) ? data : (data.results || data.data || []);
        setAllSystemUsers(usersData);
      } else {
        console.error('Failed to fetch users from database API');
        setAllSystemUsers([]);
      }
    } catch (err) {
      console.error('Error fetching users from database API:', err);
      setAllSystemUsers([]);
    }
  };

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

    const initialUserPermissions = {};
    assignedUsers.forEach(uname => {
      initialUserPermissions[uname] = { read: true, edit: false };
    });

    // Resolve created_by user ID or username from session or currentUser state
    const creatorId = currentUser.id || currentUser.pk || currentUser.username || currentUser.email;

    const finalStatus = getDynamicStatus(startDate, endDate);

    const payload = {
      title: projectName,        // Satisfies Django backend 'title' requirement
      name: projectName,         // Retained for compatibility if needed
      description: description,
      start_date: startDate || null,
      end_date: endDate || null,
      status: finalStatus,
      assigned_users: assignedUsers,
      userPermissions: initialUserPermissions,
      created_by: creatorId      // Satisfies Django backend foreign key/required field
    };

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
      });

      if (response.ok) {
        onBack();
      } else {
        const errData = await response.json();
        alert('Failed to create project in database: ' + JSON.stringify(errData));
      }
    } catch (err) {
      console.error('Network error during project creation:', err);
      alert('Network error during project creation. Please make sure your Django backend is running.');
    }
  };

  return (
    <div className="dash-panel" style={{ background: '#fff', padding: '24px', borderRadius: '8px', maxWidth: '600px', margin: '0 auto' }}>
      <h3>Create New Project</h3>
      <form onSubmit={handleCreate} style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>Project Name</label>
          <input 
            type="text" 
            value={projectName} 
            onChange={(e) => setProjectName(e.target.value)} 
            required
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>Description</label>
          <textarea 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            rows={3}
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>Start Date</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>End Date</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>Status (Auto-calculated)</label>
          <input 
            type="text" 
            disabled
            value={projectStatus} 
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', fontWeight: '500' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>Assign Users from Database</label>
          <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px' }}>
            {allSystemUsers.length > 0 ? (
              allSystemUsers.map(u => {
                const uname = u.username || u.email;
                const isChecked = assignedUsers.includes(uname);
                const userInfo = getUserDisplayInfo(uname);
                return (
                  <label key={uname} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={isChecked}
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
              <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>No users found in database API.</p>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button type="submit" style={{ background: '#8b5cf6', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Create Project</button>
          <button type="button" onClick={onBack} style={{ background: '#cbd5e1', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
        </div>
      </form>
    </div>
  );
}