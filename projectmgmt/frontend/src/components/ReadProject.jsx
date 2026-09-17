import React, { useState, useEffect } from 'react';
import './usermanagement.css';
import './projects.css';

export default function ReadProject({ isOpen, onClose, project, users = [] }) {
  const [isVisible, setIsVisible] = useState(false);

  // Synchronize local visibility when project or isOpen props change
  useEffect(() => {
    if (project && isOpen) {
      setIsVisible(true);
    } else if (isOpen === false || !project) {
      setIsVisible(false);
    }
  }, [project, isOpen]);

  // If not visible or no project, render nothing (safely staying on the current page)
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
      className="modal-backdrop" 
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000 }}
    >
      <div className="modal-card" style={{ maxWidth: '550px', width: '100%', background: '#ffffff', borderRadius: '8px', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
          <h3 className="modal-title" style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b' }}>Project Details: {projectName}</h3>
          <button type="button" className="modal-close-btn" onClick={handleClose} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '15px 0' }}>
          <div>
            <label className="form-label" style={{ fontWeight: 'bold', color: '#64748b', display: 'block', fontSize: '0.85rem' }}>Description</label>
            <p style={{ margin: '4px 0 0 0', color: '#334155', lineHeight: '1.5' }}>{description}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label className="form-label" style={{ fontWeight: 'bold', color: '#64748b', display: 'block', fontSize: '0.85rem' }}>Start Date</label>
              <p style={{ margin: '4px 0 0 0', color: '#334155' }}>{startDate}</p>
            </div>
            <div>
              <label className="form-label" style={{ fontWeight: 'bold', color: '#64748b', display: 'block', fontSize: '0.85rem' }}>End Date</label>
              <p style={{ margin: '4px 0 0 0', color: '#334155' }}>{endDate}</p>
            </div>
          </div>

          <div>
            <label className="form-label" style={{ fontWeight: 'bold', color: '#64748b', display: 'block', fontSize: '0.85rem' }}>Assigned Team Members</label>
            <div style={{ marginTop: '6px', maxHeight: '150px', overflowY: 'auto', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px', background: '#f8fafc' }}>
              {assignedList.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {assignedList.map(uname => {
                    const userInfo = getUserDisplayInfo(uname);
                    return (
                      <span key={uname} style={{ display: 'inline-block', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '4px 12px', fontSize: '0.85rem', color: '#334155' }}>
                        <strong>{userInfo.name}</strong> {userInfo.role ? `(${userInfo.role})` : ''}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>No users assigned to this project.</p>
              )}
            </div>
          </div>
        </div>
        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
          <button type="button" className="btn-secondary" onClick={handleClose} style={{ padding: '6px 14px', background: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Close</button>
        </div>
      </div>
    </div>
  );
}