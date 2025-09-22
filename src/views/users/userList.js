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
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CForm,
  CFormInput,
} from '@coreui/react'
import axios from 'axios'
import { api_url } from '../../../config'

const UserList = () => {
  const [users, setUsers] = useState([])
  const [visible, setVisible] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const [formData, setFormData] = useState({
    user_name: '',
    user_email: '',
    user_mobile: '',
    user_password: '', // ✅ added password
  })

  const API_URL = `${api_url}users`;

  const fetchUsers = async () => {
    const res = await axios.get(API_URL)
    setUsers(res.data)
  }

  useEffect(() => {
    fetchUsers()
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
        await axios.post(API_URL, formData)
      }
      setVisible(false)
      setEditMode(false)
      setFormData({
        user_name: '',
        user_email: '',
        user_mobile: '',
        user_password: '',
      })
      fetchUsers()
    } catch (err) {
      console.error(err)
    }
  }

  const handleEdit = (user) => {
    setFormData({
      user_name: user.user_name,
      user_email: user.user_email,
      user_mobile: user.user_mobile_number,
      user_password: '', // Optional: Do not prefill for security
    })
    setEditingId(user.user_id)
    setEditMode(true)
    setVisible(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axios.delete(`${API_URL}/${id}`)
        fetchUsers()
      } catch (err) {
        console.error(err)
      }
    }
  }

  return (
    <>
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader className="d-flex justify-content-between">
              <strong>User Table</strong>
              <CButton
                color="primary"
                onClick={() => {
                  setEditMode(false)
                  setFormData({
                    user_name: '',
                    user_email: '',
                    user_mobile: '',
                    user_password: '',
                  })
                  setVisible(true)
                }}
              >
                + Add User
              </CButton>
            </CCardHeader>
            <CCardBody>
              <CTable bordered hover responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>#</CTableHeaderCell>
                    <CTableHeaderCell>User Name</CTableHeaderCell>
                    <CTableHeaderCell>Email</CTableHeaderCell>
                    <CTableHeaderCell>Mobile Number</CTableHeaderCell>
                    <CTableHeaderCell>Actions</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {users.map((user, index) => (
                    <CTableRow key={user.user_id}>
                      <CTableHeaderCell scope="row">{index + 1}</CTableHeaderCell>
                      <CTableDataCell>{user.user_name}</CTableDataCell>
                      <CTableDataCell>{user.user_email}</CTableDataCell>
                      <CTableDataCell>{user.user_mobile_number}</CTableDataCell>
                      <CTableDataCell>
                        <CButton
                          size="sm"
                          color="info"
                          className="me-2"
                          onClick={() => handleEdit(user)}
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
          <CModalTitle>{editMode ? 'Edit User' : 'Add User'}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <CFormInput
              label="User Name"
              name="user_name"
              value={formData.user_name}
              onChange={handleChange}
              className="mb-2"
            />
            <CFormInput
              label="Email"
              name="user_email"
              value={formData.user_email}
              onChange={handleChange}
              className="mb-2"
            />
            <CFormInput
              label="Mobile Number"
              name="user_mobile"
              value={formData.user_mobile}
              onChange={handleChange}
              className="mb-2"
            />
            <CFormInput
              label="Password"
              name="user_password"
              type="password"
              value={formData.user_password}
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

export default UserList
