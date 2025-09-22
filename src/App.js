// App.js
import React, { useState, Suspense, useEffect } from 'react'
import {
  CButton,
  CCard,
  CCardBody,
  CCardGroup,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLockLocked, cilUser } from '@coreui/icons'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import './scss/style.scss'
import axios from 'axios'
import Reports from './views/billings/reports'
import AppFooter from './components/AppFooter'
import AppSidebar from './components/AppSidebar'
import AppHeader from './components/AppHeader'
import UserList from './views/users/userList'
import BillingCreation from './views/billings/billingCreation'
import ProductList from './views/products/productList'
import QuantityType from './views/quantity/quantityType'
import ParentProduct from './views/master_products/masterproductList'
import CompanyList from './views/company/companyList'
import CustomerList from './views/customer/customerList'
import Dashboard from './views/dashboard/Dashboard'
import MasterList from './views/master/masterList'
import { api_url } from '../config'

const isAuthenticated = () => {
  return !!localStorage.getItem('token')
}

const PrivateRoute = ({ children }) => {
   return isAuthenticated() ? children : <Navigate to="/login" />
}

const Login = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')

    try {
      const response = await axios.post(`${api_url}users/login`, {
        user_email: username,
        user_password: password,
      })

      localStorage.setItem('token', response.data.token)
      const resp = await axios.get(`${api_url}masters/`)
      localStorage.setItem('masters', JSON.stringify(resp.data))

      navigate('/dashboard')
    } catch (err) {
      setError('Invalid credentials')
    }
  }

  return (
    <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={6}>
            <CCardGroup>
              <CCard className="p-4">
                <CCardBody>
                  <CForm onSubmit={handleLogin}>
                    <h1>Login</h1>
                    <p className="text-body-secondary">Sign In to your account</p>

                    {error && <p className="text-danger">{error}</p>}

                    <CInputGroup className="mb-3">
                      <CInputGroupText>
                        <CIcon icon={cilUser} />
                      </CInputGroupText>
                      <CFormInput
                        placeholder="Email"
                        autoComplete="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    </CInputGroup>

                    <CInputGroup className="mb-4">
                      <CInputGroupText>
                        <CIcon icon={cilLockLocked} />
                      </CInputGroupText>
                      <CFormInput
                        type="password"
                        placeholder="Password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </CInputGroup>

                    <CRow>
                      <CCol xs={6}>
                        <CButton type="submit" color="primary" className="px-4">
                          Login
                        </CButton>
                      </CCol>
                      <CCol xs={6} className="text-right">
                     
                      </CCol>
                    </CRow>
                  </CForm>
                </CCardBody>
              </CCard>
            </CCardGroup>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  )
}


const Page404 = () => <h2 className="text-center mt-5">404 - Page Not Found</h2>

const App = () => {
  return (
    <Router>
      <Suspense
        fallback={
          <div className="pt-5 text-center">
            <CSpinner color="primary" variant="grow" />
          </div>
        }
      >
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <div>
                  <AppSidebar />
                  <div className="wrapper d-flex flex-column min-vh-100">
                    <AppHeader />
                    <div className="body flex-grow-1 p-3">
                      <Dashboard/>
                    </div>
                    <AppFooter />
                  </div>
                </div>
              </PrivateRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <PrivateRoute>
                <div>
                  <AppSidebar />
                  <div className="wrapper d-flex flex-column min-vh-100">
                    <AppHeader />
                    <div className="body flex-grow-1 p-3">
                      <Reports />
                    </div>
                    <AppFooter />
                  </div>
                </div>
              </PrivateRoute>
            }
          />
          <Route
            path="/userList"
            element={
              <PrivateRoute>
                <div>
                  <AppSidebar />
                  <div className="wrapper d-flex flex-column min-vh-100">
                    <AppHeader />
                    <div className="body flex-grow-1 p-3">
                      <UserList />
                    </div>
                    <AppFooter />
                  </div>
                </div>
              </PrivateRoute>
            }
          />

          <Route
            path="/billingList"
            element={
              <PrivateRoute>
                <div>
                  <AppSidebar />
                  <div className="wrapper d-flex flex-column min-vh-100">
                    <AppHeader />
                    <div className="body flex-grow-1 p-3">
                      <BillingCreation />
                    </div>
                    <AppFooter />
                  </div>
                </div>
              </PrivateRoute>
            }
          />

          <Route
            path="/productlist"
            element={
              <PrivateRoute>
                <div>
                  <AppSidebar />
                  <div className="wrapper d-flex flex-column min-vh-100">
                    <AppHeader />
                    <div className="body flex-grow-1 p-3">
                      <ProductList />
                    </div>
                    <AppFooter />
                  </div>
                </div>
              </PrivateRoute>
            }
          />

          <Route
            path="/quantityType"
            element={
              <PrivateRoute>
                <div>
                  <AppSidebar />
                  <div className="wrapper d-flex flex-column min-vh-100">
                    <AppHeader />
                    <div className="body flex-grow-1 p-3">
                      <QuantityType />
                    </div>
                    <AppFooter />
                  </div>
                </div>
              </PrivateRoute>
            }
          />

          <Route
            path="/parentProduct"
            element={
              <PrivateRoute>
                <div>
                  <AppSidebar />
                  <div className="wrapper d-flex flex-column min-vh-100">
                    <AppHeader />
                    <div className="body flex-grow-1 p-3">
                      <ParentProduct />
                    </div>
                    <AppFooter />
                  </div>
                </div>
              </PrivateRoute>
            }
          />

          <Route
            path="/companyList"
            element={
              <PrivateRoute>
                <div>
                  <AppSidebar />
                  <div className="wrapper d-flex flex-column min-vh-100">
                    <AppHeader />
                    <div className="body flex-grow-1 p-3">
                      <CompanyList />
                    </div>
                    <AppFooter />
                  </div>
                </div>
              </PrivateRoute>
            }
          />

          <Route
            path="/customerList"
            element={
              <PrivateRoute>
                <div>
                  <AppSidebar />
                  <div className="wrapper d-flex flex-column min-vh-100">
                    <AppHeader />
                    <div className="body flex-grow-1 p-3">
                      <CustomerList />
                    </div>
                    <AppFooter />
                  </div>
                </div>
              </PrivateRoute>
            }
          />

<Route
            path="/masterList"
            element={
              <PrivateRoute>
                <div>
                  <AppSidebar />
                  <div className="wrapper d-flex flex-column min-vh-100">
                    <AppHeader />
                    <div className="body flex-grow-1 p-3">
                      <MasterList/>
                    </div>
                    <AppFooter />
                  </div>
                </div>
              </PrivateRoute>
            }
          />

          <Route path="*" element={<Page404 />} />
        </Routes>
      </Suspense>
    </Router>
  )
}

export default App
