import React, { useState } from 'react';
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

export default function DeleteProject({ isOpen, onClose, onSuccess, project }) {
  const [deleting, setDeleting] = useState(false);

  if (!isOpen || !project) return null;

  const projectName = project.name || project.projectName || project.title || project.project_name || 'this project';

  const handleDeleteProject = async () => {
    setDeleting(true);
    try {
      const projectId = project.id || project._id || project.pk;
      const csrftoken = getCookie('csrftoken');
      const response = await fetch(`http://localhost:8000/api/projects/${projectId}/`, {
        method: 'DELETE',
        headers: {
          ...(csrftoken ? { 'X-CSRFToken': csrftoken } : {})
        },
        credentials: 'include'
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert('Failed to delete project: ' + JSON.stringify(errorData));
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Network error while deleting project.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card delete-modal-card">
        <div className="modal-header">
          <h3 className="modal-title delete-title-color">Delete Project</h3>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <p className="delete-text-msg">
            Are you sure you want to delete <strong>{projectName}</strong>? This action cannot be undone.
          </p>
          <div className="modal-footer delete-footer-margin">
            <button type="button" className="btn-secondary" disabled={deleting} onClick={onClose}>Cancel</button>
            <button 
              type="button" 
              className="btn-danger"
              disabled={deleting}
              onClick={handleDeleteProject}
            >
              {deleting ? 'Deleting...' : 'Confirm Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}