import React, { useEffect, useState } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CButton,
  CForm,
  CFormInput,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
} from '@coreui/react'
import axios from 'axios'

const CompanyList = () => {
  const [companies, setCompanies] = useState([])
  const [visible, setVisible] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({
    company_name: '',
    company_email: '',
    company_mobile_number: '',
    company_address: '',
    company_gst_number: '',
  })
  const [editingId, setEditingId] = useState(null)

  const API_URL = 'http://localhost:5000/api/companies'

  const fetchCompanies = async () => {
    const res = await axios.get(API_URL)
    setCompanies(res.data)
  }

  useEffect(() => {
    fetchCompanies()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async () => {
    try {
      if (editMode) {
        await axios.put(`${API_URL}/${editingId}`, formData)
      } else {
        await axios.post(API_URL, { ...formData, created_by: 1, updated_by: 1 })
      }
      setVisible(false)
      setFormData({
        company_name: '',
        company_email: '',
        company_mobile_number: '',
        company_address: '',
        company_gst_number: '',
      })
      setEditMode(false)
      fetchCompanies()
    } catch (err) {
      console.error('Save failed', err)
    }
  }

  const handleEdit = (company) => {
    setFormData(company)
    setEditingId(company.id || company.company_id) // use correct key
    setEditMode(true)
    setVisible(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this company?')) {
      await axios.delete(`${API_URL}/${id}`)
      fetchCompanies()
    }
  }

  return (
    <>
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader className="d-flex justify-content-between">
              <strong>Company Table</strong>
              <CButton color="primary" onClick={() => setVisible(true)}>
                + Add Company
              </CButton>
            </CCardHeader>
            <CCardBody>
              <CTable bordered hover responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>#</CTableHeaderCell>
                    <CTableHeaderCell>Company Name</CTableHeaderCell>
                    <CTableHeaderCell>Email</CTableHeaderCell>
                    <CTableHeaderCell>Mobile</CTableHeaderCell>
                    <CTableHeaderCell>Address</CTableHeaderCell>
                    <CTableHeaderCell>Actions</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {companies.map((c, index) => (
                    <CTableRow key={c.company_id}>
                      <CTableHeaderCell>{index + 1}</CTableHeaderCell>
                      <CTableDataCell>{c.company_name}</CTableDataCell>
                      <CTableDataCell>{c.company_email}</CTableDataCell>
                      <CTableDataCell>{c.company_mobile_number}</CTableDataCell>
                      <CTableDataCell>{c.company_address}</CTableDataCell>
                      <CTableDataCell>
                        <CButton
                          size="sm"
                          color="info"
                          onClick={() => handleEdit(c)}
                          className="me-2"
                        >
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

      <CModal visible={visible} onClose={() => setVisible(false)}>
        <CModalHeader>
          <CModalTitle>{editMode ? 'Edit Company' : 'Add Company'}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <CFormInput
              label="Company Name"
              name="company_name"
              value={formData.company_name}
              onChange={handleChange}
              className="mb-2"
            />
            <CFormInput
              label="Email"
              name="company_email"
              value={formData.company_email}
              onChange={handleChange}
              className="mb-2"
            />
            <CFormInput
              label="Mobile Number"
              name="company_mobile_number"
              value={formData.company_mobile_number}
              onChange={handleChange}
              className="mb-2"
            />
            <CFormInput
              label="Address"
              name="company_address"
              value={formData.company_address}
              onChange={handleChange}
              className="mb-2"
            />
            <CFormInput
              label="GST Number"
              name="company_gst_number"
              value={formData.company_gst_number}
              onChange={handleChange}
              className="mb-2"
            />
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setVisible(false)}>
            Cancel
          </CButton>
          <CButton color="primary" onClick={handleSubmit}>
            {editMode ? 'Update' : 'Create'}
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default CompanyList
