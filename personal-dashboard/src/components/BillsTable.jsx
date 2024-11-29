import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import '../styles/BillsTable.css';

function BillsTable({ refreshTrigger }) {
  const [bills, setBills] = useState([]);
  const [filters, setFilters] = useState({
    frequency: '',
    sortColumn: 'bill_date',
    sortDirection: 'asc'
  });
  const [editingBill, setEditingBill] = useState(null);
  const [isTableOpen, setIsTableOpen] = useState(false);

  useEffect(() => {
    fetchBills();
  }, [refreshTrigger]);

  async function fetchBills() {
    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .order('bill_date', { ascending: true });

    if (error) {
      console.error('Error fetching bills:', error);
    } else {
      setBills(data);
    }
  }

  async function handleUpdateBill(bill) {
    const { error } = await supabase
      .from('bills')
      .update({
        name: bill.name,
        amount: parseFloat(bill.amount),
        frequency: bill.frequency,
        bill_date: bill.bill_date
      })
      .eq('id', bill.id);

    if (error) {
      console.error('Error updating bill:', error);
    } else {
      setEditingBill(null);
      fetchBills();
    }
  }

  const handleColumnSort = (column) => {
    setFilters(prev => ({
      ...prev,
      sortColumn: column,
      sortDirection: prev.sortColumn === column && prev.sortDirection === 'asc' ? 'desc' : 'asc'
    }));
  };

  const filteredBills = bills
    .filter(bill => {
      return !filters.frequency || bill.frequency === filters.frequency;
    })
    .sort((a, b) => {
      let aValue, bValue;
      switch (filters.sortColumn) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'amount':
          aValue = parseFloat(a.amount);
          bValue = parseFloat(b.amount);
          break;
        case 'frequency':
          aValue = a.frequency;
          bValue = b.frequency;
          break;
        case 'bill_date':
          aValue = a.bill_date;
          bValue = b.bill_date;
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

  const calculateTotalAmount = (bills) => {
    return bills.reduce((total, bill) => total + Number(bill.amount), 0);
  };

  return (
    <div className="bills-table">
      <div className="card-header" onClick={() => setIsTableOpen(!isTableOpen)}>
        <h3>Bills</h3>
        <button className="collapse-btn">
          {isTableOpen ? '▼' : '▶'}
        </button>
      </div>

      {isTableOpen && (
        <div className="table-content">
          <div className="table-filters">
            <div className="filter-group">
              <label>Frequency</label>
              <select
                value={filters.frequency}
                onChange={(e) => setFilters({ ...filters, frequency: e.target.value })}
              >
                <option value="">All Frequencies</option>
                <option value="yearly">Yearly</option>
                <option value="quarterly">Quarterly</option>
                <option value="monthly">Monthly</option>
                <option value="bi-weekly">Bi-Weekly</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>

            <div className="filter-group">
              <button 
                className="clear-filters-btn"
                onClick={() => setFilters({
                  frequency: '',
                  sortColumn: 'bill_date',
                  sortDirection: 'asc'
                })}
              >
                Clear Filters
              </button>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th onClick={() => handleColumnSort('name')}>
                  Name {filters.sortColumn === 'name' && (filters.sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleColumnSort('amount')}>
                  Amount {filters.sortColumn === 'amount' && (filters.sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleColumnSort('frequency')}>
                  Frequency {filters.sortColumn === 'frequency' && (filters.sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleColumnSort('bill_date')}>
                  Bill Date {filters.sortColumn === 'bill_date' && (filters.sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.map(bill => (
                <tr key={bill.id}>
                  {editingBill?.id === bill.id ? (
                    <>
                      <td>
                        <input
                          type="text"
                          value={editingBill.name}
                          onChange={(e) => setEditingBill({
                            ...editingBill,
                            name: e.target.value
                          })}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          value={editingBill.amount}
                          onChange={(e) => setEditingBill({
                            ...editingBill,
                            amount: e.target.value
                          })}
                        />
                      </td>
                      <td>
                        <select
                          value={editingBill.frequency}
                          onChange={(e) => setEditingBill({
                            ...editingBill,
                            frequency: e.target.value
                          })}
                        >
                          <option value="yearly">Yearly</option>
                          <option value="quarterly">Quarterly</option>
                          <option value="monthly">Monthly</option>
                          <option value="bi-weekly">Bi-Weekly</option>
                          <option value="weekly">Weekly</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="date"
                          value={editingBill.bill_date}
                          onChange={(e) => setEditingBill({
                            ...editingBill,
                            bill_date: e.target.value
                          })}
                        />
                      </td>
                      <td>
                        <button onClick={() => handleUpdateBill(editingBill)}>Save</button>
                        <button onClick={() => setEditingBill(null)}>Cancel</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{bill.name}</td>
                      <td>${Number(bill.amount).toFixed(2)}</td>
                      <td>{bill.frequency}</td>
                      <td>{bill.bill_date}</td>
                      <td>
                        <button onClick={() => setEditingBill(bill)}>Edit</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="1" style={{ textAlign: 'right', fontWeight: 'bold' }}>
                  Totals ({filteredBills.length} bills):
                </td>
                <td style={{ fontWeight: 'bold' }}>
                  ${calculateTotalAmount(filteredBills).toFixed(2)}
                </td>
                <td colSpan="3"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

export default BillsTable; 