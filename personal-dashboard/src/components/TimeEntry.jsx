import React from 'react';

function TimeEntry() {
  return (
    <div className="dashboard">
      <div className="top-stats">
        <div className="stat-card">
          <span className="stat-label">Today's Hours</span>
          <div className="stat-value">
            <span>4.5 hrs</span>
            <span className="trend positive">+2 hrs</span>
          </div>
        </div>
      </div>

      <div className="time-entry-grid">
        <div className="entry-card">
          <h2>Add Time Entry</h2>
          <form className="entry-form">
            <div className="form-group">
              <label>Project</label>
              <select>
                <option>Select Project</option>
                <option>Project A</option>
                <option>Project B</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Duration</label>
              <input type="number" step="0.5" placeholder="Hours" />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea placeholder="What did you work on?"></textarea>
            </div>

            <button type="submit" className="submit-btn">Add Entry</button>
          </form>
        </div>

        <div className="entry-card">
          <h2>Recent Entries</h2>
          <div className="entries-list">
            <div className="entry-item">
              <div className="entry-header">
                <span className="project-name">Project A</span>
                <span className="entry-time">2.5 hrs</span>
              </div>
              <p className="entry-desc">Worked on dashboard implementation</p>
              <span className="entry-date">Today at 2:30 PM</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TimeEntry;
