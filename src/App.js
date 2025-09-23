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


const IndexPage = () => {
  return (
    <>
      {/* Navbar */}
      <nav id="navbar" className="navbar navbar-expand-lg navbar-dark bg-dark fixed-top">
        <div className="container">
          <a className="navbar-brand" href="#">Sri Kumaran Electrical</a>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              
              <li className="nav-item">
                <a className="nav-link" href="/login">Sign In</a>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Home Section */}
      <section id="home" className="bg-light text-center" style={{ padding: '80px 0' }}>
        <div className="container">
          <h1 className="display-4">Welcome to Sri Kumaran Electrical</h1>
          <p className="lead">All Types of Motor Repairing with Panel Board Starters
          Panchayat Board Motors and Engineering Works done here.</p>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="bg-white text-center" style={{ padding: '80px 0' }}>
        <div className="container">
          <h2>About Us</h2>
          <p>All Types of Motor Repairing with Panel Board Starters
          Panchayat Board Motors and Engineering Works done here.</p>
        </div>
      </section>



      {/* Products Section */}
<section id="products" className="bg-light text-center" style={{ padding: '80px 0' }}>
  <div className="container">
    <h2>Project Work</h2>
    <br></br>
    <div className="row justify-content-center bg-light">
      <div className="col-md-6">
        <ul className="list-group list-group-flush text-start">
          <li className="list-group-item bg-light" >Motor Stator Repair Work and Labour Charge</li>
          <li className="list-group-item bg-light">Stator TT Coil - ISI Heavy Brand</li>
          <li className="list-group-item bg-light">Overload Relay - Heavy</li>
          <li className="list-group-item bg-light">100A Fuse Carrier - Heavy Brand</li>
          <li className="list-group-item bg-light">7/16 Aluminium Wire - ISI Heavy Brand</li>
          <li className="list-group-item bg-light">Stator Service Charge</li>
          <li className="list-group-item bg-light">New Auto Stator Fixing Work and Labour Charge</li>
        <li className="list-group-item bg-light">Two Phase / Three Phase New Stator with Double Relay – ISI Brand (Heavy)</li>
        <li className="list-group-item bg-light">36 MFD Can Cap Brand Condenser (Heavy)</li>
        <li className="list-group-item bg-light">2 x 1/2 Wooden Board</li>
        <li className="list-group-item bg-light">100A Fuse Carrier (Heavy)</li>

        </ul>
      </div>
      <div className="col-md-6">
        <ul className="list-group list-group-flush text-start">
          <li className="list-group-item bg-light">90mm PVC pipe burst work at Chelli Amman, Kandigai Eari – near line earthwork labour charge</li>
          <li className="list-group-item bg-light">Village OHT – 90mm PVC pipe burst work and labour charge</li>
          <li className="list-group-item bg-light">Village Anganvadi – 63mm PVC pipe burst work, earthwork labour charge</li>
          <li className="list-group-item bg-light">Colony Way Bridge – 63mm PVC pipe burst work and earthwork labour charge</li>
          <li className="list-group-item bg-light">Village Sakthikal – 90mm PVC pipe burst work and earthwork labour charge</li>
          <li class="list-group-item bg-light">Double Relay – ISI Brand (Heavy)</li>
        <li class="list-group-item bg-light">36 MFD Can Cap Brand Condenser (Heavy)</li>
        <li class="list-group-item bg-light">2 x 1/2 Wooden Board</li>
        <li class="list-group-item bg-light">100A Fuse Carrier (Heavy)</li>
        <li class="list-group-item bg-light">7/20 Aluminium Wire – ISI Brand (Heavy)</li>
        
        </ul>
      </div>
    </div>
  </div>
</section>


      {/* Contact Section */}
      <section id="contact" className="bg-white text-center" style={{ padding: '80px 0' }}>
        <div className="container">
          <h2>Contact</h2>
          <p>Get in touch with us via email or phone.</p>
          <form className="row g-3 justify-content-center">
            <div className="col-md-6">
              <input type="text" className="form-control" placeholder="Your Name" required />
            </div>
            <div className="col-md-6">
              <input type="email" className="form-control" placeholder="Your Email" required />
            </div>
            <div className="col-12">
              <textarea className="form-control" rows="4" placeholder="Your Message" required></textarea>
            </div>
            <div className="col-12">
              <button type="submit" className="btn btn-primary">Send</button>
            </div>
          </form>
        </div>
      </section>


{/* Fullscreen Map Section */}
<section id="location" style={{ padding: 0, margin: 0 }}>
  
    <iframe
      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d784.2663378155916!2d79.89177840004302!3d13.333369323714209!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a529d5c53da715f%3A0x237bde7764b05e99!2sUthukkottai%2C%20Tamil%20Nadu!5e1!3m2!1sen!2sin!4v1758644574073!5m2!1sen!2sin"
      style={{ width: '100%', height: '350px', border: 0 }}
      allowFullScreen
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      title="Google Map Location"
    />

</section>




      {/* Footer */}
      <footer className="bg-dark text-white text-center py-3">
        <p className="mb-0">© 2025 Master Tech. All rights reserved.</p>
      </footer>
    </>
  );
};





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
          <Route path="/" element={<IndexPage />} />
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
