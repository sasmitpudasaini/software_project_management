import React from 'react';

export default function ReadProject({ project, assignedList, getUserDisplayInfo }) {
  if (!project) return null;

  return (
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
  );
}