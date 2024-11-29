import React, { useState, useCallback } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import ProjectTaskManager from './ProjectTaskManager';
import TimeEntry from './TimeEntry';
import TimeEntriesTable from './TimeEntriesTable';
import Finance from './Finance';

function Dashboard() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = useCallback(() => {
    console.log('Global refresh triggered');
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <Link to="/" className="nav-link">Time Tracking</Link>
        <Link to="/finance" className="nav-link">Finance</Link>
      </nav>

      <Routes>
        <Route path="/" element={
          <>
            <ProjectTaskManager 
              refreshTrigger={refreshTrigger} 
              onUpdate={triggerRefresh} 
            />
            <TimeEntry 
              refreshTrigger={refreshTrigger} 
            />
            <TimeEntriesTable 
              refreshTrigger={refreshTrigger} 
            />
          </>
        } />
        <Route path="/finance" element={<Finance />} />
      </Routes>
    </div>
  );
}

export default Dashboard; 