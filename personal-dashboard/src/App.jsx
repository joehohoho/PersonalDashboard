import React, { useState } from 'react'
import './styles/Dashboard.css'

function App() {
  const [isNavOpen, setIsNavOpen] = useState(true);

  return (
    <div className="app-container">
      <nav className={`sidebar ${!isNavOpen ? 'collapsed' : ''}`}>
        <div className="logo">
          <span>Personal Dashboard</span>
        </div>
        
        <div className="nav-links">
          <a href="#" className="nav-item active">
            <span className="nav-icon">📊</span>
            <span className="nav-text">Dashboard</span>
          </a>
          <a href="#" className="nav-item">
            <span className="nav-icon">💰</span>
            <span className="nav-text">Finances</span>
          </a>
          <a href="#" className="nav-item">
            <span className="nav-icon">⏱️</span>
            <span className="nav-text">Time Entry</span>
          </a>
          <a href="#" className="nav-item">
            <span className="nav-icon">🎯</span>
            <span className="nav-text">Job Tracking</span>
          </a>
        </div>

        <div className="nav-section-title">SETTINGS</div>
        <div className="nav-links">
          <a href="#" className="nav-item">
            <span className="nav-icon">⚙️</span>
            <span className="nav-text">Settings</span>
          </a>
          <a href="#" className="nav-item">
            <span className="nav-icon">👤</span>
            <span className="nav-text">Profile</span>
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
      </main>
    </div>
  );
}

export default App
