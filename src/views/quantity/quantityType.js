// QuantityType.js
import React, { useEffect, useState } from 'react';
import {
  CCard, CCardBody, CCardHeader, CCol, CRow, CForm, CFormInput,
  CButton, CTable, CTableBody, CTableDataCell, CTableHead, CTableHeaderCell,
  CTableRow, CAlert,
} from '@coreui/react';
import axios from 'axios';

const QuantityType = () => {
  const [types, setTypes] = useState([]);
  const [form, setForm] = useState({ quantity_type_name: '' });
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState('');

  const API = 'http://localhost:5000/api/quantity-types';

  useEffect(() => {
    fetchTypes();
  }, []);

  const fetchTypes = () => {
    axios.get(API)
      .then(res => setTypes(res.data))
      .catch(err => console.error(err));
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const request = editId
      ? axios.put(`${API}/${editId}`, form)
      : axios.post(API, form);

    request
      .then(() => {
        setMessage(editId ? 'Updated!' : 'Created!');
        resetForm();
        fetchTypes();
      })
      .catch(err => console.error(err));
  };

  const resetForm = () => {
    setForm({ quantity_type_name: '' });
    setEditId(null);
  };

  const handleEdit = (type) => {
    setForm(type);
    setEditId(type.quantity_type_id);
    setMessage('');
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure to delete?')) {
      axios.delete(`${API}/${id}`)
        .then(() => {
          setMessage('Deleted!');
          fetchTypes();
        })
        .catch(err => console.error(err));
    }
  };

  return (
    <CRow>
      <CCol md={6}>
        <CCard>
          <CCardHeader>{editId ? 'Edit' : 'Add'} Quantity Type</CCardHeader>
          <CCardBody>
            {message && <CAlert color="info">{message}</CAlert>}
            <CForm onSubmit={handleSubmit}>
              <CFormInput
                label="Quantity Type Name"
                name="quantity_type_name"
                value={form.quantity_type_name}
                onChange={handleChange}
                required
                className="mb-3"
              />
              <CButton type="submit" color="primary">
                {editId ? 'Update' : 'Create'}
              </CButton>
              {editId && (
                <CButton color="secondary" onClick={resetForm} className="ms-2">
                  Cancel
                </CButton>
              )}
            </CForm>
          </CCardBody>
        </CCard>
      </CCol>

      <CCol md={6}>
        <CCard>
          <CCardHeader>Quantity Types</CCardHeader>
          <CCardBody>
            <CTable>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>#</CTableHeaderCell>
                  <CTableHeaderCell>Name</CTableHeaderCell>
                  <CTableHeaderCell>Actions</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {types.map((type, index) => (
                  <CTableRow key={type.quantity_type_id}>
                    <CTableDataCell>{index + 1}</CTableDataCell>
                    <CTableDataCell>{type.quantity_type_name}</CTableDataCell>
                    <CTableDataCell>
                      <CButton size="sm" color="info" onClick={() => handleEdit(type)} className="me-2">
                        Edit
                      </CButton>
                      
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  );
};

export default QuantityType;
