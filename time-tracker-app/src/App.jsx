import React, { useState, useEffect } from 'react';
import { supabase } from './config/supabase';
import './styles/App.css';

function App() {
  console.log('App component rendering');

  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [isTracking, setIsTracking] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timerInterval, setTimerInterval] = useState(null);
  const [timeEntry, setTimeEntry] = useState({
    project_id: '',
    task_id: '',
    description: '',
    start_time: '',
    work_date: new Date().toISOString().split('T')[0]
  });
  const [isStopped, setIsStopped] = useState(false);
  const [endTime, setEndTime] = useState(null);
  const [displayTimes, setDisplayTimes] = useState({
    start: '',
    end: ''
  });

  useEffect(() => {
    console.log('Initial useEffect running');
    fetchProjects();
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, []);

  const fetchProjects = async () => {
    console.log('Fetching projects...');
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, status')
        .eq('status', 'open')
        .order('name');

      if (error) {
        console.error('Error fetching projects:', error);
      } else {
        console.log('Projects fetched:', data);
        setProjects(data || []);
      }
    } catch (err) {
      console.error('Exception fetching projects:', err);
    }
  };

  const fetchTasks = async (projectId) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('name');

      if (error) {
        console.error('Error fetching tasks:', error);
      } else {
        setTasks(data || []);
      }
    } catch (err) {
      console.error('Exception fetching tasks:', err);
    }
  };

  const handleProjectChange = (e) => {
    const projectId = e.target.value;
    setTimeEntry(prev => ({
      ...prev,
      project_id: projectId,
      task_id: ''
    }));

    if (projectId) {
      fetchTasks(projectId);
    } else {
      setTasks([]);
    }
  };

  const formatElapsedTime = (seconds) => {
    if (startTime && isTracking) {
      const now = new Date();
      const start = new Date(startTime);
      seconds = Math.floor((now - start) / 1000);
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  const startTimer = () => {
    if (!timeEntry.task_id) {
      alert('Please select a task before starting the timer');
      return;
    }

    const now = new Date();
    const formattedStartTime = now.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });

    setStartTime(now.toISOString());
    setIsTracking(true);
    setDisplayTimes(prev => ({
      ...prev,
      start: formattedStartTime
    }));
    setTimeEntry(prev => ({
      ...prev,
      start_time: formattedStartTime
    }));

    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    setTimerInterval(interval);
  };

  const stopTimer = () => {
    clearInterval(timerInterval);
    setTimerInterval(null);
    setIsTracking(false);
    setIsStopped(true);
    
    const currentEndTime = new Date();
    const formattedEndTime = currentEndTime.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });

    setEndTime(currentEndTime);
    setDisplayTimes(prev => ({
      ...prev,
      end: formattedEndTime
    }));
  };

  const handleTimeChange = (type, value) => {
    setDisplayTimes(prev => ({
      ...prev,
      [type]: value
    }));

    if (type === 'start') {
      setTimeEntry(prev => ({
        ...prev,
        start_time: value
      }));
    }
  };

  const saveTimeEntry = async () => {
    const duration = (endTime - new Date(startTime)) / (1000 * 60 * 60); // Convert to hours

    const { error } = await supabase
      .from('time_entries')
      .insert([{
        task_id: timeEntry.task_id,
        description: timeEntry.description,
        start_time: displayTimes.start,
        end_time: displayTimes.end,
        duration: Number(duration.toFixed(2)),
        work_date: timeEntry.work_date
      }]);

    if (error) {
      console.error('Error saving time entry:', error);
    } else {
      // Reset form
      setTimeEntry({
        project_id: '',
        task_id: '',
        description: '',
        start_time: '',
        work_date: new Date().toISOString().split('T')[0]
      });
      setElapsedTime(0);
      setIsStopped(false);
      setEndTime(null);
      setDisplayTimes({ start: '', end: '' });
    }
  };

  const discardEntry = () => {
    // Reset all states to initial values
    setTimeEntry({
      project_id: '',
      task_id: '',
      description: '',
      start_time: '',
      work_date: new Date().toISOString().split('T')[0]
    });
    setElapsedTime(0);
    setIsStopped(false);
    setEndTime(null);
  };

  return (
    <div className="time-tracker">
      <div className="tracker-card">
        <h2>Time Tracker</h2>
        <div className="timer-display">
          {formatElapsedTime(elapsedTime)}
        </div>

        <form className="tracker-form">
          <div className="form-group">
            <label>Project</label>
            <select
              value={timeEntry.project_id}
              onChange={handleProjectChange}
              disabled={isTracking || isStopped}
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
              disabled={isTracking || isStopped}
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
            <label>Description</label>
            <textarea
              value={timeEntry.description}
              onChange={(e) => setTimeEntry({ ...timeEntry, description: e.target.value })}
              disabled={isTracking}
            />
          </div>

          <div className="form-group time-inputs">
            <div>
              <label>Start Time</label>
              <input
                type="time"
                value={displayTimes.start}
                onChange={(e) => handleTimeChange('start', e.target.value)}
                disabled={isTracking}
              />
            </div>
            {isStopped && (
              <div>
                <label>End Time</label>
                <input
                  type="time"
                  value={displayTimes.end}
                  onChange={(e) => handleTimeChange('end', e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="timer-controls">
            {!isTracking && !isStopped && (
              <button type="button" onClick={startTimer} className="btn start-btn">
                Start Timer
              </button>
            )}
            {isTracking && (
              <button type="button" onClick={stopTimer} className="btn stop-btn">
                Stop Timer
              </button>
            )}
            {isStopped && (
              <>
                <button type="button" onClick={saveTimeEntry} className="btn save-btn">
                  Save Entry
                </button>
                <button type="button" onClick={discardEntry} className="btn discard-btn">
                  Discard
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default App; 