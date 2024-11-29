import React, { useState } from 'react';
import { supabase } from '../config/supabase';
import BillsTable from './BillsTable';
import UpcomingBills from './UpcomingBills';
import TransactionForm from './TransactionForm';
import TransactionTypeForm from './TransactionTypeForm';
import PaymentMethodForm from './PaymentMethodForm';
import '../styles/Finance.css';

function Finance() {
  const [billForm, setBillForm] = useState({
    name: '',
    amount: '',
    frequency: 'monthly',
    bill_date: ''
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const { data, error } = await supabase
      .from('bills')
      .insert([{
        name: billForm.name,
        amount: parseFloat(billForm.amount),
        frequency: billForm.frequency,
        bill_date: billForm.bill_date
      }])
      .select();

    if (error) {
      console.error('Error saving bill:', error);
    } else {
      setBillForm({
        name: '',
        amount: '',
        frequency: 'monthly',
        bill_date: ''
      });
      setRefreshTrigger(prev => prev + 1);
    }
  };

  return (
    <div className="finance">
      <div className="finance-content">
        <UpcomingBills refreshTrigger={refreshTrigger} />
        <TransactionForm refreshTrigger={refreshTrigger} setRefreshTrigger={setRefreshTrigger} />
        <BillsTable refreshTrigger={refreshTrigger} />
        <div className="bill-form-card">
          <div className="card-header" onClick={() => setIsFormOpen(!isFormOpen)}>
            <h3>Add New Bill</h3>
            <button className="collapse-btn">
              {isFormOpen ? '▼' : '▶'}
            </button>
          </div>
          
          {isFormOpen && (
            <form onSubmit={handleSubmit} className="bill-form">
              <div className="form-group">
                <label htmlFor="billName">Bill Name</label>
                <input
                  id="billName"
                  type="text"
                  value={billForm.name}
                  onChange={(e) => setBillForm({ ...billForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="amount">Payment Amount</label>
                <input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={billForm.amount}
                  onChange={(e) => setBillForm({ ...billForm, amount: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="frequency">Payment Frequency</label>
                <select
                  id="frequency"
                  value={billForm.frequency}
                  onChange={(e) => setBillForm({ ...billForm, frequency: e.target.value })}
                  required
                >
                  <option value="yearly">Yearly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="monthly">Monthly</option>
                  <option value="bi-weekly">Bi-Weekly</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="billDate">Bill Date</label>
                <input
                  id="billDate"
                  type="date"
                  value={billForm.bill_date}
                  onChange={(e) => setBillForm({ ...billForm, bill_date: e.target.value })}
                  required
                />
              </div>

              <button type="submit" className="submit-btn">Save Bill</button>
            </form>
          )}
        </div>
        <TransactionTypeForm refreshTrigger={refreshTrigger} setRefreshTrigger={setRefreshTrigger} />
        <PaymentMethodForm refreshTrigger={refreshTrigger} setRefreshTrigger={setRefreshTrigger} />
      </div>
    </div>
  );
}

export default Finance; 