import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

const formatTime = (time) => {
  if (!time) return '';
  return time.substring(0, 5); // Takes only HH:MM from HH:MM:SS
};

const calculateDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return 0;
  
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  let hours = endHour - startHour;
  let minutes = endMinute - startMinute;
  
  if (minutes < 0) {
    hours -= 1;
    minutes += 60;
  }
  
  return Number((hours + minutes / 60).toFixed(2));
};

function TimeEntriesTable({ refreshTrigger }) {
  const [entries, setEntries] = useState([]);
  const [filters, setFilters] = useState({
    project: '',
    startDate: '',
    endDate: '',
    dateFilterType: 'specific',
    sortColumn: 'date',
    sortDirection: 'desc'
  });
  const [editingEntry, setEditingEntry] = useState(null);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [isTableOpen, setIsTableOpen] = useState(true);

  useEffect(() => {
    fetchTimeEntries();
    fetchProjects();
  }, [refreshTrigger]);

  async function fetchTimeEntries() {
    const { data, error } = await supabase
      .from('time_entries')
      .select(`
        *,
        tasks (
          id,
          name,
          project_id,
          projects (
            id,
            name,
            status
          )
        )
      `)
      .order('work_date', { ascending: false });

    if (error) {
      console.error('Error fetching time entries:', error);
    } else {
      setEntries(data);
    }
  }

  async function fetchProjects() {
    const { data: timeEntryData, error: timeEntryError } = await supabase
      .from('time_entries')
      .select('tasks(project_id)')
      .not('tasks', 'is', null);

    if (timeEntryError) {
      console.error('Error fetching time entry projects:', timeEntryError);
      return;
    }

    const projectIds = [...new Set(timeEntryData
      .map(entry => entry.tasks?.project_id)
      .filter(id => id != null))];

    const { data: projectsData, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .in('id', projectIds)
      .order('name');

    if (projectsError) {
      console.error('Error fetching projects:', projectsError);
    } else {
      setProjects(projectsData);
    }
  }

  async function handleUpdateEntry(entry) {
    const { error } = await supabase
      .from('time_entries')
      .update({
        duration: entry.duration,
        description: entry.description,
        start_time: entry.start_time,
        end_time: entry.end_time,
        work_date: entry.work_date
      })
      .eq('id', entry.id);

    if (error) {
      console.error('Error updating entry:', error);
    } else {
      setEditingEntry(null);
      fetchTimeEntries();
    }
  }

  const handleColumnSort = (column) => {
    setFilters(prev => ({
      ...prev,
      sortColumn: column,
      sortDirection: prev.sortColumn === column && prev.sortDirection === 'asc' ? 'desc' : 'asc'
    }));
  };

  const filteredEntries = entries
    .filter(entry => {
      const matchesProject = !filters.project || entry.tasks?.projects?.id === filters.project;
      
      // Date filtering
      let matchesDate = true;
      if (filters.dateFilterType === 'specific' && filters.startDate) {
        matchesDate = entry.work_date === filters.startDate;
      } else if (filters.dateFilterType === 'range' && (filters.startDate || filters.endDate)) {
        if (filters.startDate && filters.endDate) {
          matchesDate = entry.work_date >= filters.startDate && entry.work_date <= filters.endDate;
        } else if (filters.startDate) {
          matchesDate = entry.work_date >= filters.startDate;
        } else if (filters.endDate) {
          matchesDate = entry.work_date <= filters.endDate;
        }
      }

      return matchesProject && matchesDate;
    })
    .sort((a, b) => {
      if (!filters.sortColumn) {
        const dateComparison = a.work_date > b.work_date ? 1 : a.work_date < b.work_date ? -1 : 0;
        if (dateComparison === 0) {
          return a.start_time > b.start_time ? 1 : -1;
        }
        return dateComparison;
      }

      let aValue, bValue;
      switch (filters.sortColumn) {
        case 'date':
          if (a.work_date === b.work_date) {
            aValue = a.start_time;
            bValue = b.start_time;
          } else {
            aValue = a.work_date;
            bValue = b.work_date;
          }
          break;
        case 'project':
          aValue = a.tasks?.projects?.name || '';
          bValue = b.tasks?.projects?.name || '';
          break;
        case 'task':
          aValue = a.tasks?.name || '';
          bValue = b.tasks?.name || '';
          break;
        case 'start':
          aValue = a.start_time;
          bValue = b.start_time;
          break;
        case 'end':
          aValue = a.end_time;
          bValue = b.end_time;
          break;
        case 'duration':
          aValue = Number(a.duration);
          bValue = Number(b.duration);
          break;
        case 'description':
          aValue = a.description || '';
          bValue = b.description || '';
          break;
        default:
          return 0;
      }

      if (filters.sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const calculateTotalHours = (entries) => {
    return entries.reduce((total, entry) => total + Number(entry.duration), 0);
  };

  return (
    <div className="time-entries-table">
      <div className="card-header" onClick={() => setIsTableOpen(!isTableOpen)}>
        <h2>Time Entries</h2>
        <button className="collapse-btn">
          {isTableOpen ? '▼' : '▶'}
        </button>
      </div>

      {isTableOpen && (
        <div className="table-content">
          <div className="table-filters">
            <div className="filter-group">
              <label>Project</label>
              <select
                value={filters.project}
                onChange={(e) => setFilters({ ...filters, project: e.target.value })}
              >
                <option value="">All Projects</option>
                {projects.map(project => (
                  <option 
                    key={project.id} 
                    value={project.id}
                  >
                    {project.name} {project.status === 'closed' ? '(Closed)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Date Filter Type</label>
              <select
                value={filters.dateFilterType}
                onChange={(e) => setFilters({ 
                  ...filters, 
                  dateFilterType: e.target.value,
                  startDate: '',
                  endDate: ''
                })}
              >
                <option value="specific">Specific Date</option>
                <option value="range">Date Range</option>
              </select>
            </div>

            {filters.dateFilterType === 'specific' ? (
              <div className="filter-group">
                <label>Date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ 
                    ...filters, 
                    startDate: e.target.value,
                    endDate: ''
                  })}
                />
              </div>
            ) : (
              <div className="date-range-filters">
                <div className="filter-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ 
                      ...filters, 
                      startDate: e.target.value 
                    })}
                  />
                </div>
                <div className="filter-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ 
                      ...filters, 
                      endDate: e.target.value 
                    })}
                    min={filters.startDate} // Can't select end date before start date
                  />
                </div>
              </div>
            )}

            <div className="filter-group">
              <button 
                className="clear-filters-btn"
                onClick={() => setFilters({
                  project: '',
                  startDate: '',
                  endDate: '',
                  dateFilterType: 'specific'
                })}
              >
                Clear Filters
              </button>
            </div>
          </div>

          <table style={{ fontSize: '12px' }}>
            <thead>
              <tr>
                <th style={{ fontSize: '12px' }} 
                  onClick={() => handleColumnSort('date')}
                  className={filters.sortColumn === 'date' ? 'sorted' : ''}
                >
                  Date {filters.sortColumn === 'date' && (filters.sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{ fontSize: '12px' }} 
                  onClick={() => handleColumnSort('project')}
                  className={filters.sortColumn === 'project' ? 'sorted' : ''}
                >
                  Project {filters.sortColumn === 'project' && (filters.sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{ fontSize: '12px' }} 
                  onClick={() => handleColumnSort('task')}
                  className={filters.sortColumn === 'task' ? 'sorted' : ''}
                >
                  Task {filters.sortColumn === 'task' && (filters.sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{ fontSize: '12px' }} 
                  onClick={() => handleColumnSort('start')}
                  className={filters.sortColumn === 'start' ? 'sorted' : ''}
                >
                  Start {filters.sortColumn === 'start' && (filters.sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{ fontSize: '12px' }} 
                  onClick={() => handleColumnSort('end')}
                  className={filters.sortColumn === 'end' ? 'sorted' : ''}
                >
                  End {filters.sortColumn === 'end' && (filters.sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{ fontSize: '12px' }} 
                  onClick={() => handleColumnSort('duration')}
                  className={filters.sortColumn === 'duration' ? 'sorted' : ''}
                >
                  Duration {filters.sortColumn === 'duration' && (filters.sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{ fontSize: '12px' }} 
                  onClick={() => handleColumnSort('description')}
                  className={filters.sortColumn === 'description' ? 'sorted' : ''}
                >
                  Description {filters.sortColumn === 'description' && (filters.sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map(entry => (
                <tr key={entry.id}>
                  {editingEntry?.id === entry.id ? (
                    // Edit mode
                    <>
                      <td style={{ fontSize: '12px' }}>
                        <input
                          type="date"
                          value={editingEntry.work_date}
                          onChange={(e) => setEditingEntry({
                            ...editingEntry,
                            work_date: e.target.value
                          })}
                        />
                      </td>
                      <td style={{ fontSize: '12px' }}>{entry.tasks?.projects?.name}</td>
                      <td style={{ fontSize: '12px' }}>{entry.tasks?.name}</td>
                      <td style={{ fontSize: '12px' }}>
                        <input
                          type="time"
                          value={editingEntry.start_time}
                          onChange={(e) => setEditingEntry({
                            ...editingEntry,
                            start_time: e.target.value,
                            duration: calculateDuration(e.target.value, editingEntry.end_time)
                          })}
                        />
                      </td>
                      <td style={{ fontSize: '12px' }}>
                        <input
                          type="time"
                          value={editingEntry.end_time}
                          onChange={(e) => setEditingEntry({
                            ...editingEntry,
                            end_time: e.target.value,
                            duration: calculateDuration(editingEntry.start_time, e.target.value)
                          })}
                        />
                      </td>
                      <td style={{ fontSize: '12px' }}>
                        <input
                          type="number"
                          step="0.25"
                          value={editingEntry.duration}
                          readOnly
                        />
                      </td>
                      <td style={{ fontSize: '12px' }}>
                        <textarea
                          value={editingEntry.description}
                          onChange={(e) => setEditingEntry({
                            ...editingEntry,
                            description: e.target.value
                          })}
                          rows="3"
                          style={{
                            width: "100%",
                            minWidth: "200px",
                            resize: "vertical",
                            whiteSpace: "pre-wrap"
                          }}
                        />
                      </td>
                      <td style={{ fontSize: '12px' }}>
                        <button onClick={() => handleUpdateEntry(editingEntry)}>Save</button>
                        <button onClick={() => setEditingEntry(null)}>Cancel</button>
                      </td>
                    </>
                  ) : (
                    // View mode
                    <>
                      <td style={{ fontSize: '12px' }}>{entry.work_date}</td>
                      <td style={{ fontSize: '12px' }}>{entry.tasks?.projects?.name}</td>
                      <td style={{ fontSize: '12px' }}>{entry.tasks?.name}</td>
                      <td style={{ fontSize: '12px' }}>{formatTime(entry.start_time)}</td>
                      <td style={{ fontSize: '12px' }}>{formatTime(entry.end_time)}</td>
                      <td style={{ fontSize: '12px' }}>{Number(entry.duration).toFixed(2)}</td>
                      <td style={{ fontSize: '12px', whiteSpace: 'pre-wrap' }}>{entry.description}</td>
                      <td style={{ fontSize: '12px' }}>
                        <button onClick={() => setEditingEntry(entry)}>Edit</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="5" style={{ textAlign: 'right', fontWeight: 'bold' }}>
                  Totals ({filteredEntries.length} entries):
                </td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                  {calculateTotalHours(filteredEntries).toFixed(2)}
                </td>
                <td></td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

export default TimeEntriesTable;
