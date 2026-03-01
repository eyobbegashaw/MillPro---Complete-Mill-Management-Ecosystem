import React, { useState, useEffect } from 'react';
import { FaUserPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { useNotification } from '../../contexts/NotificationContext';
import { getUsers, saveUsers } from '../../utils/storage';
import Modal from '../common/Modal';

const OperatorManagement = () => {
  const [operators, setOperators] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingOperator, setEditingOperator] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    assignments: []
  });

  const { showToast } = useNotification();

  const assignmentOptions = ['Teff', 'Barley', 'Wheat', 'Sorghum', 'Peas', 'Beans', 'Other'];

  useEffect(() => {
    loadOperators();
  }, []);

  const loadOperators = () => {
    const usersData = getUsers();
    setOperators(usersData.operators || []);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  const handleAssignmentChange = (assignment) => {
    const updatedAssignments = formData.assignments.includes(assignment)
      ? formData.assignments.filter(a => a !== assignment)
      : [...formData.assignments, assignment];
    
    setFormData({
      ...formData,
      assignments: updatedAssignments
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      assignments: []
    });
    setEditingOperator(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const usersData = getUsers();
    
    const operatorData = {
      id: editingOperator ? editingOperator.id : Date.now(),
      ...formData,
      role: 'operator',
      createdAt: editingOperator ? editingOperator.createdAt : new Date().toISOString()
    };

    if (!usersData.operators) usersData.operators = [];

    if (editingOperator) {
      const index = usersData.operators.findIndex(o => o.id === editingOperator.id);
      if (index !== -1) {
        usersData.operators[index] = operatorData;
      }
    } else {
      usersData.operators.push(operatorData);
    }

    saveUsers(usersData);
    loadOperators();
    resetForm();
    setShowModal(false);
    showToast(`Operator ${editingOperator ? 'updated' : 'added'} successfully!`, 'success');
  };

  const handleEdit = (operator) => {
    setEditingOperator(operator);
    setFormData({
      name: operator.name || '',
      email: operator.email || '',
      phone: operator.phone || '',
      password: operator.password || '',
      assignments: operator.assignments || []
    });
    setShowModal(true);
  };

  const handleDelete = (operatorId) => {
    if (window.confirm('Are you sure you want to delete this operator?')) {
      const usersData = getUsers();
      usersData.operators = usersData.operators.filter(o => o.id !== operatorId);
      saveUsers(usersData);
      loadOperators();
      showToast('Operator deleted successfully!', 'success');
    }
  };

  return (
    <>
      <div className="section-header">
        <h2>Operator Management</h2>
        <div className="section-actions">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <FaUserPlus /> Add Operator
          </button>
        </div>
      </div>

      {/* Operators Grid */}
      <div className="operators-grid">
        {operators.map(operator => (
          <div className="operator-card" key={operator.id}>
            <div className="operator-avatar">
              <img 
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(operator.name)}&background=2196F3&color=fff`} 
                alt={operator.name} 
              />
            </div>
            <div className="operator-info">
              <h4>{operator.name}</h4>
              <p>{operator.email}</p>
              <p>{operator.phone}</p>
              <div className="operator-assignments">
                {operator.assignments ? operator.assignments.join(', ') : 'No assignments'}
              </div>
            </div>
            <div className="operator-actions">
              <button className="btn btn-icon btn-outline" onClick={() => handleEdit(operator)} title="Edit">
                <FaEdit />
              </button>
              <button className="btn btn-icon btn-danger" onClick={() => handleDelete(operator.id)} title="Delete">
                <FaTrash />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Operator Modal */}
      <Modal 
        isOpen={showModal} 
        onClose={() => { resetForm(); setShowModal(false); }}
        title={editingOperator ? 'Edit Operator' : 'Add Operator'}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input type="text" id="name" value={formData.name} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input type="email" id="email" value={formData.email} onChange={handleInputChange} required />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone">Phone *</label>
              <input type="tel" id="phone" value={formData.phone} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <input type="password" id="password" value={formData.password} onChange={handleInputChange} required />
            </div>
          </div>
          
          <div className="form-group">
            <label>Assignments *</label>
            <div className="assignment-checkboxes">
              {assignmentOptions.map(option => (
                <label key={option}>
                  <input 
                    type="checkbox" 
                    checked={formData.assignments.includes(option)}
                    onChange={() => handleAssignmentChange(option)}
                  /> {option}
                </label>
              ))}
            </div>
          </div>
          
          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={() => { resetForm(); setShowModal(false); }}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Operator</button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default OperatorManagement;