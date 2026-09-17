import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import CreateProject from './CreateProject';
import UpdateProject from './UpdateProject';
import ReadProject from './ReadProject';
import DeleteProject from './DeleteProject';
import UserManagement from './UserManagement';
import UserProfile from './UserProfile';
import './dashboard.css';
import logo from '../assets/logo.png';

function getDynamicStatus(startDate, endDate) {
  if (!endDate) return 'Ongoing';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  if (isNaN(end.getTime())) return 'Ongoing';
  end.setHours(0, 0, 0, 0);
  return end < today ? 'Completed' : 'Ongoing';
}

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const storedUser = JSON.parse(localStorage.getItem('user')) || {
    username: 'admin',
    role: 'super_admin',
    is_superuser: true
  };

  const [user, setUser] = useState(storedUser);
  const [activeTab, setActiveTab] = useState('home');
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [selectedProjectForEdit, setSelectedProjectForEdit] = useState(null);
  const [selectedProjectForRead, setSelectedProjectForRead] = useState(null);
  const [selectedProjectForDelete, setSelectedProjectForDelete] = useState(null);
  const [projectsCount, setProjectsCount] = useState(0);
  const [usersCount, setUsersCount] = useState(0);

  const dropdownRef = useRef(null);

  // Sync activeTab with browser URL path changes
  useEffect(() => {
    if (location.pathname === '/dashboard/projects/ongoing') {
      setActiveTab('ongoing-projects');
    } else if (location.pathname === '/dashboard/projects/all') {
      setActiveTab('all-projects');
    } else if (location.pathname === '/dashboard/projects') {
      setActiveTab('project-management');
    }
  }, [location.pathname]);

  // Fetch live counts from backend database when navigating tabs or loading
  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('user'));
    if (currentUser) {
      setUser(currentUser);
    }

    const fetchDashboardCounts = async () => {
      try {
        const headers = { 'Content-Type': 'application/json' };

        // Fetch projects from database and count ongoing ones
        const projRes = await fetch('http://localhost:8000/api/projects/', { credentials: 'include', headers });
        if (projRes.ok) {
          const data = await projRes.json();
          const projList = Array.isArray(data) ? data : (data.results || data.data || []);
          const ongoingList = projList.filter(p => {
            const startDate = p.startDate || p.start_date || '';
            const endDate = p.endDate || p.end_date || '';
            return getDynamicStatus(startDate, endDate) === 'Ongoing';
          });
          setProjectsCount(ongoingList.length);
        }

        // Fetch users from database
        const usersRes = await fetch('http://localhost:8000/api/users/', { credentials: 'include', headers });
        if (usersRes.ok) {
          const data = await usersRes.json();
          const userList = Array.isArray(data) ? data : (data.results || data.data || []);
          setUsersCount(userList.length);
        }
      } catch (error) {
        console.error('Error fetching database dashboard counts:', error);
      }
    };

    fetchDashboardCounts();
  }, [activeTab, location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProjectsOpen(false);
        setIsPinned(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleBackFromRead = () => {
    const returnTab = sessionStorage.getItem('projectReturnTab');
    if (returnTab === 'ongoing') {
      navigate('/dashboard/projects/ongoing');
    } else {
      navigate('/dashboard/projects/all');
    }
  };

  const isSuperAdmin = user.role === 'super_admin' || user.role === 'superadmin' || user.is_superuser || user.isSuperAdmin === true || user.username === 'superadmin';
  const canCreate = isSuperAdmin || Boolean(user.can_create) || Boolean(user.can_create_project);

  return (
    <div className="dash-container">
      <div className="dash-sidebar">
        <div className="dash-sidebar-header">
          <div className="dash-brand-title">
           <img src={logo} style={{ height: '50px', marginRight: '8px', verticalAlign: 'middle' }} alt="Company Logo" />
            <span style={{ color: '#235778' }}>DEVELOPERs </span>
          </div>
          <div className="dash-logged-in">Logged in: <strong>{user.username}</strong></div>
        </div>

        <div className="dash-sidebar-menu">
          {canCreate && (
            <div 
              className="dash-create-container" 
              onClick={() => setActiveTab('create-project')}
            >
              <button className="dash-create-circle-btn">+</button>
              <span className="dash-create-label">Create</span>
            </div>
          )}

          <button 
            className={`dash-nav-item ${activeTab === 'home' && location.pathname === '/dashboard' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('home');
              navigate('/dashboard');
            }}
          >
            <span className="dash-nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3L3 10.5V21h6v-6h6v6h6V10.5L12 3zm0 2.84l6 4.86V19h-2v-6H8v6H6v-8.3l6-4.86z"/>
                <path d="M10 13h4v6h-4z" opacity="0.3"/>
              </svg>
            </span>
            Home
          </button>

          <div 
            className="dash-dropdown-container"
            ref={dropdownRef}
            onMouseEnter={() => setIsProjectsOpen(true)}
            onMouseLeave={() => {
              if (!isPinned) {
                setIsProjectsOpen(false);
              }
            }}
          >
            <button 
              className={`dash-nav-item ${location.pathname.startsWith('/dashboard/projects') ? 'active' : ''}`}
              onClick={() => {
                if (isPinned) {
                  setIsPinned(false);
                  setIsProjectsOpen(false);
                } else {
                  setIsPinned(true);
                  setIsProjectsOpen(true);
                }
              }}
            >
              <span className="dash-nav-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
                </svg>
              </span>
              Projects
              <span className={`dash-nav-arrow ${isProjectsOpen ? 'open' : ''}`}>▸</span>
            </button>

            {isProjectsOpen && (
              <div className="dash-submenu">
                <button 
                  className={`dash-nav-item dash-sub-item ${location.pathname === '/dashboard/projects/ongoing' ? 'active' : ''}`}
                  onClick={() => {
                    navigate('/dashboard/projects/ongoing');
                    setIsProjectsOpen(false);
                    setIsPinned(false);
                  }}
                >
                  Ongoing Projects
                </button>
                <button 
                  className={`dash-nav-item dash-sub-item ${location.pathname === '/dashboard/projects/all' ? 'active' : ''}`}
                  onClick={() => {
                    navigate('/dashboard/projects/all');
                    setIsProjectsOpen(false);
                    setIsPinned(false);
                  }}
                >
                  All Project
                </button>
                {isSuperAdmin && (
                  <button 
                    className={`dash-nav-item dash-sub-item ${location.pathname === '/dashboard/projects' ? 'active' : ''}`}
                    onClick={() => {
                      navigate('/dashboard/projects');
                      setIsProjectsOpen(false);
                      setIsPinned(false);
                    }}
                  >
                    Project Management
                  </button>
                )}
              </div>
            )}
          </div>

          {isSuperAdmin && (
            <>
              <div className="dash-menu-category">Admin Panel</div>
              <button 
                className={`dash-nav-item ${activeTab === 'user-management' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('user-management');
                  navigate('/dashboard');
                }}
              >
                User Management
              </button>
            </>
          )}
        </div>

        <div className="dash-sidebar-footer">
          <div 
            className="dash-user-pill" 
            onClick={() => {
              setActiveTab('user-profile');
              navigate('/dashboard');
            }}
            title="View Profile"
            style={{ cursor: 'pointer' }}
          >
            👤 {user.username}
          </div>
        </div>
      </div>

      <div className="dash-content-area">
        <div className="dash-main-scroll">
          {['ongoing-projects', 'all-projects', 'project-management'].includes(activeTab) ? (
            <Outlet />
          ) : (
            <>
              {activeTab === 'home' && (
                <div className="dash-cards-grid">
                  <div className="dash-card card-blue" onClick={() => navigate('/dashboard/projects/ongoing')}>
                    <h4 className="dash-card-title">Ongoing Projects</h4>
                    <div className="dash-card-number">{projectsCount}</div>
                  </div>

                  {isSuperAdmin && (
                    <div className="dash-card card-green" onClick={() => { setActiveTab('user-management'); navigate('/dashboard'); }}>
                      <h4 className="dash-card-title">Registered Users</h4>
                      <div className="dash-card-number">{usersCount}</div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'create-project' && <CreateProject onBack={() => navigate('/dashboard/projects/all')} />}
              {activeTab === 'update-project' && <UpdateProject project={selectedProjectForEdit} onBack={() => navigate('/dashboard/projects/all')} />}
              {activeTab === 'read-project' && <ReadProject project={selectedProjectForRead} onBack={handleBackFromRead} />}
              {activeTab === 'delete-project' && <DeleteProject project={selectedProjectForDelete} onBack={() => navigate('/dashboard/projects')} />}
              {activeTab === 'user-management' && isSuperAdmin && <UserManagement />}
              {activeTab === 'user-profile' && <UserProfile user={user} onBack={() => { setActiveTab('home'); navigate('/dashboard'); }} onLogout={handleLogout} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}