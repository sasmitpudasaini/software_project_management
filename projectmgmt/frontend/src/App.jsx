import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import ProjectManagement from './components/ProjectManagement';
import AllProjects from './components/AllProjects';
import OngoingProjects from './components/OngoingProjects';

export default function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Dashboard route with nested project routes to keep sidebar visible */}
                <Route path="/dashboard" element={<Dashboard />}>
                    <Route path="projects" element={<ProjectManagement />} />
                    <Route path="projects/all" element={<AllProjects />} />
                    <Route path="projects/ongoing" element={<OngoingProjects />} />
                </Route>

                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </Router>
    );
}