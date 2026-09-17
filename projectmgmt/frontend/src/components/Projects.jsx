import React, { useState, useEffect } from 'react';
import './projects.css';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [user, setUser] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');

  useEffect(() => {
    // Load logged-in user from localStorage
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(storedUser);

    // Fetch projects from Django backend database
    fetch('http://localhost:8000/api/projects/')
      .then((res) => res.json())
      .then((data) => setProjects(data))
      .catch((err) => console.error('Error fetching projects:', err));
  }, []);

  // Robust permission check: handles booleans (true/false) and integers (1/0) safely
  const canCreate = user?.is_superuser || (Boolean(user?.can_create_project) && user?.can_create_project !== 0);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8000/api/projects/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: projectName,
          description: projectDesc,
        }),
      });

      if (response.ok) {
        const newProj = await response.json();
        setProjects([...projects, newProj]);
        setIsCreateModalOpen(false);
        setProjectName('');
        setProjectDesc('');
      } else {
        const errData = await response.json();
        alert('Failed to create project: ' + JSON.stringify(errData));
      }
    } catch (err) {
      console.error('Network error:', err);
    }
  };

  return (
    <div className="dash-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ margin: '0 0 5px 0', color: '#1e293b' }}>Software Projects</h3>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
            Manage and track active software development projects.
          </p>
        </div>

        {/* Conditionally render Create button based on robust permission check */}
        {canCreate && (
          <button 
            className="btn-primary" 
            onClick={() => setIsCreateModalOpen(true)}
          >
            + Create Project
          </button>
        )}
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>PROJECT NAME</th>
              <th>DESCRIPTION</th>
            </tr>
          </thead>
          <tbody>
            {projects.length > 0 ? (
              projects.map((p) => (
                <tr key={p.id}>
                  <td><strong>{p.name}</strong></td>
                  <td style={{ color: '#475569' }}>{p.description}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="2" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  No projects found in the database.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Project Modal */}
      {isCreateModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3 className="modal-title">Create New Project</h3>
              <button className="modal-close-btn" onClick={() => setIsCreateModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateProject} className="modal-body">
              <div className="auth-field" style={{ marginBottom: '15px' }}>
                <label className="auth-label">Project Name</label>
                <input
                  type="text"
                  className="auth-input"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  required
                />
              </div>

              <div className="auth-field" style={{ marginBottom: '20px' }}>
                <label className="auth-label">Description</label>
                <textarea
                  className="auth-input"
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                  rows="3"
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}