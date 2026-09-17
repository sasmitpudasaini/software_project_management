import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './auth.css';
import logo from '../assets/logo.png';

export default function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('frontend');

  const handleRegister = async (e) => {
    e.preventDefault();
    
    const newUser = {
      username,
      first_name: firstName,
      last_name: lastName,
      email,
      password,
      role
    };

    try {
      const response = await fetch('http://localhost:8000/api/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });

      if (response.ok) {
        alert('Registration successful. Please wait for admin approval.');
        navigate('/login');
      } else {
        const errorData = await response.json();
        alert('Registration failed: ' + JSON.stringify(errorData));
      }
    } catch (error) {
      console.error('Network error:', error);
      alert('Could not connect to the Django server.');
    }
  };

  return (
    <div className="auth-page-bg">
      <div className="auth-card">
        <div className="dash-brand-title"><img src= {logo} style={{ height: '50px', marginRight: '8px', verticalAlign: 'middle' }} alt="Company Logo" />
                            <span style={{ color: '#235778' }}>DEVELOPERs </span></div>
        <h2 className="auth-title">Create Account</h2>

        <form onSubmit={handleRegister} className="auth-form">
          <div className="auth-field">
            <label className="auth-label">Username</label>
            <input
              type="text"
              className="auth-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">First Name</label>
            <input
              type="text"
              className="auth-input"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">Last Name</label>
            <input
              type="text"
              className="auth-input"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>

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
            <label className="auth-label">Desired Role</label>
            <select
              className="auth-input"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            >
              <option value="frontend">Frontend Developer</option>
              <option value="backend">Backend Developer</option>
              <option value="fullstack">Full Stack Developer</option>
            </select>
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
            Sign Up
          </button>
        </form>

        <p className="auth-footer-text">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">
            Sign in instead
          </Link>
        </p>
      </div>
    </div>
  );
}