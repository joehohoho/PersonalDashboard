import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import BillsTable from './BillsTable';
import UpcomingBills from './UpcomingBills';
import TransactionForm from './TransactionForm';
import TransactionTypeForm from './TransactionTypeForm';
import PaymentMethodForm from './PaymentMethodForm';
import TransactionTable from './TransactionTable';
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
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [metrics, setMetrics] = useState({
    monthlyIncome: 0,
    monthlyExpenses: 0,
    monthlyBalance: 0,
    upcomingBills: 0,
    ytdIncome: 0,
    ytdExpenses: 0
  });

  useEffect(() => {
    fetchMetrics();
  }, [refreshTrigger]);

  const fetchMetrics = async () => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayOfYear = new Date(today.getFullYear(), 0, 1);

    // Fetch monthly income
    const { data: monthlyIncomeData } = await supabase
      .from('transactions')
      .select('amount')
      .gte('transaction_date', firstDayOfMonth.toISOString())
      .eq('type', 'income');

    // Fetch monthly expenses
    const { data: monthlyExpensesData } = await supabase
      .from('transactions')
      .select('amount')
      .gte('transaction_date', firstDayOfMonth.toISOString())
      .eq('type', 'expense');

    // Fetch YTD income
    const { data: ytdIncomeData } = await supabase
      .from('transactions')
      .select('amount')
      .gte('transaction_date', firstDayOfYear.toISOString())
      .eq('type', 'income');

    // Fetch YTD expenses
    const { data: ytdExpensesData } = await supabase
      .from('transactions')
      .select('amount')
      .gte('transaction_date', firstDayOfYear.toISOString())
      .eq('type', 'expense');

    // Fetch upcoming bills (next 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    const { data: upcomingBillsData } = await supabase
      .from('bills')
      .select('amount')
      .gte('bill_date', today.toISOString().split('T')[0])
      .lte('bill_date', thirtyDaysFromNow.toISOString().split('T')[0]);

    // Calculate totals
    const monthlyIncome = monthlyIncomeData?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    const monthlyExpenses = monthlyExpensesData?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    const ytdIncome = ytdIncomeData?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    const ytdExpenses = ytdExpensesData?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    const upcomingBills = upcomingBillsData?.reduce((sum, b) => sum + Number(b.amount), 0) || 0;

    setMetrics({
      monthlyIncome,
      monthlyExpenses,
      monthlyBalance: monthlyIncome - monthlyExpenses,
      upcomingBills,
      ytdIncome,
      ytdExpenses
    });
  };

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
        <TransactionForm 
          refreshTrigger={refreshTrigger} 
          setRefreshTrigger={setRefreshTrigger}
          editingTransaction={editingTransaction}
          setEditingTransaction={setEditingTransaction}
        />
        <TransactionTable 
          refreshTrigger={refreshTrigger} 
          setEditingTransaction={setEditingTransaction}
        />
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
        <div className="metrics-row">
          <div className="metric-card">
            <h3>Monthly Income</h3>
            <p><span className="currency">$</span>{metrics.monthlyIncome.toFixed(2)}</p>
          </div>
          <div className="metric-card">
            <h3>Monthly Expenses</h3>
            <p><span className="currency">$</span>{metrics.monthlyExpenses.toFixed(2)}</p>
          </div>
          <div className="metric-card">
            <h3>Monthly Balance</h3>
            <p><span className="currency">$</span>{metrics.monthlyBalance.toFixed(2)}</p>
          </div>
          <div className="metric-card">
            <h3>Upcoming Bills</h3>
            <p><span className="currency">$</span>{metrics.upcomingBills.toFixed(2)}</p>
          </div>
          <div className="metric-card">
            <h3>YTD Income</h3>
            <p><span className="currency">$</span>{metrics.ytdIncome.toFixed(2)}</p>
          </div>
          <div className="metric-card">
            <h3>YTD Expenses</h3>
            <p><span className="currency">$</span>{metrics.ytdExpenses.toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Finance; 