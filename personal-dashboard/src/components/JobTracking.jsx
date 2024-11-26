import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import Papa from 'papaparse';
import '../styles/JobTracking.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const MetricsRow = ({ metrics }) => {
  return (
    <div className="metrics-row">
      <div className="metric-card">
        <h3>Total Applications</h3>
        <p>{metrics.total}</p>
      </div>
      <div className="metric-card">
        <h3>Active</h3>
        <p>{metrics.active}</p>
      </div>
      <div className="metric-card">
        <h3>Rejected</h3>
        <p>{metrics.rejected}</p>
      </div>
      <div className="metric-card">
        <h3>Expired</h3>
        <p>{metrics.expired}</p>
      </div>
      <div className="metric-card">
        <h3>Interview Stage</h3>
        <p>{metrics.interview}</p>
      </div>
      <div className="metric-card">
        <h3>Offers</h3>
        <p>{metrics.offers}</p>
      </div>
    </div>
  );
};

const StatsCards = ({ applicationStats, salaryStats, jobStats, progressStats }) => {
  return (
    <div className="stats-cards">
      <div className="stats-card">
        <h3>Application Trends</h3>
        <div className="stat-item">
          <label>Weekly Average</label>
          <p>{applicationStats.weeklyAvg.toFixed(1)} applications</p>
        </div>
        <div className="stat-item">
          <label>Last 7 Days vs Previous</label>
          <p>
            {applicationStats.lastWeek} vs {applicationStats.previousWeek}
            <span className={`trend ${applicationStats.weeklyDiff >= 0 ? 'positive' : 'negative'}`}>
              {applicationStats.weeklyDiff > 0 ? '+' : ''}{applicationStats.weeklyDiff}%
            </span>
          </p>
        </div>
        <div className="stat-item">
          <label>This Month vs Last</label>
          <p>
            {applicationStats.thisMonth} vs {applicationStats.lastMonth}
            <span className={`trend ${applicationStats.monthlyDiff >= 0 ? 'positive' : 'negative'}`}>
              {applicationStats.monthlyDiff > 0 ? '+' : ''}{applicationStats.monthlyDiff}%
            </span>
          </p>
        </div>
      </div>

      <div className="stats-card">
        <h3>Salary Statistics</h3>
        <div className="stat-item">
          <label>Average Total Salary</label>
          <p>${salaryStats.totalAvg.toLocaleString()}</p>
        </div>
        <div className="stat-item">
          <label>Average Listed Salary</label>
          <p>${salaryStats.listedAvg.toLocaleString()}</p>
        </div>
        <div className="stat-item">
          <label>Listed vs Total Difference</label>
          <p className={salaryStats.difference >= 0 ? 'positive' : 'negative'}>
            ${Math.abs(salaryStats.difference).toLocaleString()}
            <span className="trend">
              ({salaryStats.difference > 0 ? '+' : '-'}{Math.abs(salaryStats.difference / salaryStats.totalAvg * 100).toFixed(1)}%)
            </span>
          </p>
        </div>
      </div>

      <div className="stats-card">
        <h3>Job Characteristics</h3>
        <div className="stat-item">
          <label>Jobs with Bonus</label>
          <p>{jobStats.withBonus} of {jobStats.total} ({((jobStats.withBonus / jobStats.total) * 100).toFixed(1)}%)</p>
        </div>
        <div className="stat-item">
          <label>USD Salary Jobs</label>
          <p>{jobStats.withUSD} of {jobStats.total} ({((jobStats.withUSD / jobStats.total) * 100).toFixed(1)}%)</p>
        </div>
        <div className="stat-item">
          <label>Remote Jobs</label>
          <p>{jobStats.remote} of {jobStats.total} ({((jobStats.remote / jobStats.total) * 100).toFixed(1)}%)</p>
        </div>
      </div>

      <div className="stats-card">
        <h3>Progress Metrics</h3>
        <div className="stat-item">
          <label>Interview Rate</label>
          <p>{progressStats.interviewRate.toFixed(1)}%</p>
        </div>
        <div className="stat-item">
          <label>Offer Rate</label>
          <p>{progressStats.offerRate.toFixed(1)}%</p>
        </div>
        <div className="stat-item">
          <label>Active Applications</label>
          <p>{progressStats.activeRate.toFixed(1)}% of total</p>
        </div>
      </div>
    </div>
  );
};

const MonthlyChart = ({ data }) => {
  const chartData = {
    labels: data.map(d => d.month),
    datasets: [
      {
        label: 'Applications',
        data: data.map(d => d.count),
        backgroundColor: '#4caf50',
        borderRadius: 6,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Applications by Month',
        color: '#ffffff',
        font: {
          size: 16
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => `Applications: ${context.raw}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: '#ffffff',
          stepSize: 1
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      },
      x: {
        ticks: {
          color: '#ffffff'
        },
        grid: {
          display: false
        }
      }
    }
  };

  return (
    <div className="chart-container">
      <Bar data={chartData} options={options} />
    </div>
  );
};

const AddApplicationForm = ({ onApplicationAdded }) => {
  const [formData, setFormData] = useState({
    company: '',
    position: '',
    status: 'Applied',
    date_applied: new Date().toISOString().split('T')[0],
    salary: '',
    location: '',
    url: '',
    has_interview: false,
    currency: 'USD',
    is_salary_listed: false,
    has_bonus: false,
    portal_url: '',
    cover_letter_path: '',
    resume_path: ''
  });

  const [isFormVisible, setIsFormVisible] = useState(false);

  const statusOptions = [
    'Contacted',
    'Applied',
    'Interview',
    'Offer',
    'Rejected',
    'Withdrawn',
    'Accepted',
    'Expired'
  ];

  const currencyOptions = ['USD', 'CAD'];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileSelect = async (type) => {
    try {
      const handle = await window.showOpenFilePicker({
        types: [
          {
            description: 'Documents',
            accept: {
              'application/pdf': ['.pdf'],
              'application/msword': ['.doc', '.docx']
            }
          }
        ]
      });
      const file = await handle[0].getFile();
      setFormData(prev => ({
        ...prev,
        [`${type}_path`]: file.path
      }));
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error selecting file:', err);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const { data, error } = await supabase
      .from('job_applications')
      .insert([{
        ...formData,
        salary: formData.salary ? Number(formData.salary) : null,
        // created_at and updated_at will be handled by the database defaults
      }]);

    if (error) {
      console.error('Error adding application:', error);
      return;
    }

    setFormData({
      company: '',
      position: '',
      status: 'Applied',
      date_applied: new Date().toISOString().split('T')[0],
      salary: '',
      location: '',
      url: '',
      has_interview: false,
      currency: 'USD',
      is_salary_listed: false,
      has_bonus: false,
      portal_url: '',
      cover_letter_path: '',
      resume_path: ''
    });
    
    onApplicationAdded();
    setIsFormVisible(false);
  };

  return (
    <div className="add-application-section">
      <button 
        className="toggle-form-btn"
        onClick={() => setIsFormVisible(!isFormVisible)}
      >
        {isFormVisible ? 'Hide Form' : 'Add New Application'}
      </button>

      {isFormVisible && (
        <form onSubmit={handleSubmit} className="application-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="company">Company Name*</label>
              <input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="position">Job Title*</label>
              <input
                type="text"
                id="position"
                name="position"
                value={formData.position}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="status">Status*</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                required
              >
                {statusOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="date_applied">Date Applied*</label>
              <input
                type="date"
                id="date_applied"
                name="date_applied"
                value={formData.date_applied}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="salary">Salary</label>
              <div className="salary-input-group">
                <input
                  type="number"
                  id="salary"
                  name="salary"
                  value={formData.salary}
                  onChange={handleInputChange}
                  min="0"
                  step="1000"
                />
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                >
                  {currencyOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="location">Location</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-row checkboxes">
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  name="has_interview"
                  checked={formData.has_interview}
                  onChange={handleInputChange}
                />
                Interview Stage
              </label>
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  name="is_salary_listed"
                  checked={formData.is_salary_listed}
                  onChange={handleInputChange}
                />
                Salary Listed
              </label>
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  name="has_bonus"
                  checked={formData.has_bonus}
                  onChange={handleInputChange}
                />
                Has Bonus
              </label>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="url">Job URL</label>
              <input
                type="url"
                id="url"
                name="url"
                value={formData.url}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="portal_url">Application Portal URL</label>
              <input
                type="url"
                id="portal_url"
                name="portal_url"
                value={formData.portal_url}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Resume</label>
              <div className="file-input-group">
                <input
                  type="text"
                  value={formData.resume_path}
                  readOnly
                  placeholder="No file selected"
                />
                <button 
                  type="button"
                  onClick={() => handleFileSelect('resume')}
                >
                  Select File
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Cover Letter</label>
              <div className="file-input-group">
                <input
                  type="text"
                  value={formData.cover_letter_path}
                  readOnly
                  placeholder="No file selected"
                />
                <button 
                  type="button"
                  onClick={() => handleFileSelect('cover_letter')}
                >
                  Select File
                </button>
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group full-width">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <button type="submit">Add Application</button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

const ApplicationsTable = ({ onDataChange }) => {
  const [applications, setApplications] = useState([]);
  const [filters, setFilters] = useState({
    company: '',
    position: '',
    status: []
  });
  const [companies, setCompanies] = useState([]);
  const [positions, setPositions] = useState([]);
  const [sortConfig, setSortConfig] = useState({
    key: 'date_applied',
    direction: 'desc'
  });
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  const statusOptions = [
    'Contacted',
    'Applied',
    'Interview',
    'Offer',
    'Rejected',
    'Withdrawn',
    'Accepted',
    'Expired'
  ];

  // Add a new state for tracking import status
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    console.log('Fetching applications...');
    
    try {
      // Fetch the actual data
      const { data, error } = await supabase
        .from('job_applications')
        .select('*')
        .order('date_applied', { ascending: false });

      if (error) {
        console.error('Error fetching applications:', error);
        alert('Error fetching applications');
        return;
      }

      if (!data) {
        console.log('No data returned from database');
        setApplications([]);
        return;
      }

      console.log('Fetched applications:', data);
      setApplications(data);
      
      // Update companies and positions lists
      if (data.length > 0) {
        const uniqueCompanies = [...new Set(data.map(app => app.company))].sort();
        const uniquePositions = [...new Set(data.map(app => app.position))].sort();
        setCompanies(uniqueCompanies);
        setPositions(uniquePositions);
      } else {
        setCompanies([]);
        setPositions([]);
      }

    } catch (err) {
      console.error('Unexpected error during fetch:', err);
      alert('Unexpected error during fetch');
    }
  };

  // Verify the connection with a simpler query
  useEffect(() => {
    const verifyConnection = async () => {
      try {
        const { data, error } = await supabase
          .from('job_applications')
          .select('id')
          .limit(1);

        if (error) {
          console.error('Database connection error:', error);
          alert('Error connecting to database');
          return;
        }
        
        console.log('Database connection verified');
        fetchApplications();
      } catch (err) {
        console.error('Connection verification error:', err);
        alert('Error verifying database connection');
      }
    };

    verifyConnection();
  }, []);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this application?')) {
      const { error } = await supabase
        .from('job_applications')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting application:', error);
        return;
      }

      await fetchApplications();
      await onDataChange();
    }
  };

  const handleEdit = (application) => {
    setEditingId(application.id);
    setEditData(application);
  };

  const handleUpdate = async () => {
    const { error } = await supabase
      .from('job_applications')
      .update({
        ...editData,
        salary: editData.salary ? Number(editData.salary) : null
        // updated_at will be handled by the trigger
      })
      .eq('id', editingId);

    if (error) {
      console.error('Error updating application:', error);
      return;
    }

    setEditingId(null);
    await fetchApplications();
    await onDataChange();
  };

  const handleExport = () => {
    const csvContent = applications.map(app => ({
      Company: app.company,
      Position: app.position,
      Status: app.status,
      'Date Applied': app.date_applied,
      Location: app.location,
      Salary: app.salary,
      Currency: app.currency,
      'Has Interview': app.has_interview,
      'Salary Listed': app.is_salary_listed,
      'Has Bonus': app.has_bonus,
      URL: app.url,
      'Portal URL': app.portal_url,
      'Resume Path': app.resume_path,
      'Cover Letter Path': app.cover_letter_path
    }));

    const csv = Papa.unparse(csvContent);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `job_applications_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleImport = async (event) => {
    setIsImporting(true);
    const file = event.target.files[0];
    if (!file) {
      setIsImporting(false);
      return;
    }

    console.log('File selected:', file.name);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        console.log('Parse complete:', results);

        // Format the data with lowercase column names
        const formattedData = results.data
          .filter(row => row.Company && row.Position) // Remove empty rows
          .map(row => ({
            company: row.Company || '',
            position: row.Position || '',
            status: row.Status || 'Applied',
            date_applied: row['Date Applied'] || new Date().toISOString().split('T')[0],
            location: row.Location || '',
            salary: row.Salary || '',
            currency: row.Currency || 'USD',
            has_interview: String(row['Has Interview']).toLowerCase() === 'true',
            is_salary_listed: String(row['Salary Listed']).toLowerCase() === 'true',
            has_bonus: String(row['Has Bonus']).toLowerCase() === 'true',
            url: row.URL || '',
            portal_url: row['Portal URL'] || '',
            resume_path: row['Resume Path'] || '',
            cover_letter_path: row['Cover Letter Path'] || ''
          }));

        console.log('Formatted data:', formattedData);

        if (formattedData.length === 0) {
          console.error('No valid data to import');
          setIsImporting(false);
          return;
        }

        try {
          // Insert data in chunks
          const chunkSize = 20;
          for (let i = 0; i < formattedData.length; i += chunkSize) {
            const chunk = formattedData.slice(i, i + chunkSize);
            console.log(`Inserting chunk ${i / chunkSize + 1}:`, chunk);

            const { error } = await supabase
              .from('job_applications')
              .insert(chunk);

            if (error) {
              console.error('Insert error:', error);
              alert(`Error inserting data: ${error.message}`);
              setIsImporting(false);
              return;
            }
          }

          console.log('All data inserted successfully');
          event.target.value = '';
          
          // Refresh the data
          await fetchApplications();
          await onDataChange();
          
          alert('Import completed successfully!');
        } catch (err) {
          console.error('Unexpected error:', err);
          alert(`Error during import: ${err.message}`);
        }

        setIsImporting(false);
      },
      error: (error) => {
        console.error('CSV parse error:', error);
        alert(`Error parsing CSV: ${error}`);
        setIsImporting(false);
      }
    });
  };

  const handleDeleteAll = async () => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete ALL job applications? This action cannot be undone!'
    );

    if (confirmDelete) {
      const { error } = await supabase
        .from('job_applications')
        .delete()
        .neq('id', 0);

      if (error) {
        console.error('Error deleting all applications:', error);
        return;
      }

      // Reset all relevant state
      setApplications([]);
      setFilters({
        company: '',
        position: '',
        status: []
      });
      setCompanies([]);
      setPositions([]);
      setSortConfig({
        key: 'date_applied',
        direction: 'desc'
      });
      setEditingId(null);
      setEditData({});

      // Refresh all data
      await fetchApplications();
      await onDataChange();
    }
  };

  const filteredApplications = applications
    .filter(app => {
      return (
        (!filters.company || app.company === filters.company) &&
        (!filters.position || app.position === filters.position) &&
        (filters.status.length === 0 || filters.status.includes(app.status))
      );
    })
    .sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

  return (
    <div className="applications-table-section">
      <div className="table-actions">
        <div className="filters">
          <select
            value={filters.company}
            onChange={e => setFilters(prev => ({ ...prev, company: e.target.value }))}
          >
            <option value="">All Companies</option>
            {companies.map(company => (
              <option key={company} value={company}>{company}</option>
            ))}
          </select>

          <select
            value={filters.position}
            onChange={e => setFilters(prev => ({ ...prev, position: e.target.value }))}
          >
            <option value="">All Positions</option>
            {positions.map(position => (
              <option key={position} value={position}>{position}</option>
            ))}
          </select>

          <select
            multiple
            value={filters.status}
            onChange={e => setFilters(prev => ({
              ...prev,
              status: Array.from(e.target.selectedOptions, option => option.value)
            }))}
          >
            {statusOptions.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        <div className="import-export">
          <input
            type="file"
            accept=".csv"
            onChange={handleImport}
            disabled={isImporting}
            style={{ display: 'none' }}
            id="import-input"
          />
          <button 
            onClick={() => document.getElementById('import-input').click()}
            disabled={isImporting}
          >
            {isImporting ? 'Importing...' : 'Import CSV'}
          </button>
          <button onClick={handleExport}>Export CSV</button>
          <button 
            onClick={handleDeleteAll}
            className="delete-all-btn"
          >
            Delete All Entries
          </button>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th onClick={() => handleSort('company')}>
                Company {sortConfig.key === 'company' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('position')}>
                Position {sortConfig.key === 'position' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('status')}>
                Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('date_applied')}>
                Date Applied {sortConfig.key === 'date_applied' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('location')}>
                Location {sortConfig.key === 'location' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('salary')}>
                Salary {sortConfig.key === 'salary' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredApplications.map(app => (
              <tr key={app.id}>
                {editingId === app.id ? (
                  // Edit mode
                  <>
                    <td>
                      <input
                        type="text"
                        value={editData.company}
                        onChange={e => setEditData(prev => ({ ...prev, company: e.target.value }))}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={editData.position}
                        onChange={e => setEditData(prev => ({ ...prev, position: e.target.value }))}
                      />
                    </td>
                    <td>
                      <select
                        value={editData.status}
                        onChange={e => setEditData(prev => ({ ...prev, status: e.target.value }))}
                      >
                        {statusOptions.map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="date"
                        value={editData.date_applied}
                        onChange={e => setEditData(prev => ({ ...prev, date_applied: e.target.value }))}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={editData.location}
                        onChange={e => setEditData(prev => ({ ...prev, location: e.target.value }))}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={editData.salary}
                        onChange={e => setEditData(prev => ({ ...prev, salary: e.target.value }))}
                      />
                    </td>
                    <td>
                      <button onClick={handleUpdate}>Save</button>
                      <button onClick={() => setEditingId(null)}>Cancel</button>
                    </td>
                  </>
                ) : (
                  // View mode
                  <>
                    <td>{app.company}</td>
                    <td>{app.position}</td>
                    <td>{app.status}</td>
                    <td>{app.date_applied}</td>
                    <td>{app.location}</td>
                    <td>{app.salary ? `${app.currency} ${app.salary.toLocaleString()}` : ''}</td>
                    <td>
                      <button onClick={() => handleEdit(app)}>Edit</button>
                      <button onClick={() => handleDelete(app.id)}>Delete</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

function JobTracking() {
  const [metrics, setMetrics] = useState([]);
  const [applicationStats, setApplicationStats] = useState({
    weeklyAvg: 0,
    lastWeek: 0,
    previousWeek: 0,
    weeklyDiff: 0,
    thisMonth: 0,
    lastMonth: 0,
    monthlyDiff: 0
  });
  const [salaryStats, setSalaryStats] = useState({
    totalAvg: 0,
    listedAvg: 0,
    difference: 0
  });
  const [jobStats, setJobStats] = useState({
    withBonus: 0,
    withUSD: 0,
    remote: 0,
    total: 0
  });
  const [progressStats, setProgressStats] = useState({
    interviewRate: 0,
    offerRate: 0,
    activeRate: 0
  });
  const [monthlyData, setMonthlyData] = useState([]);

  const fetchMetrics = async () => {
    const { data, error } = await supabase
      .from('job_applications')
      .select('*');

    if (error) {
      console.error('Error fetching metrics:', error);
      return;
    }

    const metrics = {
      total: data.length,
      active: data.filter(job => ['Contacted', 'Applied', 'Interview'].includes(job.status)).length,
      rejected: data.filter(job => job.status === 'Rejected').length,
      expired: data.filter(job => job.status === 'Expired').length,
      interview: data.filter(job => job.has_interview).length,
      offers: data.filter(job => job.status === 'Offer').length
    };

    setMetrics(metrics);
  };

  const calculateStats = async () => {
    const { data, error } = await supabase
      .from('job_applications')
      .select('*')
      .order('date_applied', { ascending: false });

    if (error) {
      console.error('Error fetching stats:', error);
      return;
    }

    // Calculate application trends
    const now = new Date();
    const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now - 14 * 24 * 60 * 60 * 1000);
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

    const lastWeekApps = data.filter(job => new Date(job.date_applied) >= oneWeekAgo).length;
    const prevWeekApps = data.filter(job => 
      new Date(job.date_applied) >= twoWeeksAgo && 
      new Date(job.date_applied) < oneWeekAgo
    ).length;

    const thisMonthApps = data.filter(job => {
      const date = new Date(job.date_applied);
      return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
    }).length;

    const lastMonthApps = data.filter(job => {
      const date = new Date(job.date_applied);
      return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
    }).length;

    // Calculate weekly average
    const oldestDate = new Date(Math.min(...data.map(job => new Date(job.date_applied))));
    const totalWeeks = Math.ceil((now - oldestDate) / (7 * 24 * 60 * 60 * 1000));
    const weeklyAverage = data.length / totalWeeks;

    setApplicationStats({
      weeklyAvg: weeklyAverage,
      lastWeek: lastWeekApps,
      previousWeek: prevWeekApps,
      weeklyDiff: prevWeekApps ? ((lastWeekApps - prevWeekApps) / prevWeekApps * 100) : 0,
      thisMonth: thisMonthApps,
      lastMonth: lastMonthApps,
      monthlyDiff: lastMonthApps ? ((thisMonthApps - lastMonthApps) / lastMonthApps * 100) : 0
    });

    // Calculate salary statistics
    const salaries = data.filter(job => job.salary > 0);
    const listedSalaries = salaries.filter(job => job.is_salary_listed);
    
    const avgTotal = salaries.length ? 
      salaries.reduce((sum, job) => sum + job.salary, 0) / salaries.length : 0;
    const avgListed = listedSalaries.length ? 
      listedSalaries.reduce((sum, job) => sum + job.salary, 0) / listedSalaries.length : 0;

    setSalaryStats({
      totalAvg: avgTotal,
      listedAvg: avgListed,
      difference: avgListed - avgTotal
    });

    // Calculate job characteristics
    setJobStats({
      withBonus: data.filter(job => job.has_bonus).length,
      withUSD: data.filter(job => job.currency === 'USD').length,
      remote: data.filter(job => job.location.toLowerCase().includes('remote')).length,
      total: data.length
    });

    // Calculate progress metrics
    setProgressStats({
      interviewRate: (data.filter(job => job.has_interview).length / data.length) * 100,
      offerRate: (data.filter(job => job.status === 'Offer').length / data.length) * 100,
      activeRate: (data.filter(job => ['Contacted', 'Applied', 'Interview'].includes(job.status)).length / data.length) * 100
    });
  };

  const calculateMonthlyData = async () => {
    const { data, error } = await supabase
      .from('job_applications')
      .select('date_applied')
      .order('date_applied');

    if (error) {
      console.error('Error fetching monthly data:', error);
      return;
    }

    // Get date range
    if (data.length === 0) {
      setMonthlyData([]);
      return;
    }

    const startDate = new Date(data[0].date_applied);
    const endDate = new Date();
    
    // Create array of all months between start and end date
    const months = [];
    const currentDate = new Date(startDate);
    currentDate.setDate(1); // Set to first of month for consistent comparison

    while (currentDate <= endDate) {
      const monthYear = currentDate.toLocaleString('en-US', { 
        month: 'short', 
        year: '2-digit'
      });
      
      const count = data.filter(entry => {
        const entryDate = new Date(entry.date_applied);
        return entryDate.getMonth() === currentDate.getMonth() && 
               entryDate.getFullYear() === currentDate.getFullYear();
      }).length;

      months.push({
        month: monthYear,
        count: count
      });

      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    setMonthlyData(months);
  };

  const refreshAllData = async () => {
    await Promise.all([
      fetchMetrics(),
      calculateStats(),
      calculateMonthlyData()
    ]);
  };

  // Initial data load
  useEffect(() => {
    refreshAllData();
  }, []);

  return (
    <div className="job-tracking">
      <MetricsRow metrics={metrics} />
      <StatsCards 
        applicationStats={applicationStats}
        salaryStats={salaryStats}
        jobStats={jobStats}
        progressStats={progressStats}
      />
      <MonthlyChart data={monthlyData} />
      <AddApplicationForm onApplicationAdded={refreshAllData} />
      <ApplicationsTable onDataChange={refreshAllData} />
    </div>
  );
}

export default JobTracking; 