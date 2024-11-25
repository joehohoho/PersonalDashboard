import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

function TimeEntriesTable() {
  const [entries, setEntries] = useState([]);
  const [filters, setFilters] = useState({
    project: '',
    task: '',
    date: ''
  });
  const [editingEntry, setEditingEntry] = useState(null);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    fetchTimeEntries();
    fetchProjects();
  }, []);

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
            name
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
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching projects:', error);
    } else {
      setProjects(data);
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

  const filteredEntries = entries.filter(entry => {
    return (
      (!filters.project || entry.tasks?.projects?.id === filters.project) &&
      (!filters.task || entry.task_id === filters.task) &&
      (!filters.date || entry.work_date === filters.date)
    );
  });

  return (
    <div className="time-entries-table">
      <div className="table-filters">
        <div className="filter-group">
          <label>Project</label>
          <select
            value={filters.project}
            onChange={(e) => setFilters({ ...filters, project: e.target.value })}
          >
            <option value="">All Projects</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Date</label>
          <input
            type="date"
            value={filters.date}
            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
          />
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Project</th>
            <th>Task</th>
            <th>Start</th>
            <th>End</th>
            <th>Duration</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredEntries.map(entry => (
            <tr key={entry.id}>
              {editingEntry?.id === entry.id ? (
                // Edit mode
                <>
                  <td>
                    <input
                      type="date"
                      value={editingEntry.work_date}
                      onChange={(e) => setEditingEntry({
                        ...editingEntry,
                        work_date: e.target.value
                      })}
                    />
                  </td>
                  <td>{entry.tasks?.projects?.name}</td>
                  <td>{entry.tasks?.name}</td>
                  <td>
                    <input
                      type="time"
                      value={editingEntry.start_time}
                      onChange={(e) => setEditingEntry({
                        ...editingEntry,
                        start_time: e.target.value
                      })}
                    />
                  </td>
                  <td>
                    <input
                      type="time"
                      value={editingEntry.end_time}
                      onChange={(e) => setEditingEntry({
                        ...editingEntry,
                        end_time: e.target.value
                      })}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.25"
                      value={editingEntry.duration}
                      onChange={(e) => setEditingEntry({
                        ...editingEntry,
                        duration: e.target.value
                      })}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={editingEntry.description}
                      onChange={(e) => setEditingEntry({
                        ...editingEntry,
                        description: e.target.value
                      })}
                    />
                  </td>
                  <td>
                    <button onClick={() => handleUpdateEntry(editingEntry)}>Save</button>
                    <button onClick={() => setEditingEntry(null)}>Cancel</button>
                  </td>
                </>
              ) : (
                // View mode
                <>
                  <td>{entry.work_date}</td>
                  <td>{entry.tasks?.projects?.name}</td>
                  <td>{entry.tasks?.name}</td>
                  <td>{entry.start_time}</td>
                  <td>{entry.end_time}</td>
                  <td>{entry.duration}</td>
                  <td>{entry.description}</td>
                  <td>
                    <button onClick={() => setEditingEntry(entry)}>Edit</button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TimeEntriesTable;
