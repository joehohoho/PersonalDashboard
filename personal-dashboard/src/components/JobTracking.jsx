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

const SERVER_BASE_URL = 'http://localhost:8080';

const MetricsRow = ({ metrics }) => {
  const calculatePercentage = (value) => {
    if (!metrics.total || value === undefined) return '0%';
    return `${Math.round((value / metrics.total) * 100)}%`;
  };

  return (
    <div className="metrics-row">
      <div className="metric-card">
        <h3>Total Applications</h3>
        <p>{metrics.total}</p>
      </div>
      <div className="metric-card">
        <h3>Active</h3>
        <p>
          {metrics.active}
          <span className="percentage"> ({calculatePercentage(metrics.active)})</span>
        </p>
      </div>
      <div className="metric-card">
        <h3>Rejected</h3>
        <p>
          {metrics.rejected}
          <span className="percentage"> ({calculatePercentage(metrics.rejected)})</span>
        </p>
      </div>
      <div className="metric-card">
        <h3>Expired</h3>
        <p>
          {metrics.expired}
          <span className="percentage"> ({calculatePercentage(metrics.expired)})</span>
        </p>
      </div>
      <div className="metric-card">
        <h3>Interview Stage</h3>
        <p>
          {metrics.interview}
          <span className="percentage"> ({calculatePercentage(metrics.interview)})</span>
        </p>
      </div>
      <div className="metric-card">
        <h3>Offers</h3>
        <p>
          {metrics.offers}
          <span className="percentage"> ({calculatePercentage(metrics.offers)})</span>
        </p>
      </div>
    </div>
  );
};

const StatsCards = ({ applicationStats, salaryStats, jobStats, progressStats }) => {
  const formatPercentage = (value) => {
    const absValue = Math.abs(value); // Get absolute value
    const formattedValue = absValue.toFixed(0); // Remove decimals
    const isPositive = value >= 0;
    
    return (
      <span className={isPositive ? 'positive' : 'negative'}>
        {formattedValue}%
      </span>
    );
  };

  const formatMonthlyComparison = (thisMonth, lastMonth) => {
    if (!thisMonth || !lastMonth) return 'N/A';
    
    const percentChange = lastMonth === 0 
      ? 100 
      : ((thisMonth - lastMonth) / lastMonth) * 100;
    
    const absValue = Math.abs(percentChange).toFixed(0);
    const isPositive = percentChange >= 0;
    
    return (
      <span>
        {thisMonth} vs {lastMonth}{' '}
        <span className={isPositive ? 'positive' : 'negative'}>
          ({absValue}%)
        </span>
      </span>
    );
  };

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
            {' '}
            ({formatPercentage(applicationStats.weeklyDiff)})
          </p>
        </div>
        <div className="stat-item">
          <label>This Month vs Last</label>
          <p>
            {formatMonthlyComparison(
              applicationStats.thisMonth,
              applicationStats.lastMonth
            )}
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
    <div className="chart-container" style={{ height: '240px' }}>
      <Bar data={chartData} options={options} />
    </div>
  );
};

const AddApplicationForm = ({ onApplicationAdded, editData = null, onUpdate = null }) => {
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
    resume_path: '',
    description: ''
  });

  const [isFormVisible, setIsFormVisible] = useState(!!editData);

  useEffect(() => {
    if (editData) {
      setFormData({
        ...editData,
        salary: editData.salary ? editData.salary.toString() : '',
      });
      setIsFormVisible(true);
    }
  }, [editData]);

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
    
    if (name === 'salary') {
      // Allow numbers, commas, dashes, spaces, and dollar signs
      const isValidInput = /^[$\d,\s-]*$/.test(value);
      if (!isValidInput && value !== '') return;
    }

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
      
      const fileHandle = handle[0];
      const file = await fileHandle.getFile();
      
      const fileName = file.name;
      console.log('Selected file:', fileName);
      
      setFormData(prev => ({
        ...prev,
        [`${type}_path`]: fileName
      }));

    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error selecting file:', err);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Parse salary range before submitting
    const parseSalary = (salaryString) => {
      if (!salaryString) return null;
      
      // Remove $ and commas, trim whitespace
      const cleaned = salaryString.toString().replace(/[$,]/g, '').trim();
      
      // Check for range format (e.g., "100000 - 120000")
      const rangeMatch = cleaned.match(/(\d+)\s*[-–]\s*(\d+)/);
      
      if (rangeMatch) {
        const min = parseFloat(rangeMatch[1]);
        const max = parseFloat(rangeMatch[2]);
        return `${min}-${max}`; // Store as "min-max" format
      }
      
      // Single number
      const value = parseFloat(cleaned);
      return isNaN(value) ? null : value;
    };

    if (editData) {
      const { data, error } = await supabase
        .from('job_applications')
        .update({
          ...formData,
          salary: parseSalary(formData.salary),
        })
        .eq('id', editData.id);

      if (error) {
        console.error('Error updating application:', error);
        return;
      }

      onUpdate && onUpdate();
    } else {
      const { data, error } = await supabase
        .from('job_applications')
        .insert([{
          ...formData,
          salary: parseSalary(formData.salary),
        }]);

      if (error) {
        console.error('Error adding application:', error);
        return;
      }

      onApplicationAdded();
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
      resume_path: '',
      description: ''
    });
    
    setIsFormVisible(false);
  };

  return (
    <div className={`add-application-section ${editData ? 'edit-application-form' : ''}`}>
      {!editData && (
        <button 
          className="toggle-form-btn"
          onClick={() => setIsFormVisible(!isFormVisible)}
        >
          {isFormVisible ? 'Hide Form' : 'Add New Application'}
        </button>
      )}

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

            <div className="form-group">
              <label htmlFor="salary">Salary</label>
              <div className="salary-input-group">
                <input
                  type="text"
                  id="salary"
                  name="salary"
                  value={formData.salary}
                  onChange={handleInputChange}
                  placeholder="Enter salary"
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

            <div className="form-group checkbox-stack">
              <div className="checkbox-item">
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
              <div className="checkbox-item">
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
              <div className="checkbox-item">
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
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    resume_path: e.target.value
                  }))}
                  placeholder="Enter or select file path"
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
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    cover_letter_path: e.target.value
                  }))}
                  placeholder="Enter or select file path"
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
              <button type="submit">
                {editData ? 'Update Application' : 'Add Application'}
              </button>
              {editData && (
                <button 
                  type="button" 
                  onClick={() => {
                    setIsFormVisible(false);
                    onUpdate && onUpdate();
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

const openFile = (fileName) => {
  if (!fileName) {
    console.error('No filename provided');
    return;
  }

  const fileUrl = `${SERVER_BASE_URL}/${fileName}`;
  console.log('Opening file:', fileUrl);

  window.open(fileUrl, '_blank');
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
  const [selectedApplication, setSelectedApplication] = useState(null);

  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

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

  // Add new state for description popup
  const [descriptionPopup, setDescriptionPopup] = useState({
    isOpen: false,
    content: '',
    position: '',
    company: ''
  });

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
    setSelectedApplication(application);
    // Find the edit form and scroll to it
    setTimeout(() => {
      const editForm = document.querySelector('.edit-application-form');
      if (editForm) {
        editForm.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 100);
  };

  const handleUpdate = () => {
    setSelectedApplication(null);
    fetchApplications();
    onDataChange();
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
      setSelectedApplication(null);

      // Refresh all data
      await fetchApplications();
      await onDataChange();
    }
  };

  const handleStatusChange = (status) => {
    setFilters(prev => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter(s => s !== status)
        : [...prev.status, status]
    }));
  };

  // Get unique company and position names
  const companyOptions = ['All', ...new Set(applications
    .map(app => app.company)
    .filter(Boolean)
    .sort())];

  const positionOptions = ['All', ...new Set(applications
    .map(app => app.position)
    .filter(Boolean)
    .sort())];

  // Update the filtering logic
  const filteredApplications = applications.filter(app => {
    const matchesCompany = filters.company === '' || filters.company === 'All' || app.company === filters.company;
    const matchesPosition = filters.position === '' || filters.position === 'All' || app.position === filters.position;
    const matchesStatus = filters.status.length === 0 || filters.status.includes(app.status);
    return matchesCompany && matchesPosition && matchesStatus;
  });

  // Sort the applications based on the current sort configuration
  const sortedApplications = [...filteredApplications].sort((a, b) => {
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const formatSalary = (salaryValue, isListed, currency) => {
    if (!salaryValue) return '';
    
    // Check if it's a range (stored as "min-max")
    const rangeMatch = String(salaryValue).match(/(\d+)-(\d+)/);
    
    const formattedValue = rangeMatch
      ? `${parseInt(rangeMatch[1]).toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0
        })} - ${parseInt(rangeMatch[2]).toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0
        })}`
      : parseInt(salaryValue).toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0
        });
    
    const currencyLabel = currency === 'USD' ? ' USD' : '';
    return `${isListed ? 'Listed: ' : ''}${formattedValue}${currencyLabel}`;
  };

  return (
    <div className="applications-table-section">
      {descriptionPopup.isOpen && (
        <div className="description-popup-overlay" onClick={() => setDescriptionPopup({ isOpen: false, content: '', position: '', company: '' })}>
          <div className="description-popup" onClick={e => e.stopPropagation()}>
            <div className="description-popup-header">
              <h3>{descriptionPopup.position} at {descriptionPopup.company}</h3>
              <button onClick={() => setDescriptionPopup({ isOpen: false, content: '', position: '', company: '' })}>×</button>
            </div>
            <div className="description-popup-content">
              {descriptionPopup.content || 'No description available.'}
            </div>
          </div>
        </div>
      )}

      {selectedApplication && (
        <AddApplicationForm 
          editData={selectedApplication}
          onUpdate={handleUpdate}
        />
      )}
      
      <div className="table-actions">
        <div className="filters">
          <select
            value={filters.company}
            onChange={e => setFilters(prev => ({ ...prev, company: e.target.value }))}
            className="company-filter"
          >
            {companyOptions.map(company => (
              <option key={company} value={company}>
                {company}
              </option>
            ))}
          </select>

          <select
            value={filters.position}
            onChange={e => setFilters(prev => ({ ...prev, position: e.target.value }))}
            className="position-filter"
          >
            {positionOptions.map(position => (
              <option key={position} value={position}>
                {position}
              </option>
            ))}
          </select>

          <div className="status-filter-container">
            <button 
              className="status-filter-button"
              onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
            >
              Status Filter ({filters.status.length || 'All'})
            </button>
            {isStatusDropdownOpen && (
              <div className="status-dropdown">
                <div className="status-options">
                  {statusOptions.map(status => (
                    <label key={status} className="status-option">
                      <input
                        type="checkbox"
                        checked={filters.status.includes(status)}
                        onChange={() => handleStatusChange(status)}
                      />
                      <span>{status}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
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
              <th>Links</th>
              <th>Desc</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedApplications.map(app => (
              <tr key={app.id}>
                <td>{app.company}</td>
                <td>{app.position}</td>
                <td className={`status-cell ${
                  ['Contacted', 'Applied', 'Interview', 'Offer', 'Accepted'].includes(app.status) 
                    ? 'status-active' 
                    : 'status-inactive'
                }`}>
                  {app.status}
                </td>
                <td>{app.date_applied}</td>
                <td>{app.location}</td>
                <td className="salary-cell">
                  {formatSalary(app.salary, app.is_salary_listed, app.currency)}
                  {app.has_bonus && (
                    <div className="bonus-text">Bonus option</div>
                  )}
                </td>
                <td className="links-column">
                  {app.url && (
                    <div>
                      <span>Listing: </span>
                      <a href={app.url} target="_blank" rel="noopener noreferrer">Link</a>
                    </div>
                  )}
                  {app.portal_url && (
                    <div>
                      <span>Portal: </span>
                      <a href={app.portal_url} target="_blank" rel="noopener noreferrer">Link</a>
                    </div>
                  )}
                  {app.resume_path && (
                    <div>
                      <span>Resume: </span>
                      <a 
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          openFile(app.resume_path);
                        }}
                      >Link</a>
                    </div>
                  )}
                  {app.cover_letter_path && (
                    <div>
                      <span>Cover Letter: </span>
                      <a 
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          openFile(app.cover_letter_path);
                        }}
                      >Link</a>
                    </div>
                  )}
                </td>
                <td>
                  {app.description ? (
                    <button 
                      className="description-link"
                      onClick={() => setDescriptionPopup({
                        isOpen: true,
                        content: app.description,
                        position: app.position,
                        company: app.company
                      })}
                    >
                      Desc
                    </button>
                  ) : null}
                </td>
                <td className="action-buttons">
                  <button className="edit-btn" onClick={() => handleEdit(app)} title="Edit">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34"></path>
                      <polygon points="18 2 22 6 12 16 8 16 8 12 18 2"></polygon>
                    </svg>
                  </button>
                  <button className="delete-btn" onClick={() => handleDelete(app.id)} title="Delete">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18"></path>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </td>
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

    // Calculate salary statistics with range handling
    const parseSalaryValue = (salaryString) => {
      if (!salaryString) return null;
      
      // Convert to string and clean up
      const cleaned = salaryString.toString().replace(/[,$]/g, '').trim();
      
      // Check for range (e.g., "100000-120000" or "100000 - 120000")
      const rangeMatch = cleaned.match(/(\d+)\s*[-–]\s*(\d+)/);
      
      if (rangeMatch) {
        const min = parseFloat(rangeMatch[1]);
        const max = parseFloat(rangeMatch[2]);
        return (min + max) / 2; // Return average of range
      }
      
      // Single number
      const value = parseFloat(cleaned);
      return isNaN(value) ? null : value;
    };

    const salaryData = data.reduce((acc, job) => {
      const salaryValue = parseSalaryValue(job.salary);
      
      if (salaryValue !== null) {
        // Total average calculations
        acc.totalCount++;
        acc.totalSum += salaryValue;

        // Listed salary calculations
        if (job.is_salary_listed) {
          acc.listedCount++;
          acc.listedSum += salaryValue;
        }
      }

      return acc;
    }, {
      totalSum: 0,
      totalCount: 0,
      listedSum: 0,
      listedCount: 0
    });

    const totalAvg = salaryData.totalCount > 0 ? 
      Math.round(salaryData.totalSum / salaryData.totalCount) : 0;
    
    const listedAvg = salaryData.listedCount > 0 ? 
      Math.round(salaryData.listedSum / salaryData.listedCount) : 0;

    setSalaryStats({
      totalAvg: totalAvg,
      listedAvg: listedAvg,
      difference: listedAvg - totalAvg
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