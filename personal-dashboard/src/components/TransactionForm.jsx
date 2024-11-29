import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

function TransactionForm({ refreshTrigger, setRefreshTrigger, editingTransaction, setEditingTransaction }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [transactionTypes, setTransactionTypes] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    transaction_type_id: '',
    transaction_date: '',
    payment_method_id: '',
    detailed_description: ''
  });

  // Load editing transaction data into form
  useEffect(() => {
    if (editingTransaction) {
      setFormData({
        description: editingTransaction.description,
        amount: editingTransaction.amount,
        transaction_type_id: editingTransaction.transaction_type_id || '',
        transaction_date: editingTransaction.transaction_date,
        payment_method_id: editingTransaction.payment_method_id || '',
        detailed_description: editingTransaction.detailed_description || ''
      });
      setIsFormOpen(true);
    }
  }, [editingTransaction]);

  useEffect(() => {
    const fetchFormData = async () => {
      const { data: types } = await supabase
        .from('transaction_types')
        .select('*')
        .order('name');
      
      const { data: methods } = await supabase
        .from('payment_methods')
        .select('*')
        .order('name');

      if (types) setTransactionTypes(types);
      if (methods) setPaymentMethods(methods);
    };

    fetchFormData();
  }, [refreshTrigger]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const transactionData = {
      description: formData.description,
      amount: parseFloat(formData.amount),
      transaction_type_id: formData.transaction_type_id || null,
      transaction_date: formData.transaction_date,
      payment_method_id: formData.payment_method_id || null,
      detailed_description: formData.detailed_description || null
    };

    let error;
    
    if (editingTransaction) {
      const { error: updateError } = await supabase
        .from('transactions')
        .update(transactionData)
        .eq('id', editingTransaction.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('transactions')
        .insert([transactionData]);
      error = insertError;
    }

    if (error) {
      console.error('Error saving transaction:', error);
    } else {
      setFormData({
        description: '',
        amount: '',
        transaction_type_id: '',
        transaction_date: '',
        payment_method_id: '',
        detailed_description: ''
      });
      setEditingTransaction(null);
      setRefreshTrigger(prev => prev + 1);
    }
  };

  return (
    <div className="transaction-form-card">
      <div className="card-header" onClick={() => setIsFormOpen(!isFormOpen)}>
        <h3>{editingTransaction ? 'Edit Transaction' : 'New Transaction'}</h3>
        <button className="collapse-btn">
          {isFormOpen ? '▼' : '▶'}
        </button>
      </div>
      
      {isFormOpen && (
        <form onSubmit={handleSubmit} className="transaction-form">
          <div className="form-group">
            <label htmlFor="description">Transaction Description</label>
            <input
              id="description"
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="amount">Transaction Amount</label>
            <input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="type">Transaction Type</label>
            <select
              id="type"
              value={formData.transaction_type_id}
              onChange={(e) => setFormData({ ...formData, transaction_type_id: e.target.value })}
            >
              <option value="">Select Type</option>
              {transactionTypes.map(type => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="transactionDate">Transaction Date</label>
            <input
              id="transactionDate"
              type="date"
              value={formData.transaction_date}
              onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="paymentMethod">Payment Method</label>
            <select
              id="paymentMethod"
              value={formData.payment_method_id}
              onChange={(e) => setFormData({ ...formData, payment_method_id: e.target.value })}
            >
              <option value="">Select Payment Method</option>
              {paymentMethods.map(method => (
                <option key={method.id} value={method.id}>{method.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="details">Detail Description</label>
            <textarea
              id="details"
              value={formData.detailed_description}
              onChange={(e) => setFormData({ ...formData, detailed_description: e.target.value })}
              rows="3"
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-btn">
              {editingTransaction ? 'Update Transaction' : 'Save Transaction'}
            </button>
            {editingTransaction && (
              <button 
                type="button" 
                className="cancel-btn"
                onClick={() => {
                  setEditingTransaction(null);
                  setFormData({
                    description: '',
                    amount: '',
                    transaction_type_id: '',
                    transaction_date: '',
                    payment_method_id: '',
                    detailed_description: ''
                  });
                }}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}

export default TransactionForm; 