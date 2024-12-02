import React, { useState } from 'react'
import TimeEntry from './components/TimeEntry'
import JobTracking from './components/JobTracking'
import Finance from './components/Finance'
import './styles/Dashboard.css'
import { launchTimeTracker } from './utils/electronLauncher.js';

function App() {
  const [isNavOpen, setIsNavOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');

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
  );
}

export default App
