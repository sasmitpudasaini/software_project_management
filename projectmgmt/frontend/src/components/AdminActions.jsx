import React, { useState, useEffect } from 'react';
import ReadProject from './ReadProject';
import UsersTask from './UsersTask';
import UpdateProject from './UpdateProject';
import AddTasks from './AddTasks';
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

function resolveActiveUsername(currentUser) {
  const storageKeys = ['activeUser', 'loggedInUser', 'username', 'user', 'auth_user', 'current_user'];
  for (const key of storageKeys) {
    try {
      const item = localStorage.getItem(key);
      if (item) {
        try {
          const parsed = JSON.parse(item);
          const usr = parsed.username || parsed.user || parsed.data || parsed;
          if (typeof usr === 'string' && usr.trim() && usr.toLowerCase() !== 'admin') {
            return usr.trim();
          }
          if (usr?.username && usr.username.toLowerCase() !== 'admin') {
            return usr.username.trim();
          }
          if (usr?.email) return usr.email.trim();
        } catch {
          if (item.trim() && item.toLowerCase() !== 'admin') {
            return item.trim();
          }
        }
      }
    } catch (e) {}
  }

  if (currentUser) {
    if (typeof currentUser === 'string' && currentUser.trim()) return currentUser.trim();
    if (currentUser.username) return currentUser.username.trim();
    if (currentUser.email) return currentUser.email.trim();
    if (currentUser.name) return currentUser.name.trim();
  }

  return 'User';
}

function parseAssignedUsers(rawAssigned) {
  if (!rawAssigned) return [];
  if (Array.isArray(rawAssigned)) {
    return rawAssigned.map(u => {
      if (typeof u === 'object' && u !== null) {
        return (u.username || u.id || u.email || u.name || '').toString().trim();
      }
      return u ? u.toString().trim() : '';
    }).filter(Boolean);
  }
  if (typeof rawAssigned === 'string') {
    const trimmed = rawAssigned.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map(u => {
            if (typeof u === 'object' && u !== null) {
              return (u.username || u.id || u.email || u.name || '').toString().trim();
            }
            return u ? u.toString().trim() : '';
          }).filter(Boolean);
        }
      } catch (e) {}
    }
    return trimmed.split(',').map(s => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
  }
  return [];
}

export default function Actions({ project, users = [], currentUser, onSaveTasks, onProjectUpdated, onBackToProjects }) {
  if (!project) return null;

  const projectName = project.name || project.projectName || project.title || project.project_name || 'Untitled Project';
  const activeProjectId = project.id || project._id || project.pk || project.project_id || '';

  // --- USER SESSION STATE ---
  const [currentUsername, setCurrentUsername] = useState(() => resolveActiveUsername(currentUser));

  useEffect(() => {
    const resolved = resolveActiveUsername(currentUser);
    if (resolved && resolved !== 'User') {
      setCurrentUsername(resolved);
    }
  }, [currentUser]);

  // --- EDIT PROJECT FORM STATE ---
  const [editForm, setEditForm] = useState({
    id: activeProjectId,
    name: projectName,
    description: '',
    startDate: '',
    endDate: '',
    status: 'Ongoing',
    assignedUsers: [],
    userPermissions: {}
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // --- ADD / EDIT TASK STATE ---
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskLoading, setTaskLoading] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);

  // --- USERS TASK FILTER & VIEW STATE ---
  const [selectedUserFilter, setSelectedUserFilter] = useState('All');
  const [showOnlyMyTasks, setShowOnlyMyTasks] = useState(false);

  useEffect(() => {
    if (project) {
      const projId = project.id || project._id || project.pk || project.project_id || '';
      const startVal = project.startDate || project.start_date || project.start || '';
      const endVal = project.endDate || project.end_date || project.end || '';
      const formattedStart = startVal ? startVal.split('T')[0] : '';
      const formattedEnd = endVal ? endVal.split('T')[0] : '';
      
      const rawAssigned = project.assigned_users || project.assignedUsers || project.users || project.members || project.team || [];
      const assignedVal = parseAssignedUsers(rawAssigned);

      setEditForm({
        id: projId,
        name: project.name || project.projectName || project.title || project.project_name || 'Untitled Project',
        description: project.description || project.desc || '',
        startDate: formattedStart,
        endDate: formattedEnd,
        status: getDynamicStatus(formattedStart, formattedEnd),
        assignedUsers: assignedVal,
        userPermissions: project.userPermissions || project.user_permissions || project.permissions || {}
      });

      setTaskTitle('');
      setTaskDescription('');
      setTaskToEdit(null);
      setSelectedUserFilter('All');
      setShowOnlyMyTasks(false);
    }
  }, [activeProjectId, project]);

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

  const checkIsUserOne = () => {
    try {
      if (!currentUser) return false;
      if (currentUser.id === 1 || currentUser.id === '1' || currentUser.pk === 1 || currentUser.pk === '1') {
        return true;
      }
      if (Array.isArray(users) && users.length > 0) {
        const matchedUser = users.find(u => 
          (u.username && u.username.toLowerCase() === currentUsername.toLowerCase()) ||
          (u.email && u.email.toLowerCase() === currentUsername.toLowerCase()) ||
          (currentUser?.id && u.id?.toString() === currentUser.id.toString())
        );
        if (matchedUser && (matchedUser.id === 1 || matchedUser.id === '1' || matchedUser.pk === 1 || matchedUser.pk === '1')) {
          return true;
        }
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  const isUserOne = checkIsUserOne();

  const checkCanAddOrEditTasks = () => {
    if (isUserOne) return true;

    const curr = (currentUsername || '').trim();
    if (!curr || curr.toLowerCase() === 'user' || curr.toLowerCase() === 'guest') return false;

    const rawAssigned = project.assigned_users || project.assignedUsers || project.users || project.members || project.team;
    const assignedList = parseAssignedUsers(rawAssigned);

    if (!assignedList || assignedList.length === 0) return false;

    const userIdentifiers = new Set();
    userIdentifiers.add(curr.toLowerCase());
    
    if (currentUser) {
      if (currentUser.username) userIdentifiers.add(currentUser.username.toString().trim().toLowerCase());
      if (currentUser.email) userIdentifiers.add(currentUser.email.toString().trim().toLowerCase());
      if (currentUser.id) userIdentifiers.add(currentUser.id.toString().trim().toLowerCase());
      if (currentUser.pk) userIdentifiers.add(currentUser.pk.toString().trim().toLowerCase());
      if (currentUser.name) userIdentifiers.add(currentUser.name.toString().trim().toLowerCase());
    }

    if (Array.isArray(users)) {
      const matchedUser = users.find(u => 
        (u.username && u.username.toLowerCase() === curr.toLowerCase()) ||
        (u.email && u.email.toLowerCase() === curr.toLowerCase()) ||
        (currentUser?.id && u.id?.toString() === currentUser.id.toString()) ||
        (u.name && u.name.toLowerCase() === curr.toLowerCase())
      );
      if (matchedUser) {
        if (matchedUser.username) userIdentifiers.add(matchedUser.username.toString().trim().toLowerCase());
        if (matchedUser.email) userIdentifiers.add(matchedUser.email.toString().trim().toLowerCase());
        if (matchedUser.id) userIdentifiers.add(matchedUser.id.toString().trim().toLowerCase());
        if (matchedUser.name) userIdentifiers.add(matchedUser.name.toString().trim().toLowerCase());
      }
    }

    return assignedList.some(assignedItem => {
      const itemStr = (assignedItem || '').toString().trim().toLowerCase();
      if (!itemStr) return false;
      for (const idnt of userIdentifiers) {
        if (idnt === itemStr || itemStr.includes(idnt) || idnt.includes(itemStr)) {
          return true;
        }
      }
      return false;
    });
  };

  const userCanManageTasks = checkCanAddOrEditTasks();

  const getParsedTasks = () => {
    const rawTasks = project.user_tasks || project.userTasks;
    if (!rawTasks) return [];
    if (Array.isArray(rawTasks)) return rawTasks;
    if (typeof rawTasks === 'string') {
      try {
        const parsed = JSON.parse(rawTasks);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        return [];
      }
    }
    return [];
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!isUserOne) {
      alert('Access Denied. Only the user with ID 1 can edit project settings.');
      return;
    }

    setSavingEdit(true);
    try {
      const csrftoken = getCookie('csrftoken');
      const calculatedStatus = getDynamicStatus(editForm.startDate, editForm.endDate);
      const targetId = activeProjectId || editForm.id;

      const response = await fetch(`http://localhost:8000/api/projects/${targetId}/`, {
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

  const handleTaskFormSubmit = async (e) => {
    e.preventDefault();
    if (!userCanManageTasks) {
      alert('Access Denied. You are not assigned to this project.');
      return;
    }

    if (!taskTitle.trim()) {
      alert('Please enter a task title.');
      return;
    }

    const creatorUsername = currentUsername || 'User';
    const existingTasks = getParsedTasks();
    let updatedTasks = [];

    if (taskToEdit) {
      updatedTasks = existingTasks.map((t) => {
        if ((t.id && t.id === taskToEdit.id) || t === taskToEdit) {
          return {
            ...t,
            title: taskTitle.trim(),
            description: taskDescription.trim(),
          };
        }
        return t;
      });
    } else {
      const newTask = {
        id: Date.now().toString(),
        title: taskTitle.trim(),
        description: taskDescription.trim(),
        task_created_by: creatorUsername,
        created_at: new Date().toISOString()
      };
      updatedTasks = [...existingTasks, newTask];
    }

    setTaskLoading(true);
    try {
      const csrftoken = getCookie('csrftoken');
      const targetProjectId = activeProjectId || editForm.id;
      
      if (!targetProjectId) {
        throw new Error("No active project ID found.");
      }

      const response = await fetch(`http://localhost:8000/api/projects/${targetProjectId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(csrftoken ? { 'X-CSRFToken': csrftoken } : {})
        },
        credentials: 'include',
        body: JSON.stringify({
          name: projectName,
          user_tasks: updatedTasks,
          userTasks: updatedTasks
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }

      if (onSaveTasks) {
        await onSaveTasks(updatedTasks);
      }
      if (onProjectUpdated) {
        onProjectUpdated();
      }

      setTaskTitle('');
      setTaskDescription('');
      setTaskToEdit(null);
      alert(taskToEdit ? 'Task updated successfully!' : `Task added successfully to "${projectName}" as ${creatorUsername}!`);
    } catch (err) {
      console.error('Error saving task to database:', err);
      alert('Failed to save task: ' + (err.message || err));
    } finally {
      setTaskLoading(false);
    }
  };

  const handleStartEditTask = (task) => {
    if (!userCanManageTasks) return;
    setTaskToEdit(task);
    setTaskTitle(task.title || task.name || '');
    setTaskDescription(task.description || task.desc || task.task_description || '');
    document.getElementById('add-task-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteTask = async (taskToDelete) => {
    if (!userCanManageTasks) return;

    if (!window.confirm("Are you sure you want to delete this task?")) return;

    const existingTasks = getParsedTasks();
    const updatedTasks = existingTasks.filter(t => {
      if (t.id && taskToDelete.id) return t.id !== taskToDelete.id;
      return t !== taskToDelete;
    });

    try {
      const csrftoken = getCookie('csrftoken');
      const targetProjectId = activeProjectId || editForm.id;

      if (!targetProjectId) {
        throw new Error("No active project ID found.");
      }

      const response = await fetch(`http://localhost:8000/api/projects/${targetProjectId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(csrftoken ? { 'X-CSRFToken': csrftoken } : {})
        },
        credentials: 'include',
        body: JSON.stringify({
          name: projectName,
          user_tasks: updatedTasks,
          userTasks: updatedTasks
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }

      if (onSaveTasks) {
        await onSaveTasks(updatedTasks);
      }
      if (onProjectUpdated) {
        onProjectUpdated();
      }

      alert('Task deleted successfully!');
    } catch (err) {
      console.error('Error deleting task:', err);
      alert('Failed to delete task: ' + (err.message || err));
    }
  };

  const scrollToAddTask = () => {
    if (!userCanManageTasks) return;
    setTaskToEdit(null);
    setTaskTitle('');
    setTaskDescription('');
    document.getElementById('add-task-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const userTasksData = getParsedTasks();
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
  
  let filteredUserKeys = selectedUserFilter === 'All' 
    ? userKeys 
    : userKeys.filter(uname => uname === selectedUserFilter);

  if (showOnlyMyTasks) {
    filteredUserKeys = filteredUserKeys.filter(uname => 
      uname.toLowerCase() === currentUsername.toLowerCase()
    );
  }

  const assignedList = editForm.assignedUsers;

  return (
    <div className="dash-panel" style={{ background: '#fff', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#1e293b' }}>Project Management: {projectName}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
              Logged in as: <strong>{currentUsername}</strong> 
              {isUserOne ? (
                <span style={{ marginLeft: '8px', background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>User ID 1 (Full Access)</span>
              ) : userCanManageTasks ? (
                <span style={{ marginLeft: '8px', background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>Assigned Member</span>
              ) : (
                <span style={{ marginLeft: '8px', background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>View-Only</span>
              )}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {userCanManageTasks && (
            <button 
              type="button" 
              className="btn-primary" 
              onClick={scrollToAddTask}
              style={{ padding: '8px 16px', fontSize: '13px', cursor: 'pointer' }}
            >
              + Add Task
            </button>
          )}
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

      {/* 1. READ PROJECT DETAILS */}
      <ReadProject 
        project={project} 
        assignedList={assignedList} 
        getUserDisplayInfo={getUserDisplayInfo} 
      />

      {/* 2. VIEW USER TASKS */}
      <UsersTask 
        userCanManageTasks={userCanManageTasks}
        showOnlyMyTasks={showOnlyMyTasks}
        setShowOnlyMyTasks={setShowOnlyMyTasks}
        scrollToAddTask={scrollToAddTask}
        selectedUserFilter={selectedUserFilter}
        setSelectedUserFilter={setSelectedUserFilter}
        userKeys={userKeys}
        getUserDisplayInfo={getUserDisplayInfo}
        filteredUserKeys={filteredUserKeys}
        normalizedTasks={normalizedTasks}
        currentUsername={currentUsername}
        isUserOne={isUserOne}
        handleStartEditTask={handleStartEditTask}
        handleDeleteTask={handleDeleteTask}
      />

      {/* 3. EDIT PROJECT (User ID 1 Only) */}
      <UpdateProject 
        isUserOne={isUserOne}
        editForm={editForm}
        setEditForm={setEditForm}
        handleSaveEdit={handleSaveEdit}
        savingEdit={savingEdit}
        users={users}
        getUserDisplayInfo={getUserDisplayInfo}
        getDynamicStatus={getDynamicStatus}
      />

      {/* 4. ADD / EDIT TASKS */}
      <AddTasks 
        userCanManageTasks={userCanManageTasks}
        taskToEdit={taskToEdit}
        setTaskToEdit={setTaskToEdit}
        setTaskTitle={setTaskTitle}
        setTaskDescription={setTaskDescription}
        handleTaskFormSubmit={handleTaskFormSubmit}
        taskTitle={taskTitle}
        taskDescription={taskDescription}
        taskLoading={taskLoading}
        currentUsername={currentUsername}
      />

    </div>
  );
}