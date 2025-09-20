import React, { useEffect, useState } from 'react'
import {
  CCard, CCardBody, CCardHeader, CCol, CForm, CFormInput,
  CFormLabel, CFormCheck, CRow, CButton, CTable, CTableBody,
  CTableDataCell, CTableHead, CTableHeaderCell, CTableRow, CAlert,
} from '@coreui/react'
import axios from 'axios'

const MasterList = () => {
  const [masters, setMasters] = useState([])
  const [form, setForm] = useState(initialFormState())
  const [isEdit, setIsEdit] = useState(false)
  const [message, setMessage] = useState('')

  function initialFormState() {
    return {
      gst_support: false,
      gst_value: '',
      pdf_label_support: false,
      created_by: 1, // fixed for demo
    }
  }

  useEffect(() => {
    fetchMasters()
  }, [])

  const fetchMasters = () => {
    axios.get('http://localhost:5000/api/masters')
      .then((res) => setMasters(res.data))
      .catch((err) => console.error('Fetch failed:', err))
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value,
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (isEdit) {
      axios.put(`http://localhost:5000/api/masters/${form.master_id}`, form)
        .then(() => {
          setMessage('Master updated successfully!')
          resetForm()
          fetchMasters()
        })
        .catch(() => setMessage('Error updating master'))
    } else {
      axios.post('http://localhost:5000/api/masters', form)
        .then(() => {
          setMessage('Master created successfully!')
          resetForm()
          fetchMasters()
        })
        .catch(() => setMessage('Error creating master'))
    }
  }

  const resetForm = () => {
    setForm(initialFormState())
    setIsEdit(false)
    setMessage('')
  }

  const handleEdit = (master) => {
    setForm(master)
    setIsEdit(true)
    setMessage('')
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure to delete this master?')) {
      axios.delete(`http://localhost:5000/api/masters/${id}`)
        .then(() => {
          setMessage('Master deleted.')
          fetchMasters()
        })
        .catch(() => setMessage('Delete failed.'))
    }
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>{isEdit ? 'Edit Master' : 'Create Master'}</strong>
          </CCardHeader>
          <CCardBody>
            {message && <CAlert color="info">{message}</CAlert>}
            <CForm onSubmit={handleSubmit}>
              <CRow className="mb-3">
                <CCol md={4}>
                  <CFormCheck
                    type="checkbox"
                    name="gst_support"
                    checked={form.gst_support}
                    onChange={handleChange}
                    label="GST Support"
                  />
                </CCol>
                <CCol md={4} >
                 
                  <CFormInput
                    type="text"
                    name="gst_value"
                    value={form.gst_value}
                    onChange={handleChange}
                    placeholder="Enter GST Value"
                    required
                  />
                </CCol>
                <CCol md={4}>
                  <CFormCheck
                    type="checkbox"
                    name="pdf_label_support"
                    checked={form.pdf_label_support}
                    onChange={handleChange}
                    label="PDF Label Support"
                  />
                </CCol>
              </CRow>

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
            <strong>Master List</strong>
          </CCardHeader>
          <CCardBody>
            <CTable bordered hover responsive>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>#</CTableHeaderCell>
                  <CTableHeaderCell>GST Support</CTableHeaderCell>
                  <CTableHeaderCell>GST Value</CTableHeaderCell>
                  <CTableHeaderCell>PDF Label Support</CTableHeaderCell>
                  <CTableHeaderCell>Actions</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {masters.map((master, index) => (
                  <CTableRow key={master.master_id}>
                    <CTableHeaderCell>{index + 1}</CTableHeaderCell>
                    <CTableDataCell>{master.gst_support ? 'Yes' : 'No'}</CTableDataCell>
                    <CTableDataCell>{master.gst_value}</CTableDataCell>
                    <CTableDataCell>{master.pdf_label_support ? 'Yes' : 'No'}</CTableDataCell>
                    <CTableDataCell>
                      <CButton size="sm" color="info" onClick={() => handleEdit(master)} className="me-1">
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

export default MasterList
