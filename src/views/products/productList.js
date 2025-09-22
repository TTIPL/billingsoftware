import React, { useEffect, useState } from 'react';
import {
  CCard, CCardBody, CCardHeader, CCol, CRow, CTable, CTableBody,
  CTableHead, CTableHeaderCell, CTableRow, CTableDataCell,
  CForm, CFormInput, CButton, CAlert, CFormSelect
} from '@coreui/react';
import axios from 'axios';
import { api_url } from '../../../config';

const initialForm = {
  prod_name: '',
  prod_price_1: '',
  prod_price_2: '',
  prod_price_3: '',
  created_by: 1,
  updated_by: 1,
  qty_id: '',
  parent_produc_id: '',
};

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState('');
  const [qtyList, setQtyList] = useState([]);
  const [parentList, setParentList] = useState([]);

  useEffect(() => {
    fetchProducts();
    fetchQtyTypes();
    fetchParentProducts();
  }, []);

  const fetchProducts = () => {
    axios.get(`${api_url}products`)
      .then(res => setProducts(res.data))
      .catch(err => console.error(err));
  };

  const fetchQtyTypes = () => {
    axios.get(`${api_url}quantity-types`)
      .then(res => setQtyList(res.data))
      .catch(err => console.error(err));
  };

  const fetchParentProducts = () => {
    axios.get(`${api_url}parent-products`)
      .then(res => setParentList(res.data))
      .catch(err => console.error(err));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const roundToTwo = (num) => Math.round(num);
  
    if (name === "prod_price_1") {
      const price1 = parseFloat(value) || 0;
      const price2 = roundToTwo(price1 * 1.02); // +2%
      const price3 = roundToTwo(price1 * 1.03); // +3%
  
      setForm(prev => ({
        ...prev,
        prod_price_1: value,
        prod_price_2: price2,
        prod_price_3: price3,
      }));
    } else {
      setForm(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };
  

  
  const validateForm = (form) => {
    const errors = {}
  
    if (!form.prod_name.trim()) {
      errors.prod_name = "Product name is required"
    }
  
    if (!form.prod_price_1 || isNaN(form.prod_price_1) || Number(form.prod_price_1) <= 0) {
      errors.prod_price_1 = "Price 1 must be a number greater than 0"
    }
  
    if (!form.prod_price_2 || isNaN(form.prod_price_2) || Number(form.prod_price_2) <= 0) {
      errors.prod_price_2 = "Price 2 must be a number greater than 0"
    }
  
    if (!form.prod_price_3 || isNaN(form.prod_price_3) || Number(form.prod_price_3) <= 0) {
      errors.prod_price_3 = "Price 3 must be a number greater than 0"
    }
  
    if (!form.qty_id) {
      errors.qty_id = "Quantity ID is required"
    }
  
    if (!form.parent_produc_id) {
      errors.parent_produc_id = "Parent Product ID is required"
    }
  
    return errors
  }
  


  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = validateForm(form)
    if (Object.keys(errors).length > 0) {
      const errorMessages = Object.values(errors).join("\n")
      alert(errorMessages)
      return
    }
    if (editId) {
      axios.put(`${api_url}products/${editId}`, form)
        .then(() => {
          fetchProducts();
          resetForm();
          setMessage('Product updated');
        });
    } else {
      axios.post(`${api_url}products`, form)
        .then(() => {
          fetchProducts();
          resetForm();
          setMessage('Product created');
        });
    }
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditId(null);
  };

  const handleEdit = (product) => {
    setForm(product);
    setEditId(product.prod_id);
  };



  return (
    <CRow>
      <CCol md={12}>
        <CCard>
          <CCardHeader>{editId ? 'Edit Product' : 'Add Product'}</CCardHeader>
          <CCardBody>
            {message && <CAlert>{message}</CAlert>}
            <CForm onSubmit={handleSubmit}>
              <CRow>
                <CCol md={4}>
                  <CFormInput
                    name="prod_name"
                    value={form.prod_name}
                    onChange={handleChange}
                    label="Product Name"
                    required
                  />
                </CCol>
                <CCol md={4}>
                  <CFormInput
                    name="prod_price_1"
                    type='number'
                    value={form.prod_price_1}
                    onChange={handleChange}
                    label="Price 1"
                  />
                </CCol>
                <CCol md={4}>
                  <CFormInput
                    name="prod_price_2"
                    type='number'
                    value={form.prod_price_2}
                    onChange={handleChange}
                    label="Price 2"
                    disabled
                  />
                </CCol>
                <CCol md={4} className="mt-2">
                  <CFormInput
                    name="prod_price_3"
                    type='number'
                    value={form.prod_price_3}
                    onChange={handleChange}
                    label="Price 3"
                    disabled
                  />
                </CCol>
                <CCol md={4} className="mt-2">
                  <CFormSelect
                    name="qty_id"
                    value={form.qty_id}
                    onChange={handleChange}
                    label="Quantity Type"
                  >
                    <option value="">Select Quantity Type</option>
                    {qtyList.map(q => (
                      <option key={q.quantity_type_id} value={q.quantity_type_id}>
                        {q.quantity_type_name}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
                <CCol md={4} className="mt-2">
                  <CFormSelect
                    name="parent_produc_id"
                    value={form.parent_produc_id}
                    onChange={handleChange}
                    label="Parent Product"
                  >
                    <option value="">Select Parent Product</option>
                    {parentList.map(p => (
                      <option key={p.parent_id} value={p.parent_id}>
                        {p.parent_product_name}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
              </CRow>

              <CButton type="submit" color={editId ? 'warning' : 'primary'} className="mt-3">
                {editId ? 'Update' : 'Add'}
              </CButton>
              {editId && <CButton color="secondary" onClick={resetForm} className="mt-3 ms-2">Cancel</CButton>}
            </CForm>
          </CCardBody>
        </CCard>
      </CCol>

      <CCol md={12}>
        <CCard>
          <CCardHeader>Product List</CCardHeader>
          <CCardBody>
            <CTable bordered hover responsive>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>#</CTableHeaderCell>
                  <CTableHeaderCell>Name</CTableHeaderCell>
                  <CTableHeaderCell>Price 1</CTableHeaderCell>
                  <CTableHeaderCell>Price 2</CTableHeaderCell>
                  <CTableHeaderCell>Price 3</CTableHeaderCell>
                  <CTableHeaderCell>Quantity Type</CTableHeaderCell>
                  <CTableHeaderCell>Parent Product</CTableHeaderCell>
                  <CTableHeaderCell>Actions</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {products.map((p, i) => (
                  <CTableRow key={p.prod_id}>
                    <CTableHeaderCell>{i + 1}</CTableHeaderCell>
                    <CTableDataCell>{p.prod_name}</CTableDataCell>
                    <CTableDataCell>{p.prod_price_1}</CTableDataCell>
                    <CTableDataCell>{p.prod_price_2}</CTableDataCell>
                    <CTableDataCell>{p.prod_price_3}</CTableDataCell>
                    <CTableDataCell>{p.quantity_type_name || '-'}</CTableDataCell>
                    <CTableDataCell>{p.parent_product_name || '-'}</CTableDataCell>
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

export default ProductList;
