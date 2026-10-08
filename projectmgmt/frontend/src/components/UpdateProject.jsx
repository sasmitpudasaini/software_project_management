import React from 'react';

export default function UpdateProject({
  isUserOne,
  editForm,
  setEditForm,
  handleSaveEdit,
  savingEdit,
  users,
  getUserDisplayInfo,
  getDynamicStatus
}) {
  if (!isUserOne) return null;

  return (
    <div style={{ marginBottom: '32px', background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: '#1e293b', borderBottom: '1px solid #cbd5e1', paddingBottom: '8px' }}>
        ✏️ Edit Project (User ID 1 Only)
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

        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px' }}>
          <button type="submit" className="btn-primary" disabled={savingEdit} style={{ padding: '8px 16px', fontSize: '13px', cursor: 'pointer' }}>
            {savingEdit ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}