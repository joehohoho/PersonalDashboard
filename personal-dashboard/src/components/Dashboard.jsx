import React, { useState, useCallback } from 'react';
import ProjectTaskManager from './ProjectTaskManager';
import TimeEntry from './TimeEntry';
import TimeEntriesTable from './TimeEntriesTable';

function Dashboard() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = useCallback(() => {
    console.log('Global refresh triggered');
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return (
    <div className="dashboard">
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
    </div>
  );
}

export default Dashboard; 