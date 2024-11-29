import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

function TransactionTable({ refreshTrigger, setEditingTransaction }) {
  const [isTableOpen, setIsTableOpen] = useState(false);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    if (isTableOpen) {
      fetchTransactions();
    }
  }, [isTableOpen, refreshTrigger]);

  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        transaction_types(name),
        payment_methods(name)
      `)
      .order('transaction_date', { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', error);
    } else {
      setTransactions(data);
    }
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    // Scroll to transaction form
    document.querySelector('.transaction-form-card').scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() + userTimezoneOffset).toLocaleDateString();
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="transaction-table-card">
      <div className="card-header" onClick={() => setIsTableOpen(!isTableOpen)}>
        <h3>Transaction History</h3>
        <button className="collapse-btn">
          {isTableOpen ? '▼' : '▶'}
        </button>
      </div>

      {isTableOpen && (
        <div className="table-container">
          <table className="transaction-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Type</th>
                <th>Method</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(transaction => (
                <tr key={transaction.id}>
                  <td>{formatDate(transaction.transaction_date)}</td>
                  <td>{transaction.description}</td>
                  <td>{transaction.transaction_types?.name || '-'}</td>
                  <td>{transaction.payment_methods?.name || '-'}</td>
                  <td className="amount">{formatAmount(transaction.amount)}</td>
                  <td>
                    <button 
                      onClick={() => handleEdit(transaction)} 
                      className="edit-btn"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default TransactionTable; 