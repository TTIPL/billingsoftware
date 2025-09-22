// ParentProduct.js
import React, { useEffect, useState } from 'react';
import {
  CCard, CCardBody, CCardHeader, CCol, CRow, CForm, CFormInput,
  CButton, CTable, CTableBody, CTableDataCell, CTableHead, CTableHeaderCell,
  CTableRow, CAlert,
} from '@coreui/react';
import axios from 'axios';
import { api_url } from '../../../config';

const ParentProduct = () => {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ parent_product_name: '' });
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState('');

  const API = `${api_url}parent-products`;

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = () => {
    axios.get(API).then(res => setProducts(res.data));
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editId) {
      axios.put(`${API}/${editId}`, form)
        .then(() => {
          setMessage('Updated!');
          resetForm();
          fetchProducts();
        });
    } else {
      axios.post(API, form)
        .then(() => {
          setMessage('Created!');
          resetForm();
          fetchProducts();
        });
    }
  };

  const resetForm = () => {
    setForm({ parent_product_name: '' });
    setEditId(null);
  };

  const handleEdit = (product) => {
    setForm(product);
    setEditId(product.parent_id);
    setMessage('');
  };

  const handleDelete = (id) => {
    if (window.confirm('Confirm delete?')) {
      axios.delete(`${API}/${id}`)
        .then(() => {
          setMessage('Deleted!');
          fetchProducts();
        });
    }
  };

  return (
    <CRow>
      <CCol md={6}>
        <CCard>
          <CCardHeader>{editId ? 'Edit' : 'Add'} Parent Product</CCardHeader>
          <CCardBody>
            {message && <CAlert color="info">{message}</CAlert>}
            <CForm onSubmit={handleSubmit}>
              <CFormInput
                label="Product Name"
                name="parent_product_name"
                value={form.parent_product_name}
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
          <CCardHeader>Parent Products</CCardHeader>
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
                {products.map((p, i) => (
                  <CTableRow key={p.parent_id}>
                    <CTableDataCell>{i + 1}</CTableDataCell>
                    <CTableDataCell>{p.parent_product_name}</CTableDataCell>
                    <CTableDataCell>
                      <CButton size="sm" color="info" onClick={() => handleEdit(p)} className="me-1">Edit</CButton>
                     
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

export default ParentProduct;
