import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './auth.css';
import logo from '../assets/logo.png';
export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:8000/api/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('user', JSON.stringify(data));
        alert('Login successful!');
        navigate('/dashboard');
      } else {
        const errorMsg = data.non_field_errors?.[0] || data.detail || JSON.stringify(data);
        alert('Login failed: ' + errorMsg);
      }
    } catch (error) {
      console.error('Network error:', error);
      alert('Could not connect to the Django server. Make sure python manage.py runserver is running.');
    }
  };

  return (
    <div className="auth-page-bg">
      <div className="auth-card">
        <div className="dash-brand-title"><img src= {logo} style={{ height: '50px', marginRight: '8px', verticalAlign: 'middle' }} alt="Company Logo" />
                    <span style={{ color: '#235778' }}>DEVELOPERs </span></div>
        <h2 className="auth-title">Project Management Sign In</h2>

        <form onSubmit={handleLogin} className="auth-form">
          <div className="auth-field">
            <label className="auth-label">Email Address</label>
            <input
              type="email"
              className="auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">Password</label>
            <input
              type="password"
              className="auth-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="auth-submit-btn">
            Log In
          </button>
        </form>

        <p className="auth-footer-text">
          New to the platform?{' '}
          <Link to="/register" className="auth-link">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}