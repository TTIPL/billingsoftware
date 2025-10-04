import React, { useState, useEffect } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CButton,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
} from '@coreui/react'
import Select from 'react-select'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import axios from 'axios'
import { createBilling } from '../services/api'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { api_url } from '../../../config'

const BillingCreation = () => {
  const navigate = useNavigate();
  const [billings, setBillings] = useState([])
  const [parentList, setParentList] = useState([])
  const [customerList, setCustomerList] = useState([])
  const [productOptions, setProductOptions] = useState([])
  const [form, setForm] = useState({
    description: '',
    customerId: '',
    parent_produc_id: '',
    products: [] // array of added products
  });
  const [newProduct, setNewProduct] = useState({
    product: '',
    price: '',
    qty: '',
  })

  console.log(billings,
  )
  useEffect(() => {
    fetchParentProducts()
    fetchCustomers()
    fetchgetBillingDetails()
  }, [])

  const fetchParentProducts = () => {
    axios
      .get(`${api_url}parent-products`)
      .then((res) => setParentList(res.data))
      .catch((err) => console.error(err))
  }

  const fetchCustomers = () => {
    axios
      .get(`${api_url}customers`)
      .then((res) => setCustomerList(res.data))
      .catch((err) => console.error(err))
  }

  const fetchgetBillingDetails = () => {
    axios.get(`${api_url}products/billing-details/2`)
      .then((res) => setBillings(res.data.data))
      .catch((err) => console.error(err))
  }

  

  
  

  async function fetchProductsByParent(parentId) {
    try {
      const res = await axios.get(`${api_url}products/by-parent/${parentId}`);
      const options = res.data.map((p) => ({
        value: p.prod_id,
        label: p.prod_name,
        price: p.prod_price_1,
      }));
      setProductOptions(options);
    } catch (err) {
      console.error('Error fetching products', err);
      setProductOptions([]);
    }
  }
  
  useEffect(() => {
    if (form.parent_id) {
      fetchProductsByParent(form.parent_id);
    } else {
      setProductOptions([]);
    }
  }, [form.parent_id]);  
  


  const handleRemoveProduct = (index) => {
    const updatedProducts = formData.products.filter((_, i) => i !== index)
    setForm((prev) => ({
      ...prev,
      products: updatedProducts,
    }))
  }

  const handleSubmit = async () => {
    try {
      await createBilling(form);
      alert("Billing created successfully!");
      navigate('/billingList')
      
    } catch (error) {
      alert("Failed to create billing");
    }
  };


  

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Billing Creation</strong>
          </CCardHeader>
          <CCardBody>
            <CForm className="mb-4">
              <CRow className="mb-3">
                <CCol md={4}>
                  <CFormLabel>Billing Description</CFormLabel>
                  <CFormInput
                    name="description"
                    value={form.description}
                    onChange={(e) => {
                      const selectedId = e.target.value
                      setForm((prev) => ({
                        ...prev,
                        description: selectedId,
                       
                      }))
                    }}
                    placeholder="Enter billing description"
                  />
                </CCol>
                <CCol md={4}>
                  <CFormLabel>Customer Name</CFormLabel>

                 

                  <CFormSelect
                    name="customerId"
                    value={form.cust_id || ''}
                    onChange={(e) => {
                      const selectedId = e.target.value
                      const selectedCustomer = customerList.find(
                        (c) => c.cust_id === parseInt(selectedId),
                      )

                      setForm((prev) => ({
                        ...prev,
                        cust_id: selectedId,
                        cust_name: selectedCustomer ? selectedCustomer.cust_name : '',
                      }))
                    }}
                  >
                    <option value="">Select Customer</option>
                    {customerList.map((p) => (
                      <option key={p.cust_id} value={p.cust_id}>
                        {p.cust_name}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
                <CCol md={4}>
                  <CFormLabel>Parent Product</CFormLabel>

                  <CFormSelect
                    name="parent_produc_id"
                    value={form.parent_id}
                    onChange={(e) => {
                      const selectedId = e.target.value
                      const selectedCustomer = parentList.find(
                        (c) => c.parent_id === parseInt(selectedId),
                      )

                      setForm((prev) => ({
                        ...prev,
                        parent_id: selectedId,
                        parent_product_name: selectedCustomer
                          ? selectedCustomer.parent_product_name
                          : '',
                      }))
                    }}
                  >
                    <option value="">Select Parent Product</option>
                    {parentList.map((p) => (
                      <option key={p.parent_id} value={p.parent_id}>
                        {p.parent_product_name}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
              </CRow>
            </CForm>

            <hr />

            <CRow className="mb-3">
              <CCol md={3}>
                <CFormLabel>Product</CFormLabel>
                <Select
                  name="product"
                  options={productOptions}
                  value={productOptions.find((opt) => opt.value === newProduct.product) || null}
                  onChange={(selectedOption) => {
                    setNewProduct({
                      ...newProduct,
                      product: selectedOption?.value || '',
                      productName: selectedOption?.label || '', 
                      price: selectedOption?.price || '',
                      qty: '',
                    })
                  }}
                  placeholder="Select product..."
                  isClearable
                />
              </CCol>

              <CCol md={3}>
                <CFormLabel>Quantity</CFormLabel>
                <CFormInput
                  type="number"
                  name="qty"
                  value={newProduct.qty}
                  onChange={(e) => {
                    const qty = parseInt(e.target.value) || 0
                    setNewProduct({
                      ...newProduct,
                      qty,
                      total: qty * (newProduct.price || 0),
                    })
                  }}
                />
              </CCol>

              <CCol md={3}>
                <CFormLabel>Price</CFormLabel>
                <CFormInput type="number" name="price" value={newProduct.price} disabled />
              </CCol>

              <CCol md={3} className="d-flex align-items-end">
                <CButton
                  onClick={() => {
                    if (newProduct.product && newProduct.qty && newProduct.price) {
                      setForm((prev) => ({
                        ...prev,
                        products: [
                          ...prev.products,
                          {
                            ...newProduct,
                            total: newProduct.qty * newProduct.price,
                          },
                        ],
                      }))
                      setNewProduct({ product: '', qty: '', price: '' }) // reset
                    }
                  }}
                >
                  Add Product
                </CButton>
              </CCol>
            </CRow>

            <CTable bordered hover>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>#</CTableHeaderCell>
                  <CTableHeaderCell>Product</CTableHeaderCell>
                  <CTableHeaderCell>Qty</CTableHeaderCell>
                  <CTableHeaderCell>Price</CTableHeaderCell>
                  <CTableHeaderCell>Total</CTableHeaderCell>
                  <CTableHeaderCell>Actions</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {form.products.map((prod, index) => (
                  <CTableRow key={index}>
                    <CTableHeaderCell>{index + 1}</CTableHeaderCell>
                    <CTableDataCell>{prod.productName}</CTableDataCell>
                    <CTableDataCell>{prod.qty}</CTableDataCell>
                    <CTableDataCell>{prod.price}</CTableDataCell>
                    <CTableDataCell>{prod.total}</CTableDataCell>
                    <CTableDataCell>
                      <CButton color="danger" size="sm" onClick={() => handleRemoveProduct(index)}>
                        Remove
                      </CButton>
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          </CCardBody>
        </CCard>
      </CCol>

      <CRow className="mt-4">
        <CCol className="d-flex justify-content-end">
          <CButton color="primary" onClick={handleSubmit} style={{margin:"10px"}}>
          Create Billing
          </CButton>
        </CCol>
      </CRow>
    </CRow>
  )
}

export default BillingCreation
