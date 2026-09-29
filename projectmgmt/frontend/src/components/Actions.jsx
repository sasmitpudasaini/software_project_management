import React, { useState, useEffect } from 'react';
import './usermanagement.css';
import './projects.css';
import './curd.css';

// --- HELPER FUNCTIONS ---
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

export default function Actions({ project, users = [], currentUser, onSaveTasks, onProjectUpdated, onBackToProjects }) {
  if (!project) return null;

  const projectName = project.name || project.projectName || project.title || project.project_name || 'Untitled Project';

  // --- EDIT FORM STATE ---
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
  const [savingEdit, setSavingEdit] = useState(false);

  // --- ADD TASK STATE ---
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskLoading, setTaskLoading] = useState(false);

  // --- USERS TASK FILTER STATE ---
  const [selectedUserFilter, setSelectedUserFilter] = useState('All');

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
        name: projectName,
        description: project.description || project.desc || '',
        startDate: formattedStart,
        endDate: formattedEnd,
        status: getDynamicStatus(formattedStart, formattedEnd),
        assignedUsers: assignedVal,
        userPermissions: project.userPermissions || project.user_permissions || project.permissions || {}
      });
    }
  }, [project, projectName]);

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
    let formattedRole = roleKey === 'frontend' ? 'Frontend Developer' : roleKey === 'backend' ? 'Backend Developer' : roleKey === 'fullstack' ? 'Full Stack Developer' : roleKey ? roleKey.charAt(0).toUpperCase() + roleKey.slice(1) : (sysUser?.is_staff || sysUser?.is_superuser ? 'Admin' : 'Member');
    const name = sysUser ? (sysUser.first_name || sysUser.last_name ? `${sysUser.first_name} ${sysUser.last_name}`.trim() : sysUser.username || sysUser.email || sysUser.name || identifier) : identifier;
    return { name, role: formattedRole, email: sysUser?.email || identifier };
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

  // --- HANDLERS ---
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSavingEdit(true);
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
        alert('Project updated successfully!');
        if (onProjectUpdated) onProjectUpdated();
      } else {
        const errorData = await response.json();
        alert('Failed to update project: ' + JSON.stringify(errorData));
      }
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Network error while updating project.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleAddTaskSubmit = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim()) {
      alert('Please enter a task title.');
      return;
    }

    let activeUser = null;
    try {
      const localCurrent = localStorage.getItem('currentUser');
      if (localCurrent) {
        const parsed = JSON.parse(localCurrent);
        activeUser = parsed.user || parsed.data || parsed;
      }
      if (!activeUser) {
        const localUser = localStorage.getItem('user');
        if (localUser) {
          const parsed = JSON.parse(localUser);
          activeUser = parsed.user || parsed.data || parsed;
        }
      }
    } catch (err) {
      console.error('Error reading localStorage in AddTasks:', err);
    }

    const finalUser = activeUser || currentUser;
    const creatorUsername = finalUser?.username || finalUser?.email || 'User';

    const newTask = {
      id: Date.now().toString(),
      title: taskTitle.trim(),
      description: taskDescription.trim(),
      task_created_by: creatorUsername,
      created_at: new Date().toISOString()
    };

    const existingTasks = project.user_tasks || project.userTasks || [];
    const updatedTasks = [...existingTasks, newTask];

    setTaskLoading(true);
    try {
      if (onSaveTasks) {
        await onSaveTasks(updatedTasks);
      }
      setTaskTitle('');
      setTaskDescription('');
      alert('Task added & saved successfully!');
    } catch (err) {
      console.error('Error saving task to database:', err);
      alert('Failed to save task.');
    } finally {
      setTaskLoading(false);
    }
  };

  const scrollToAddTask = () => {
    document.getElementById('add-task-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Process user tasks for display
  const userTasksData = project.user_tasks || project.userTasks || [];
  let normalizedTasks = {};
  if (Array.isArray(userTasksData)) {
    userTasksData.forEach((task) => {
      if (!task) return;
      const creatorKey = task.task_created_by || task.username || task.user || task.assigned_user || 'Unassigned';
      if (!normalizedTasks[creatorKey]) normalizedTasks[creatorKey] = [];
      normalizedTasks[creatorKey].push({
        ...task,
        displayName: task.name || `Task ${normalizedTasks[creatorKey].length + 1}`
      });
    });
  }
  const userKeys = Object.keys(normalizedTasks);
  const filteredUserKeys = selectedUserFilter === 'All' 
    ? userKeys 
    : userKeys.filter(uname => uname === selectedUserFilter);

  const assignedList = editForm.assignedUsers;

  return (
    <div className="dash-panel" style={{ background: '#fff', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#1e293b' }}>Project Management: {projectName}</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>Scroll down to view details, review user tasks, edit, and add tasks[cite: 6].</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button 
            type="button" 
            className="btn-primary" 
            onClick={scrollToAddTask}
            style={{ padding: '8px 16px', fontSize: '13px', cursor: 'pointer' }}
          >
            + Add Task
          </button>
          <button 
            type="button" 
            className="btn-secondary" 
            onClick={onBackToProjects} 
            style={{ padding: '8px 16px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}
          >
            ← Back to All Projects
          </button>
        </div>
      </div>

      {/* ==========================================
          1. VIEW DETAILS SECTION
          ========================================== */}
      <div style={{ marginBottom: '32px', background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: '#1e293b', borderBottom: '1px solid #cbd5e1', paddingBottom: '8px' }}>
          📄 Project Details
        </h3>
        
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px', fontSize: '13px' }}>Description</label>
          <p style={{ background: '#ffffff', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0', margin: 0, fontSize: '13px', color: '#334155' }}>
            {project.description || project.desc || 'No description provided.'}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px', fontSize: '13px' }}>Start Date</label>
            <p style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', margin: 0, fontSize: '13px', color: '#334155' }}>
              {project.startDate || project.start_date || project.start || 'N/A'}
            </p>
          </div>
          <div>
            <label style={{ fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px', fontSize: '13px' }}>End Date</label>
            <p style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', margin: 0, fontSize: '13px', color: '#334155' }}>
              {project.endDate || project.end_date || project.end || 'N/A'}
            </p>
          </div>
        </div>

        <div>
          <label style={{ fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px', fontSize: '13px' }}>Assigned Team Members</label>
          <div style={{ background: '#ffffff', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            {assignedList.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {assignedList.map(uname => {
                  const userInfo = getUserDisplayInfo(uname);
                  return (
                    <span key={uname} style={{ background: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '4px', fontSize: '13px' }}>
                      <strong>{userInfo.name}</strong> {userInfo.role ? `(${userInfo.role})` : ''}
                    </span>
                  );
                })}
              </div>
            ) : (
              <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>No users assigned to this project.</p>
            )}
          </div>
        </div>
      </div>

      {/* ==========================================
          2. VIEW USER TASKS SECTION (Moved Before Edit)
          ========================================== */}
      <div style={{ marginBottom: '32px', background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #cbd5e1', paddingBottom: '8px', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b' }}>📋 View User Tasks</h3>
            <p style={{ fontSize: '12px', color: '#666', margin: '2px 0 0 0' }}>Tasks created by members on this project.</p>
          </div>
          <button 
            type="button" 
            className="btn-primary" 
            onClick={scrollToAddTask}
            style={{ padding: '6px 14px', fontSize: '12px', cursor: 'pointer' }}
          >
            + Add Task
          </button>
        </div>

        <div style={{ paddingBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #edf2f7', marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#333' }}>Filter by Creator:</label>
          <select 
            value={selectedUserFilter} 
            onChange={(e) => setSelectedUserFilter(e.target.value)}
            style={{ padding: '7px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff' }}
          >
            <option value="All">All Users ({userKeys.length} Creators)</option>
            {userKeys.map(uname => {
              const info = getUserDisplayInfo(uname);
              return (
                <option key={uname} value={uname}>{info.name} ({uname})</option>
              );
            })}
          </select>
        </div>

        <div>
          {filteredUserKeys.length > 0 ? (
            filteredUserKeys.map((uname) => {
              const userInfo = getUserDisplayInfo(uname);
              const tasksList = Array.isArray(normalizedTasks[uname]) ? normalizedTasks[uname] : [];

              return (
                <div key={uname} style={{ marginBottom: '20px', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', background: '#ffffff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                    <h4 style={{ margin: 0, fontSize: '15px', color: '#1e293b' }}>
                      {userInfo.name} <span style={{ fontSize: '13px', fontWeight: 'normal', color: '#64748b' }}>({uname}) {userInfo.role ? `- ${userInfo.role}` : ''}</span>
                    </h4>
                    <span style={{ fontSize: '12px', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '4px', fontWeight: '500' }}>
                      {tasksList.length} {tasksList.length === 1 ? 'Task' : 'Tasks'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {tasksList.map((task, tIndex) => {
                      const desc = task.description || task.desc || task.task_description || task.content || '';
                      const taskTitle = task.title || task.name || `Task #${tIndex + 1}`;
                      const taskNumberLabel = task.name || `Task ${tIndex + 1}`;

                      return (
                        <div key={tIndex} style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <strong style={{ fontSize: '13px', color: '#0f172a' }}>
                              {taskNumberLabel}: {taskTitle}
                            </strong>
                            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>
                              Created By: {uname}
                            </span>
                          </div>
                          <p style={{ margin: 0, fontSize: '13px', color: '#334155', whiteSpace: 'pre-wrap' }}>
                            {typeof desc === 'object' ? JSON.stringify(desc, null, 2) : desc}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ textAlign: 'center', padding: '24px', color: '#64748b', background: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <p style={{ margin: 0, fontSize: '13px' }}>No tasks found for this project yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* ==========================================
          3. EDIT PROJECT SECTION
          ========================================== */}
      <div style={{ marginBottom: '32px', background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: '#1e293b', borderBottom: '1px solid #cbd5e1', paddingBottom: '8px' }}>
          ✏️ Edit Project
        </h3>
        <form onSubmit={handleSaveEdit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px', fontSize: '13px' }}>Project Name</label>
            <input
              type="text"
              className="form-input"
              required
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px', fontSize: '13px' }}>Description</label>
            <textarea
              className="form-textarea"
              rows="3"
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px', fontSize: '13px' }}>Start Date</label>
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
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff' }}
              />
            </div>
            <div>
              <label style={{ fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px', fontSize: '13px' }}>End Date</label>
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
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px', fontSize: '13px' }}>Status (Auto-calculated)</label>
            <input
              type="text"
              className="form-input"
              disabled
              value={getDynamicStatus(editForm.startDate, editForm.endDate)}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f1f5f9' }}
            />
          </div>

          {checkIsAdminOrSuperAdmin() && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px', fontSize: '13px' }}>Assigned Users</label>
              <div style={{ background: '#ffffff', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0', maxHeight: '180px', overflowY: 'auto' }}>
                {users && users.length > 0 ? (
                  users.map(u => {
                    const uid = u.username || u.id?.toString() || u.email;
                    const isChecked = editForm.assignedUsers.includes(uid);
                    const userInfo = getUserDisplayInfo(uid);
                    return (
                      <label key={uid} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer', fontSize: '13px' }}>
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
                  <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>No users found in database.</p>
                )}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px' }}>
            <button type="submit" className="btn-primary" disabled={savingEdit} style={{ padding: '8px 16px', fontSize: '13px', cursor: 'pointer' }}>
              {savingEdit ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* ==========================================
          4. ADD TASK SECTION
          ========================================== */}
      <div id="add-task-section" style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: '#1e293b', borderBottom: '1px solid #cbd5e1', paddingBottom: '8px' }}>
          ➕ Add New Task
        </h3>

        <form onSubmit={handleAddTaskSubmit}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '13px', marginBottom: '4px', display: 'block', fontWeight: '600', color: '#475569' }}>Task Title</label>
            <input
              type="text"
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff', fontSize: '13px' }}
              placeholder="Enter task title..."
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              required
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', marginBottom: '4px', display: 'block', fontWeight: '600', color: '#475569' }}>Task Description</label>
            <textarea
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', minHeight: '80px', background: '#fff', fontSize: '13px' }}
              placeholder="Enter task description..."
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={taskLoading} style={{ padding: '8px 16px', fontSize: '13px', cursor: 'pointer' }}>
            {taskLoading ? 'Saving to Database...' : 'Add & Save to Database'}
          </button>
        </form>
      </div>

    </div>
  );
}