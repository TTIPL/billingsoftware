import React, { useEffect, useState } from 'react'
import {
  CCard, CCardBody, CCardHeader, CCol, CForm, CFormInput,
  CFormLabel, CFormTextarea, CRow, CButton, CTable, CTableBody,
  CTableDataCell, CTableHead, CTableHeaderCell, CTableRow, CAlert,
} from '@coreui/react'
import axios from 'axios'
import { api_url } from '../../../config'

const CustomerList = () => {
  const [customers, setCustomers] = useState([])
  const [form, setForm] = useState(initialFormState())
  const [isEdit, setIsEdit] = useState(false)
  const [message, setMessage] = useState('')

  function initialFormState() {
    return {
      cust_name: '',
      cust_email: '',
      cust_mobile_number: '',
      cust_address: '',
      cust_gst_number: '',
      created_by: 1,
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = () => {
    axios.get(`${api_url}customers`)
      .then((res) => setCustomers(res.data))
      .catch((err) => console.error('Fetch failed:', err))
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (isEdit) {
      axios.put(`${api_url}customers/${form.cust_id}`, form)
        .then(() => {
          setMessage('Customer updated successfully!')
          resetForm()
          fetchCustomers()
        })
        .catch(() => setMessage('Error updating customer'))
    } else {
      axios.post(`${api_url}customers`, form)
        .then(() => {
          setMessage('Customer created successfully!')
          resetForm()
          fetchCustomers()
        })
        .catch(() => setMessage('Error creating customer'))
    }
  }

  const resetForm = () => {
    setForm(initialFormState())
    setIsEdit(false)
  }

  const handleEdit = (cust) => {
    setForm(cust)
    setIsEdit(true)
    setMessage('')
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure to delete this customer?')) {
      axios.delete(`${api_url}customers/${id}`)
        .then(() => {
          setMessage('Customer deleted.')
          fetchCustomers()
        })
        .catch(() => setMessage('Delete failed.'))
    }
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>{isEdit ? 'Edit Customer' : 'Create Customer'}</strong>
          </CCardHeader>
          <CCardBody>
            {message && <CAlert color="info">{message}</CAlert>}
            <CForm onSubmit={handleSubmit}>
              <CRow className="mb-3">
                <CCol md={6}>
                  <CFormLabel>Customer Name</CFormLabel>
                  <CFormInput name="cust_name" value={form.cust_name} onChange={handleChange} required />
                </CCol>
                <CCol md={6}>
                  <CFormLabel>Customer Email</CFormLabel>
                  <CFormInput name="cust_email" value={form.cust_email} onChange={handleChange} required />
                </CCol>
              </CRow>

              <CRow className="mb-3">
                <CCol md={6}>
                  <CFormLabel>Mobile Number</CFormLabel>
                  <CFormInput name="cust_mobile_number" value={form.cust_mobile_number} onChange={handleChange} required />
                </CCol>
                <CCol md={6}>
                  <CFormLabel>GST Number</CFormLabel>
                  <CFormInput name="cust_gst_number" value={form.cust_gst_number} onChange={handleChange} />
                </CCol>
              </CRow>

              <div className="mb-3">
                <CFormLabel>Address</CFormLabel>
                <CFormTextarea name="cust_address" rows={3} value={form.cust_address} onChange={handleChange} required />
              </div>

              <CButton type="submit" color={isEdit ? 'warning' : 'primary'} className="me-2">
                {isEdit ? 'Update' : 'Create'}
              </CButton>
              {isEdit && (
                <CButton type="button" color="secondary" onClick={resetForm}>
                  Cancel
                </CButton>
              )}
            </CForm>
          </CCardBody>
        </CCard>
      </CCol>

      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Customer List</strong>
          </CCardHeader>
          <CCardBody>
            <CTable bordered hover responsive>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>#</CTableHeaderCell>
                  <CTableHeaderCell>Name</CTableHeaderCell>
                  <CTableHeaderCell>Email</CTableHeaderCell>
                  <CTableHeaderCell>Mobile</CTableHeaderCell>
                  <CTableHeaderCell>Address</CTableHeaderCell>
                  <CTableHeaderCell>GST</CTableHeaderCell>
                  <CTableHeaderCell>Actions</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {customers.map((cust, index) => (
                  <CTableRow key={cust.cust_id}>
                    <CTableHeaderCell>{index + 1}</CTableHeaderCell>
                    <CTableDataCell>{cust.cust_name}</CTableDataCell>
                    <CTableDataCell>{cust.cust_email}</CTableDataCell>
                    <CTableDataCell>{cust.cust_mobile_number}</CTableDataCell>
                    <CTableDataCell>{cust.cust_address}</CTableDataCell>
                    <CTableDataCell>{cust.cust_gst_number}</CTableDataCell>
                    <CTableDataCell>
                      <CButton size="sm" color="info" onClick={() => handleEdit(cust)} className="me-1">
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
  )
}

export default CustomerList
