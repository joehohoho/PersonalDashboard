import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

function TransactionForm({ refreshTrigger, setRefreshTrigger }) {
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
    
    const { data, error } = await supabase
      .from('transactions')
      .insert([{
        description: formData.description,
        amount: parseFloat(formData.amount),
        transaction_type_id: formData.transaction_type_id || null,
        transaction_date: formData.transaction_date,
        payment_method_id: formData.payment_method_id || null,
        detailed_description: formData.detailed_description || null
      }])
      .select();

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
      setRefreshTrigger(prev => prev + 1);
    }
  };

  return (
    <div className="transaction-form-card">
      <div className="card-header" onClick={() => setIsFormOpen(!isFormOpen)}>
        <h3>New Transaction</h3>
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

          <button type="submit" className="submit-btn">Save Transaction</button>
        </form>
      )}
    </div>
  );
}

export default TransactionForm; 