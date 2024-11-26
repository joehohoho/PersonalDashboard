import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import TimeEntriesTable from './TimeEntriesTable';
import ProjectTaskManager from './ProjectTaskManager';
import '../styles/TimeEntry.css';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function TimeEntry({ refreshTrigger }) {
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
  const [timeEntryUpdates, setTimeEntryUpdates] = useState(0);
  const [metrics, setMetrics] = useState({
    today: 0,
    week: 0,
    month: 0,
    year: 0
  });
  const [projectHours, setProjectHours] = useState([]);
  const [taskHours, setTaskHours] = useState([]);
  const [timeDistribution, setTimeDistribution] = useState([]);
  const [dayDistribution, setDayDistribution] = useState([]);
  const [weekEfficiency, setWeekEfficiency] = useState([]);

  const fetchTimeMetrics = async () => {
    const today = new Date().toISOString().split('T')[0];
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('time_entries')
      .select('duration, work_date');

    if (error) {
      console.error('Error fetching time metrics:', error);
      return;
    }

    const totals = {
      today: data
        .filter(entry => entry.work_date === today)
        .reduce((sum, entry) => sum + Number(entry.duration || 0), 0),
      week: data
        .filter(entry => new Date(entry.work_date) >= weekStart)
        .reduce((sum, entry) => sum + Number(entry.duration || 0), 0),
      month: data
        .filter(entry => new Date(entry.work_date) >= monthStart)
        .reduce((sum, entry) => sum + Number(entry.duration || 0), 0),
      year: data
        .filter(entry => entry.work_date >= yearStart)
        .reduce((sum, entry) => sum + Number(entry.duration || 0), 0)
    };

    setMetrics(totals);
  };

  useEffect(() => {
    const fetchAllData = async () => {
      await Promise.all([
        fetchTimeMetrics(),
        fetchProjectHours(),
        fetchTaskHours(),
        fetchTimeDistribution(),
        fetchDayDistribution(),
        fetchWeekEfficiency()
      ]);
    };

    fetchAllData();
  }, [timeEntryUpdates, refreshTrigger]);

  const fetchProjects = async () => {
    console.log('Fetching open projects for TimeEntry...');
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, status')
      .eq('status', 'open')
      .order('name');

    if (error) {
      console.error('Error fetching projects:', error);
    } else {
      console.log('Received projects:', data);
      setProjects(data);
      
      if (timeEntry.project_id) {
        const projectStillOpen = data.some(p => p.id === timeEntry.project_id);
        if (!projectStillOpen) {
          console.log('Resetting selected project as it is now closed');
          setTimeEntry(prev => ({
            ...prev,
            project_id: '',
            task_id: ''
          }));
        }
      }
    }
  };

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
      setTimeEntryUpdates(prev => prev + 1);
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

  const handleProjectChange = (e) => {
    const projectId = e.target.value;
    setTimeEntry(prev => ({
      ...prev,
      project_id: projectId,
      task_id: '' // Reset task when project changes
    }));

    if (projectId) {
      fetchTasks(projectId);
    } else {
      setTasks([]); // Clear tasks if no project selected
    }
  };

  const fetchOpenProjects = async () => {
    console.log('Fetching open projects on dropdown click');
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, status')
      .eq('status', 'open')
      .order('name');

    if (error) {
      console.error('Error fetching projects:', error);
    } else {
      console.log('Received open projects:', data);
      setProjects(data);
    }
  };

  const handleProjectSelectClick = () => {
    fetchOpenProjects();
  };

  const calculateMetrics = async () => {
    const { data, error } = await supabase
      .from('time_entries')
      .select('duration, work_date');
    
    if (error) {
      console.error('Error fetching metrics:', error);
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];

    const totals = {
      today: data
        .filter(entry => entry.work_date === today)
        .reduce((sum, entry) => sum + Number(entry.duration || 0), 0),
      week: data
        .filter(entry => new Date(entry.work_date) >= weekStart)
        .reduce((sum, entry) => sum + Number(entry.duration || 0), 0),
      month: data
        .filter(entry => new Date(entry.work_date) >= monthStart)
        .reduce((sum, entry) => sum + Number(entry.duration || 0), 0),
      year: data
        .filter(entry => entry.work_date >= yearStart)
        .reduce((sum, entry) => sum + Number(entry.duration || 0), 0)
    };

    setMetrics(totals);
  };

  const getCurrentMonthAbbr = () => {
    return new Date().toLocaleString('en-US', { month: 'short' });
  };

  const fetchProjectHours = async () => {
    const { data: timeEntries, error: timeError } = await supabase
      .from('time_entries')
      .select(`
        duration,
        tasks (
          project_id,
          projects (
            name
          )
        )
      `);

    if (timeError) {
      console.error('Error fetching project hours:', timeError);
      return;
    }

    // Calculate hours per project
    const projectTotals = timeEntries.reduce((acc, entry) => {
      const projectName = entry.tasks?.projects?.name;
      if (projectName) {
        acc[projectName] = (acc[projectName] || 0) + Number(entry.duration);
      }
      return acc;
    }, {});

    // Convert to array and sort by hours
    const sortedProjects = Object.entries(projectTotals)
      .map(([name, hours]) => ({ name, hours }))
      .sort((a, b) => b.hours - a.hours);

    setProjectHours(sortedProjects);
  };

  const fetchTaskHours = async () => {
    const { data: timeEntries, error: timeError } = await supabase
      .from('time_entries')
      .select(`
        duration,
        tasks (
          name
        )
      `);

    if (timeError) {
      console.error('Error fetching task hours:', timeError);
      return;
    }

    // Helper function to normalize task names
    const normalizeTaskName = (name) => {
      name = name.toLowerCase();
      
      // Common word mappings
      const wordMappings = {
        'dev': 'development',
        'develop': 'development',
        'setup': 'setup',
        'config': 'configuration',
        'configure': 'configuration',
        'test': 'testing',
        'debug': 'debugging',
        'fix': 'bugfix',
        'implement': 'implementation',
        'review': 'code review',
        'meet': 'meeting',
        'call': 'calls',
      };

      // Replace words based on mappings
      for (const [key, value] of Object.entries(wordMappings)) {
        if (name.includes(key)) {
          name = value;
        }
      }

      return name;
    };

    // Group tasks and calculate hours
    const taskTotals = timeEntries.reduce((acc, entry) => {
      const taskName = entry.tasks?.name || '';
      const normalizedName = normalizeTaskName(taskName);
      
      acc[normalizedName] = (acc[normalizedName] || 0) + Number(entry.duration);
      return acc;
    }, {});

    // Convert to array and sort by hours
    const sortedTasks = Object.entries(taskTotals)
      .map(([name, hours]) => ({ 
        name: name.charAt(0).toUpperCase() + name.slice(1), // Capitalize first letter
        hours 
      }))
      .sort((a, b) => b.hours - a.hours);

    setTaskHours(sortedTasks);
  };

  const fetchTimeDistribution = async () => {
    const { data: timeEntries, error: timeError } = await supabase
      .from('time_entries')
      .select('start_time, duration');

    if (timeError) {
      console.error('Error fetching time distribution:', timeError);
      return;
    }

    // Initialize hours array (24 hours)
    const hourlyDistribution = Array(24).fill(0);

    // Calculate hours worked in each hour of the day
    timeEntries.forEach(entry => {
      if (entry.start_time) {
        const hour = parseInt(entry.start_time.split(':')[0]);
        hourlyDistribution[hour] += Number(entry.duration || 0);
      }
    });

    // Convert to array of objects with hour labels
    const distribution = hourlyDistribution.map((hours, index) => ({
      hour: `${index.toString().padStart(2, '0')}:00`,
      hours: Number(hours.toFixed(2))
    }));

    setTimeDistribution(distribution);
  };

  const fetchDayDistribution = async () => {
    const { data: timeEntries, error: timeError } = await supabase
      .from('time_entries')
      .select('work_date, duration');

    if (timeError) {
      console.error('Error fetching day distribution:', error);
      return;
    }

    // Initialize days array with counts and totals
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayStats = days.reduce((acc, day) => ({ 
      ...acc, 
      [day]: { total: 0, count: 0 } 
    }), {});

    // Calculate total hours and count of days worked
    timeEntries.forEach(entry => {
      if (entry.work_date) {
        const dayName = days[new Date(entry.work_date).getDay()];
        dayStats[dayName].total += Number(entry.duration || 0);
        dayStats[dayName].count += 1;
      }
    });

    // Convert to array and calculate averages
    const distribution = days.map(day => ({
      day,
      hours: dayStats[day].count > 0 
        ? Number((dayStats[day].total / dayStats[day].count).toFixed(2))
        : 0
    }));

    setDayDistribution(distribution);
  };

  const fetchWeekEfficiency = async () => {
    const { data: timeEntries, error } = await supabase
      .from('time_entries')
      .select('work_date, duration');

    if (error) {
      console.error('Error fetching week efficiency:', error);
      return;
    }

    // Get current week's dates
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
    
    const weekData = [];
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(weekStart);
      currentDate.setDate(weekStart.getDate() + i);
      const dateString = currentDate.toISOString().split('T')[0];
      
      // Calculate target hours (8 for Monday-Friday, 0 for weekend)
      const dayOfWeek = currentDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const targetHours = isWeekend ? 0 : 8;
      
      // Calculate actual hours
      const actualHours = timeEntries
        .filter(entry => entry.work_date === dateString)
        .reduce((sum, entry) => sum + Number(entry.duration || 0), 0);
      
      // Calculate efficiency percentage (avoid division by zero)
      let efficiencyValue = 0;
      if (targetHours > 0) {
        efficiencyValue = (actualHours / targetHours) * 100;
      }
      
      weekData.push({
        day: currentDate.toLocaleString('en-US', { weekday: 'short' }),
        efficiency: Number(efficiencyValue.toFixed(1)),
        actual: actualHours,
        target: targetHours
      });
    }

    setWeekEfficiency(weekData);
  };

  const chartData = {
    labels: projectHours.map(p => p.name),
    datasets: [
      {
        label: 'Hours',
        data: projectHours.map(p => p.hours),
        backgroundColor: '#4a90e2',
        borderRadius: 6,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Hours by Project',
        color: '#ffffff',
        font: {
          size: 16
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#ffffff'
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#ffffff'
        }
      }
    }
  };

  const taskChartData = {
    labels: taskHours.map(t => t.name),
    datasets: [
      {
        label: 'Hours',
        data: taskHours.map(t => t.hours),
        backgroundColor: '#45b7cd',  // Different color from project chart
        borderRadius: 6,
      }
    ]
  };

  const taskChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Hours by Task Category',
        color: '#ffffff',
        font: {
          size: 16
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#ffffff'
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#ffffff'
        }
      }
    }
  };

  const timeDistributionData = {
    labels: timeDistribution.map(t => t.hour),
    datasets: [
      {
        label: 'Hours',
        data: timeDistribution.map(t => t.hours),
        backgroundColor: '#50C878',  // Different color from other charts
        borderRadius: 6,
      }
    ]
  };

  const timeDistributionOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Work Hours Distribution',
        color: '#ffffff',
        font: {
          size: 16
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#ffffff'
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#ffffff',
          maxRotation: 45,
          minRotation: 45
        }
      }
    }
  };

  const dayDistributionData = {
    labels: dayDistribution.map(d => d.day.slice(0, 3)), // Use 3-letter day names
    datasets: [
      {
        label: 'Hours',
        data: dayDistribution.map(d => d.hours),
        backgroundColor: '#9370DB',  // Different color (purple)
        borderRadius: 6,
      }
    ]
  };

  const dayDistributionOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Average Hours by Day of Week',  // Updated title
        color: '#ffffff',
        font: {
          size: 16
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => `Avg Hours: ${context.raw.toFixed(2)}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#ffffff'
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#ffffff'
        }
      }
    }
  };

  const efficiencyChartData = {
    labels: weekEfficiency.map(d => d.day),
    datasets: [
      {
        label: 'Efficiency %',
        data: weekEfficiency.map(d => d.efficiency),
        backgroundColor: '#FF6B6B',
        borderRadius: 6,
      }
    ]
  };

  const efficiencyChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Weekly Efficiency (Target: 8hrs/day)',
        color: '#ffffff',
        font: {
          size: 16
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const dataIndex = context.dataIndex;
            const data = weekEfficiency[dataIndex];
            return [
              `Efficiency: ${data.efficiency}%`,
              `Actual: ${data.actual.toFixed(1)}hrs`,
              `Target: ${data.target}hrs`
            ];
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 150,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#ffffff',
          callback: (value) => `${value}%`
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#ffffff'
        }
      }
    }
  };

  // Add helper function to get current year
  const getCurrentYear = () => {
    return new Date().getFullYear();
  };

  // Add helper function to get days elapsed in current week
  const getWeekProgress = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 (Sunday) through 6 (Saturday)
    return dayOfWeek + 1; // Add 1 to show human-readable count (1-7)
  };

  // Add helper function to get current day abbreviation
  const getCurrentDayAbbr = () => {
    return new Date().toLocaleString('en-US', { weekday: 'short' });
  };

  return (
    <div className="dashboard">
      {/* Add metrics cards at the top */}
      <div className="metrics-row">
        <div className="metric-card">
          <h3>Today ({getCurrentDayAbbr()})</h3>
          <p>{(metrics.today || 0).toFixed(2)}</p>
        </div>
        <div className="metric-card">
          <h3>This Week ({getWeekProgress()} of 7)</h3>
          <p>{(metrics.week || 0).toFixed(2)}</p>
        </div>
        <div className="metric-card">
          <h3>This Month ({getCurrentMonthAbbr()})</h3>
          <p>{(metrics.month || 0).toFixed(2)}</p>
        </div>
        <div className="metric-card">
          <h3>This Year ({getCurrentYear()})</h3>
          <p>{(metrics.year || 0).toFixed(2)}</p>
        </div>
      </div>

      {/* Project and Task charts row */}
      <div className="charts-row">
        <div className="chart-container">
          <Bar 
            data={{
              ...chartData,
              datasets: [{
                ...chartData?.datasets?.[0],
                data: projectHours.map(p => p.hours || 0)
              }]
            }} 
            options={chartOptions} 
          />
        </div>
        <div className="chart-container">
          <Bar 
            data={{
              ...taskChartData,
              datasets: [{
                ...taskChartData?.datasets?.[0],
                data: taskHours.map(t => t.hours || 0)
              }]
            }} 
            options={taskChartOptions} 
          />
        </div>
      </div>

      {/* Time and Day distribution charts row */}
      <div className="charts-row">
        <div className="chart-container">
          <Bar 
            data={{
              ...timeDistributionData,
              datasets: [{
                ...timeDistributionData?.datasets?.[0],
                data: timeDistribution.map(t => t.hours || 0)
              }]
            }} 
            options={timeDistributionOptions} 
          />
        </div>
        <div className="chart-container">
          <Bar 
            data={{
              ...dayDistributionData,
              datasets: [{
                ...dayDistributionData?.datasets?.[0],
                data: dayDistribution.map(d => d.hours || 0)
              }]
            }} 
            options={dayDistributionOptions} 
          />
        </div>
        <div className="chart-container">
          <Bar data={efficiencyChartData} options={efficiencyChartOptions} />
        </div>
      </div>

      {/* Time Entry Card */}
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
                  value={timeEntry.project_id}
                  onChange={handleProjectChange}
                  onClick={handleProjectSelectClick}
                  onFocus={handleProjectSelectClick}
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

      {/* Time Entries Table */}
      <TimeEntriesTable refreshTrigger={timeEntryUpdates} />

      {/* Creation Cards */}
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

      {/* Project/Task Manager */}
      <ProjectTaskManager />
    </div>
  );
}

export default TimeEntry;
