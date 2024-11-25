import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

function TimeEntry() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [timeEntry, setTimeEntry] = useState({
    task_id: '',
    duration: '',
    description: ''
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchTasks(selectedProject);
    }
  }, [selectedProject]);

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

  async function fetchTasks(projectId) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('name');

    if (error) {
      console.error('Error fetching tasks:', error);
    } else {
      setTasks(data);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const { data, error } = await supabase
      .from('time_entries')
      .insert([timeEntry])
      .select();

    if (error) {
      console.error('Error creating time entry:', error);
    } else {
      setTimeEntry({
        task_id: '',
        duration: '',
        description: ''
      });
    }
  }

  return (
    <div className="dashboard">
      <div className="time-entry-grid">
        <div className="entry-card">
          <h2>Add Time Entry</h2>
          <form onSubmit={handleSubmit} className="entry-form">
            <div className="form-group">
              <label>Project</label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                required
              >
                <option value="">Select Project</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Task</label>
              <select
                value={timeEntry.task_id}
                onChange={(e) => setTimeEntry({ ...timeEntry, task_id: e.target.value })}
                required
              >
                <option value="">Select Task</option>
                {tasks.map(task => (
                  <option key={task.id} value={task.id}>
                    {task.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Duration (hours)</label>
              <input
                type="number"
                step="0.5"
                value={timeEntry.duration}
                onChange={(e) => setTimeEntry({ ...timeEntry, duration: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={timeEntry.description}
                onChange={(e) => setTimeEntry({ ...timeEntry, description: e.target.value })}
              />
            </div>

            <button type="submit" className="submit-btn">Add Entry</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default TimeEntry;
