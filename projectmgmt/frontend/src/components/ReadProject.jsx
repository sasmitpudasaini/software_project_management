import React, { useState, useEffect } from 'react';
import './usermanagement.css';
import './projects.css';
import './curd.css';

export default function ReadProject({ isOpen, onClose, project, users = [] }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (project && isOpen) {
      setIsVisible(true);
    } else if (isOpen === false || !project) {
      setIsVisible(false);
    }
  }, [project, isOpen]);

  if (!isVisible || !project) return null;

  const handleClose = () => {
    setIsVisible(false);
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  const projectName = project.name || project.projectName || project.title || project.project_name || 'Untitled Project';
  const description = project.description || project.desc || 'No description provided.';
  const startDate = project.startDate || project.start_date || project.start || 'N/A';
  const endDate = project.endDate || project.end_date || project.end || 'N/A';
  
  const getAssignedUsersArray = (proj) => {
    const raw = proj.assigned_users || proj.assignedUsers || proj.users || proj.members || proj.team || [];
    if (Array.isArray(raw)) {
      return raw.map(u => (typeof u === 'object' && u !== null ? (u.username || u.id?.toString() || u.email) : u)).filter(Boolean);
    }
    if (typeof raw === 'string' && raw.trim() !== '') return raw.split(',').map(s => s.trim()).filter(Boolean);
    return [];
  };

  const assignedList = getAssignedUsersArray(project);

  const getUserDisplayInfo = (uname) => {
    const found = Array.isArray(users) ? users.find(u => u.username === uname || u.id?.toString() === uname?.toString() || u.email === uname) : null;
    if (found) {
      const roleKey = found.role || found.userRole || found.designation || '';
      let formattedRole = roleKey === 'frontend' ? 'Frontend Developer' : roleKey === 'backend' ? 'Backend Developer' : roleKey === 'fullstack' ? 'Full Stack Developer' : roleKey ? roleKey.charAt(0).toUpperCase() + roleKey.slice(1) : (found.is_staff || found.is_superuser ? 'Admin' : 'Member');
      return {
        name: found.first_name || found.last_name ? `${found.first_name} ${found.last_name}`.trim() : (found.username || found.email),
        role: formattedRole,
        email: found.email || uname
      };
    }
    return { name: uname, role: '', email: uname };
  };

  return (
    <div 
      className="read-modal-backdrop" 
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="read-modal-card">
        <div className="read-modal-header">
          <h3 className="read-modal-title">Project Details: {projectName}</h3>
          <button type="button" className="read-modal-close-btn" onClick={handleClose}>✕</button>
        </div>
        <div className="read-modal-body">
          <div>
            <label className="detail-label">Description</label>
            <p className="detail-text">{description}</p>
          </div>

          <div className="grid-two-cols">
            <div>
              <label className="detail-label">Start Date</label>
              <p className="detail-text-simple">{startDate}</p>
            </div>
            <div>
              <label className="detail-label">End Date</label>
              <p className="detail-text-simple">{endDate}</p>
            </div>
          </div>

          <div>
            <label className="detail-label">Assigned Team Members</label>
            <div className="team-box-read">
              {assignedList.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {assignedList.map(uname => {
                    const userInfo = getUserDisplayInfo(uname);
                    return (
                      <span key={uname} className="team-badge">
                        <strong>{userInfo.name}</strong> {userInfo.role ? `(${userInfo.role})` : ''}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <p className="no-users-text">No users assigned to this project.</p>
              )}
            </div>
          </div>
        </div>
        <div className="read-modal-footer">
          <button type="button" className="btn-close-read" onClick={handleClose}>Close</button>
        </div>
      </div>
    </div>
  );
}