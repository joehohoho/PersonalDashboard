import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

function TransactionTypeForm({ refreshTrigger, setRefreshTrigger }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [types, setTypes] = useState([]);
  const [editingType, setEditingType] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    fetchTypes();
  }, [refreshTrigger]);

  const fetchTypes = async () => {
    const { data } = await supabase
      .from('transaction_types')
      .select('*')
      .order('name');
    if (data) setTypes(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (editingType) {
      const { error } = await supabase
        .from('transaction_types')
        .update({
          name: formData.name,
          description: formData.description
        })
        .eq('id', editingType.id);

      if (!error) {
        setEditingType(null);
      }
    } else {
      const { error } = await supabase
        .from('transaction_types')
        .insert([{
          name: formData.name,
          description: formData.description
        }]);

      if (error) {
        console.error('Error saving transaction type:', error);
      }
    }

    setFormData({ name: '', description: '' });
    setRefreshTrigger(prev => prev + 1);
  };

  const handleEdit = (type) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      description: type.description || ''
    });
  };

  return (
    <div className="transaction-type-form-card">
      <div className="card-header" onClick={() => setIsFormOpen(!isFormOpen)}>
        <h3>Transaction Types</h3>
        <button className="collapse-btn">
          {isFormOpen ? '▼' : '▶'}
        </button>
      </div>
      
      {isFormOpen && (
        <>
          <form onSubmit={handleSubmit} className="type-form">
            <div className="form-group">
              <label htmlFor="typeName">Type Name</label>
              <input
                id="typeName"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="typeDescription">Type Description</label>
              <textarea
                id="typeDescription"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="2"
              />
            </div>

            <button type="submit" className="submit-btn">
              {editingType ? 'Update Type' : 'Save Type'}
            </button>
          </form>

          <div className="types-list">
            {types.map(type => (
              <div key={type.id} className="type-item">
                <div>
                  <strong>{type.name}</strong>
                  {type.description && <p>{type.description}</p>}
                </div>
                <button onClick={() => handleEdit(type)} className="edit-btn">Edit</button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default TransactionTypeForm; 