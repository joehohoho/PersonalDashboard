import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import TimeEntriesTable from './TimeEntriesTable';

function TimeEntry() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [timeEntry, setTimeEntry] = useState({
    task_id: '',
    duration: '',
    description: '',
    start_time: '',
    end_time: '',
    work_date: new Date().toISOString().split('T')[0]
  });
  const [newProject, setNewProject] = useState({
    name: '',
    description: ''
  });
  const [newTask, setNewTask] = useState({
    name: '',
    description: '',
    project_id: ''
  });
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [isTimeEntryFormOpen, setIsTimeEntryFormOpen] = useState(true);

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

  async function handleCreateProject(e) {
    e.preventDefault();
    const { data, error } = await supabase
      .from('projects')
      .insert([newProject])
      .select();

    if (error) {
      console.error('Error creating project:', error);
    } else {
      setProjects([...projects, data[0]]);
      setNewProject({ name: '', description: '' });
      fetchProjects(); // Refresh the projects list
    }
  }

  async function handleCreateTask(e) {
    e.preventDefault();
    const { data, error } = await supabase
      .from('tasks')
      .insert([newTask])
      .select();

    if (error) {
      console.error('Error creating task:', error);
    } else {
      setTasks([...tasks, data[0]]);
      setNewTask({ name: '', description: '', project_id: '' });
      if (selectedProject) {
        fetchTasks(selectedProject); // Refresh the tasks list
      }
    }
  }

  async function handleTimeEntry(e) {
    e.preventDefault();
    
    const entryData = {
      task_id: timeEntry.task_id,
      duration: timeEntry.duration,
      description: timeEntry.description,
      start_time: timeEntry.start_time || null,
      end_time: timeEntry.end_time || null,
      work_date: timeEntry.work_date
    };

    const { data, error } = await supabase
      .from('time_entries')
      .insert([entryData])
      .select();

    if (error) {
      console.error('Error creating time entry:', error);
    } else {
      setTimeEntry({
        task_id: '',
        duration: '',
        description: '',
        start_time: '',
        end_time: '',
        work_date: new Date().toISOString().split('T')[0]
      });
    }
  }

  const calculateDuration = (start, end) => {
    if (!start || !end) return;

    const startTime = new Date(`1970-01-01T${start}`);
    const endTime = new Date(`1970-01-01T${end}`);
    
    // Calculate difference in hours
    const diffInHours = (endTime - startTime) / (1000 * 60 * 60);
    
    // Round to nearest 0.25 (15 minutes)
    return Math.round(diffInHours * 4) / 4;
  };

  const handleTimeChange = (e) => {
    const { name, value } = e.target;
    const newTimeEntry = { ...timeEntry, [name]: value };

    // If both times are set, calculate duration
    if (name === 'start_time' || name === 'end_time') {
      if (newTimeEntry.start_time && newTimeEntry.end_time) {
        const duration = calculateDuration(newTimeEntry.start_time, newTimeEntry.end_time);
        newTimeEntry.duration = duration;
      }
    }

    setTimeEntry(newTimeEntry);
  };

  return (
    <div className="dashboard">
      {/* Management section - Two cards side by side */}
      <div className="management-grid">
        {/* Project Creation Card */}
        <div className="entry-card">
          <div className="card-header" onClick={() => setIsProjectFormOpen(!isProjectFormOpen)}>
            <h2>Create New Project</h2>
            <button className="collapse-btn">
              {isProjectFormOpen ? '▼' : '▶'}
            </button>
          </div>
          {isProjectFormOpen && (
            <form onSubmit={handleCreateProject} className="entry-form">
              <div className="form-group">
                <label>Project Name</label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                />
              </div>
              <button type="submit" className="submit-btn">Create Project</button>
            </form>
          )}
        </div>

        {/* Task Creation Card */}
        <div className="entry-card">
          <div className="card-header" onClick={() => setIsTaskFormOpen(!isTaskFormOpen)}>
            <h2>Create New Task</h2>
            <button className="collapse-btn">
              {isTaskFormOpen ? '▼' : '▶'}
            </button>
          </div>
          {isTaskFormOpen && (
            <form onSubmit={handleCreateTask} className="entry-form">
              <div className="form-group">
                <label>Project</label>
                <select
                  value={newTask.project_id}
                  onChange={(e) => setNewTask({ ...newTask, project_id: e.target.value })}
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
                <label>Task Name</label>
                <input
                  type="text"
                  value={newTask.name}
                  onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                />
              </div>
              <button type="submit" className="submit-btn">Create Task</button>
            </form>
          )}
        </div>
      </div>

      {/* Time Entry section - Single card */}
      <div className="time-entry-grid">
        <div className="entry-card">
          <div className="card-header" onClick={() => setIsTimeEntryFormOpen(!isTimeEntryFormOpen)}>
            <h2>Add Time Entry</h2>
            <button className="collapse-btn">
              {isTimeEntryFormOpen ? '▼' : '▶'}
            </button>
          </div>
          
          {isTimeEntryFormOpen && (
            <form onSubmit={handleTimeEntry} className="entry-form">
              <div className="form-group">
                <label>Date Worked</label>
                <input
                  type="date"
                  name="work_date"
                  value={timeEntry.work_date}
                  onChange={(e) => setTimeEntry({ ...timeEntry, work_date: e.target.value })}
                  required
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

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

              <div className="time-inputs">
                <div className="form-group">
                  <label>Start Time</label>
                  <input
                    type="time"
                    name="start_time"
                    value={timeEntry.start_time}
                    onChange={handleTimeChange}
                  />
                </div>

                <div className="form-group">
                  <label>End Time</label>
                  <input
                    type="time"
                    name="end_time"
                    value={timeEntry.end_time}
                    onChange={handleTimeChange}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Duration (hours)</label>
                <input
                  type="number"
                  step="0.25"
                  value={timeEntry.duration}
                  onChange={(e) => setTimeEntry({ ...timeEntry, duration: e.target.value })}
                  required
                />
                {timeEntry.start_time && timeEntry.end_time && (
                  <small className="help-text">
                    Calculated from start and end time
                  </small>
                )}
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
          )}
        </div>
      </div>

      {/* Add the time entries table */}
      <TimeEntriesTable />
    </div>
  );
}

export default TimeEntry;
