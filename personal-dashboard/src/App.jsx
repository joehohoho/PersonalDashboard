import React, { useState, useEffect } from 'react'
import TimeEntry from './components/TimeEntry'
import JobTracking from './components/JobTracking'
import Finance from './components/Finance'
import './styles/Dashboard.css'
import { launchTimeTracker } from './utils/electronLauncher.js';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { supabase } from './supabaseClient';

function App() {
  const [isNavOpen, setIsNavOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  console.log('App: Rendering with session:', session);

  const renderPage = () => {
    switch(currentPage) {
      case 'timeEntry':
        return <TimeEntry />;
      case 'jobTracking':
        return <JobTracking />;
      case 'finance':
        return <Finance />;
      default:
        return (
          <div className="dashboard">
            <div className="top-stats">
              <div className="stat-card">
                <span className="stat-label">Today's Money</span>
                <div className="stat-value">
                  <span>$53,000</span>
                  <span className="trend positive">+55%</span>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  const handleTimeTrackerLaunch = (e) => {
    e.preventDefault();
    console.log('Time Tracker button clicked');
    try {
      launchTimeTracker();
    } catch (error) {
      console.error('Error launching Time Tracker:', error);
    }
  };

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={
            session ? (
              <Navigate to="/" replace />
            ) : (
              <Login />
            )
          } 
        />
        <Route
          path="/"
          element={
            session ? (
              <div className="app-container">
                <nav className={`sidebar ${!isNavOpen ? 'collapsed' : ''}`}>
                  <div className="logo">
                    <span>Personal Dashboard</span>
                  </div>
                  
                  <div className="nav-links">
                    <a 
                      href="#" 
                      className={`nav-item ${currentPage === 'dashboard' ? 'active' : ''}`}
                      onClick={() => setCurrentPage('dashboard')}
                    >
                      <span className="nav-icon">📊</span>
                      <span className="nav-text">Dashboard</span>
                    </a>
                    <a 
                      href="#" 
                      className={`nav-item ${currentPage === 'finance' ? 'active' : ''}`}
                      onClick={() => setCurrentPage('finance')}
                    >
                      <span className="nav-icon">💰</span>
                      <span className="nav-text">Finances</span>
                    </a>
                    <a 
                      href="#" 
                      className={`nav-item ${currentPage === 'timeEntry' ? 'active' : ''}`}
                      onClick={() => setCurrentPage('timeEntry')}
                    >
                      <span className="nav-icon">⏱</span>
                      <span className="nav-text">Time Entry</span>
                    </a>
                    <a 
                      href="#" 
                      className={`nav-item ${currentPage === 'jobTracking' ? 'active' : ''}`}
                      onClick={() => setCurrentPage('jobTracking')}
                    >
                      <span className="nav-icon">🎯</span>
                      <span className="nav-text">Job Tracking</span>
                    </a>
                  </div>

                  <div className="nav-section-title">APPS</div>
                  <div className="nav-links">
                    <a 
                      href="#" 
                      className="nav-item"
                      onClick={handleTimeTrackerLaunch}
                    >
                      <span className="nav-icon">⏱️</span>
                      <span className="nav-text">Time Tracker</span>
                    </a>
                  </div>
                </nav>

                <main className={`main-content ${!isNavOpen ? 'expanded' : ''}`}>
                  <button 
                    className="nav-toggle" 
                    onClick={() => setIsNavOpen(!isNavOpen)}
                    aria-label="Toggle navigation"
                  >
                    {isNavOpen ? '◀' : '▶'}
                  </button>
                  
                  {renderPage()}
                </main>
              </div>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App
