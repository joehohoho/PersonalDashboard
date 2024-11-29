import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

function PaymentMethodForm({ refreshTrigger, setRefreshTrigger }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [methods, setMethods] = useState([]);
  const [editingMethod, setEditingMethod] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    fetchMethods();
  }, [refreshTrigger]);

  const fetchMethods = async () => {
    const { data } = await supabase
      .from('payment_methods')
      .select('*')
      .order('name');
    if (data) setMethods(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (editingMethod) {
      const { error } = await supabase
        .from('payment_methods')
        .update({
          name: formData.name,
          description: formData.description
        })
        .eq('id', editingMethod.id);

      if (!error) {
        setEditingMethod(null);
      }
    } else {
      const { error } = await supabase
        .from('payment_methods')
        .insert([{
          name: formData.name,
          description: formData.description
        }]);

      if (error) {
        console.error('Error saving payment method:', error);
      }
    }

    setFormData({ name: '', description: '' });
    setRefreshTrigger(prev => prev + 1);
  };

  const handleEdit = (method) => {
    setEditingMethod(method);
    setFormData({
      name: method.name,
      description: method.description || ''
    });
  };

  return (
    <div className="payment-method-form-card">
      <div className="card-header" onClick={() => setIsFormOpen(!isFormOpen)}>
        <h3>Payment Methods</h3>
        <button className="collapse-btn">
          {isFormOpen ? '▼' : '▶'}
        </button>
      </div>
      
      {isFormOpen && (
        <>
          <form onSubmit={handleSubmit} className="method-form">
            <div className="form-group">
              <label htmlFor="methodName">Payment Method Name</label>
              <input
                id="methodName"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="methodDescription">Payment Method Description</label>
              <textarea
                id="methodDescription"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="2"
              />
            </div>

            <button type="submit" className="submit-btn">
              {editingMethod ? 'Update Method' : 'Save Method'}
            </button>
          </form>

          <div className="methods-list">
            {methods.map(method => (
              <div key={method.id} className="method-item">
                <div>
                  <strong>{method.name}</strong>
                  {method.description && <p>{method.description}</p>}
                </div>
                <button onClick={() => handleEdit(method)} className="edit-btn">Edit</button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default PaymentMethodForm; 