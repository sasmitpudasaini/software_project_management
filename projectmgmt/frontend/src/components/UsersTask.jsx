import React from 'react';

export default function UsersTask({
  userCanManageTasks,
  showOnlyMyTasks,
  setShowOnlyMyTasks,
  scrollToAddTask,
  selectedUserFilter,
  setSelectedUserFilter,
  userKeys,
  getUserDisplayInfo,
  filteredUserKeys,
  normalizedTasks,
  currentUsername,
  isUserOne,
  handleStartEditTask,
  handleDeleteTask
}) {
  if (!userCanManageTasks) return null;

  return (
    <div style={{ marginBottom: '32px', background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #cbd5e1', paddingBottom: '8px', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b' }}>📋 View User Tasks</h3>
          <p style={{ fontSize: '12px', color: '#666', margin: '2px 0 0 0' }}>Tasks created by members on this project.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setShowOnlyMyTasks(!showOnlyMyTasks)}
            style={{
              background: showOnlyMyTasks 
                ? 'linear-gradient(135deg, #059669, #10b981)' 
                : 'linear-gradient(135deg, #4f46e5, #6366f1)',
              color: '#ffffff',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '8px',
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: '700',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {showOnlyMyTasks ? '✨ Editing My Tasks (Active)' : '✏ Edit My Tasks'}
          </button>

          <button 
            type="button" 
            className="btn-primary" 
            onClick={scrollToAddTask}
            style={{ padding: '10px 16px', fontSize: '13px', cursor: 'pointer', fontWeight: '600' }}
          >
            + Add Task
          </button>
        </div>
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
                    
                    const taskCreator = (task.task_created_by || uname || '').toString().trim().toLowerCase();
                    const currUser = (currentUsername || '').toString().trim().toLowerCase();
                    const canManage = showOnlyMyTasks && ((taskCreator && currUser && taskCreator === currUser) || isUserOne);

                    return (
                      <div key={task.id || tIndex} style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                          <div>
                            <strong style={{ fontSize: '13px', color: '#0f172a' }}>
                              {taskNumberLabel}: {taskTitle}
                            </strong>
                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500', marginTop: '2px' }}>
                              Created By: {uname}
                            </div>
                          </div>

                          {canManage && (
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                type="button"
                                onClick={() => handleStartEditTask(task)}
                                style={{
                                  background: '#2563eb',
                                  color: '#fff',
                                  border: 'none',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  fontSize: '0.75rem',
                                  cursor: 'pointer',
                                  fontWeight: '600'
                                }}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteTask(task)}
                                style={{
                                  background: '#dc2626',
                                  color: '#fff',
                                  border: 'none',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  fontSize: '0.75rem',
                                  cursor: 'pointer',
                                  fontWeight: '600'
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          )}
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
            <p style={{ margin: 0, fontSize: '13px' }}>
              {showOnlyMyTasks ? `No tasks found created by "${currentUsername}".` : 'No tasks found for this project yet.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}