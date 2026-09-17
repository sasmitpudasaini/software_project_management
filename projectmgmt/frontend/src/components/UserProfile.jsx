import React from 'react';

export default function UserProfile({ user, onBack, onLogout }) {
  return (
    <div className="dash-panel" style={{ background: '#ffffff', padding: '32px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <button 
          onClick={onBack} 
          style={{ background: 'none', border: 'none', color: '#0284c7', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          ← Back to Dashboard
        </button>
        <button 
          onClick={onLogout}
          style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', transition: 'background 0.2s' }}
        >
          Logout
        </button>
      </div>

      <h2 style={{ margin: '0 0 20px 0', color: '#1e293b', fontSize: '1.5rem' }}>User Profile</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', color: '#334155', fontSize: '0.95rem', background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <div><strong>Username:</strong> {user.username}</div>
        <div><strong>Role:</strong> {user.role || (user.is_superuser ? 'Super Admin' : 'User')}</div>
        <div><strong>Email:</strong> {user.email || 'N/A'}</div>
      </div>
    </div>
  );
}