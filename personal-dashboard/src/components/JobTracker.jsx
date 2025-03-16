const calculateDaysUnemployed = () => {
  const startDate = new Date('2024-05-01');
  const endDate = new Date('2025-03-05');
  
  const timeDiff = endDate.getTime() - startDate.getTime();
  const totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
  return totalDays;
};

return (
  <div className="job-tracker">
    <div className="summary-row">
      <div className="summary-card">
        <h3>Days Unemployed</h3>
        <p>309</p>
        <small>Total days: May 1st, 2024 - March 5th, 2025</small>
      </div>
      {/* ... other summary cards ... */}
    </div>
    {/* ... rest of the JSX ... */}
  </div>
); 