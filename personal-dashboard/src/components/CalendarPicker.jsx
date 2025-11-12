import React, { useState, useRef, useEffect } from 'react';
import '../styles/CalendarPicker.css';

function CalendarPicker({ value, onChange, placeholder = "Select date" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const calendarRef = useRef(null);

  // Parse the value if it's a string (YYYY-MM-DD format)
  const selectedDate = value ? new Date(value + 'T00:00:00') : null;

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Set current month to selected date when value changes
  useEffect(() => {
    if (selectedDate) {
      setCurrentMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    }
  }, [value]);

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDateForInput = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateForDisplay = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleDateSelect = (day) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const formattedDate = formatDateForInput(newDate);
    onChange(formattedDate);
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    const formattedDate = formatDateForInput(today);
    onChange(formattedDate);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setIsOpen(false);
  };

  const isToday = (day) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day) => {
    if (!selectedDate) return false;
    return (
      day === selectedDate.getDate() &&
      currentMonth.getMonth() === selectedDate.getMonth() &&
      currentMonth.getFullYear() === selectedDate.getFullYear()
    );
  };

  const isPastDate = (day) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date < today;
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayClasses = ['calendar-day'];
      if (isToday(day)) dayClasses.push('today');
      if (isSelected(day)) dayClasses.push('selected');
      if (isPastDate(day)) dayClasses.push('past');

      days.push(
        <div
          key={day}
          className={dayClasses.join(' ')}
          onClick={() => handleDateSelect(day)}
        >
          {day}
        </div>
      );
    }

    return (
      <div className="calendar-popup" ref={calendarRef}>
        <div className="calendar-header">
          <button type="button" className="calendar-nav-btn" onClick={handlePrevMonth}>
            ‹
          </button>
          <div className="calendar-month-year">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </div>
          <button type="button" className="calendar-nav-btn" onClick={handleNextMonth}>
            ›
          </button>
        </div>

        <div className="calendar-weekdays">
          {dayNames.map(day => (
            <div key={day} className="calendar-weekday">{day}</div>
          ))}
        </div>

        <div className="calendar-days">
          {days}
        </div>

        <div className="calendar-actions">
          <button type="button" className="calendar-action-btn today-btn" onClick={handleToday}>
            Today
          </button>
          <button type="button" className="calendar-action-btn clear-btn" onClick={handleClear}>
            Clear
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="calendar-picker">
      <div className="calendar-input-wrapper">
        <input
          type="text"
          className="calendar-input"
          value={formatDateForDisplay(selectedDate)}
          placeholder={placeholder}
          readOnly
          onClick={() => setIsOpen(!isOpen)}
        />
        <button
          type="button"
          className="calendar-toggle-btn"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle calendar"
        >
          📅
        </button>
      </div>
      {isOpen && renderCalendar()}
    </div>
  );
}

export default CalendarPicker;

