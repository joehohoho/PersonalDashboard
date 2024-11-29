import React, { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';

function UpcomingBills({ refreshTrigger }) {
  const [upcomingBills, setUpcomingBills] = useState([]);

  const generateNextDates = (bill, count) => {
    const dates = [];
    let currentDate = new Date(bill.bill_date);
    const today = new Date();

    // First, move to the next valid date after today
    while (currentDate < today) {
      switch (bill.frequency) {
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'bi-weekly':
          currentDate.setDate(currentDate.getDate() + 14);
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        case 'quarterly':
          currentDate.setMonth(currentDate.getMonth() + 3);
          break;
        case 'yearly':
          currentDate.setFullYear(currentDate.getFullYear() + 1);
          break;
        default:
          break;
      }
    }

    // Then generate future dates
    for (let i = 0; i < count; i++) {
      dates.push({
        ...bill,
        nextDueDate: new Date(currentDate),
        instanceId: `${bill.id}-${i}` // Unique ID for each instance
      });

      switch (bill.frequency) {
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'bi-weekly':
          currentDate.setDate(currentDate.getDate() + 14);
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        case 'quarterly':
          currentDate.setMonth(currentDate.getMonth() + 3);
          break;
        case 'yearly':
          currentDate.setFullYear(currentDate.getFullYear() + 1);
          break;
        default:
          break;
      }
    }

    return dates;
  };

  useEffect(() => {
    const fetchUpcomingBills = async () => {
      const { data, error } = await supabase
        .from('bills')
        .select('*');

      if (error) {
        console.error('Error fetching bills:', error);
        return;
      }

      // Generate multiple future dates for each bill
      const allFutureBills = data.flatMap(bill => 
        generateNextDates(bill, 6) // Generate 6 future dates for each bill
      );

      // Sort by next due date and take first 6
      const sortedBills = allFutureBills
        .sort((a, b) => a.nextDueDate - b.nextDueDate)
        .slice(0, 6);

      setUpcomingBills(sortedBills);
    };

    fetchUpcomingBills();
  }, [refreshTrigger]);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: '2-digit'
    }).replace(/ /g, '-');
  };

  const calculateDaysUntil = (dueDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays.toString().padStart(2, '0'); // Pad with leading zero if needed
  };

  return (
    <div className="bill-form-card">
      <h3>Upcoming Bills</h3>
      <table className="upcoming-bills-table">
        <thead>
          <tr>
            <th>Bill Name</th>
            <th>Amount</th>
            <th>Due Date</th>
            <th>Due In</th>
            <th>Frequency</th>
          </tr>
        </thead>
        <tbody>
          {upcomingBills.map((bill) => (
            <tr key={bill.instanceId}>
              <td>{bill.name}</td>
              <td>${bill.amount.toFixed(2)}</td>
              <td>{formatDate(bill.nextDueDate)}</td>
              <td>{calculateDaysUntil(bill.nextDueDate)}</td>
              <td>{bill.frequency}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default UpcomingBills; 