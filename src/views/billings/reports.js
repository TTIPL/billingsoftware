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


const Reports = () => {
    const [billingList, setBillingList] = useState([])
  const [customerList, setCustomerList] = useState([])
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    customerId: '',
  })

  useEffect(() => {
    fetchCustomers()
  }, [])


  const fetchCustomers = () => {
    axios
      .get('http://localhost:5000/api/customers')
      .then((res) => setCustomerList(res.data))
      .catch((err) => console.error(err))
  }

  const applyFilters = async () => {
    try {
      const params = {
        startDate: filters.startDate,
        endDate: filters.endDate,
        customerId: filters.customerId,
      }
      const queryString = new URLSearchParams(params).toString()
      const url = `http://localhost:5000/api/products/reports/?${queryString}`
      const res = await axios.get(url)
      setBillingList(res.data.data)
    } catch (error) {
      console.error('Error fetching filtered data', error)
    }
  }
  const fetchgetBillingDetails = (data) => {
    let id = data.billing_id
    axios
      .get(`http://localhost:5000/api/products/billing-details/${id}`)
      .then((res) => {
        let billingData = res.data.data
        let bill = data
        generateComparativePDF(billingData, bill)
      })
      .catch((err) => console.error(err))
  }

  const generateComparativePDF = (data, bill) => {
    const doc = new jsPDF()

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('COMPARATIVE STATEMENT', 75, 10)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Name Of The Union     : ${bill.cust_address}`, 14, 20)
    doc.text(`Name Of The Panchayat : ${bill.cust_name}`, 14, 26)
    doc.text(`Name Of the Work      : ${bill.billing_description}`, 14, 32)

    const grouped = {}
    const totals = {
      'Sri Kumaran': 0,
      'Santhosh Enterprises': 0,
      'Sri Raghavendra': 0,
    }

    data.forEach((item) => {
      const key = item.prod_name
      if (!grouped[key]) grouped[key] = {}

      grouped[key][item.company_name] = {
        qty: item.prod_qty,
        rate: parseFloat(item.prod_price),
        amount: parseFloat(item.total_amt),
      }

      totals[item.company_name] += parseFloat(item.total_amt)
    })

    const companies = {
      kumaran: 'Sri Kumaran',
      santhosh: 'Santhosh Enterprises',
      raghavendra: 'Sri Raghavendra',
    }

    const rows = []
    let index = 1

    for (const prodName in grouped) {
      const row = grouped[prodName]

      rows.push([
        index++,
        prodName,
        row[companies.kumaran]?.qty || '-',
        row[companies.kumaran]?.rate?.toFixed(2) || '-',
        row[companies.kumaran]?.amount?.toFixed(2) || '-',
        row[companies.santhosh]?.rate?.toFixed(2) || '-',
        row[companies.santhosh]?.amount?.toFixed(2) || '-',
        row[companies.raghavendra]?.rate?.toFixed(2) || '-',
        row[companies.raghavendra]?.amount?.toFixed(2) || '-',
        '',
      ])
    }

    autoTable(doc, {
      startY: 40,
      head: [
        [
          'No',
          'Description Of Work',
          'Qty',
          'Rate by Sri Kumaran',
          'Amount',
          'Rate by Santhosh',
          'Amount',
          'Rate by Raghavendra',
          'Amount',
          'Remarks',
        ],
      ],
      body: rows,
      styles: {
        fontSize: 8,
        lineColor: [0, 0, 0], // black border
        lineWidth: 0.2, // thin border
        halign: 'center', // optional: center align all text
      },
      headStyles: {
        fillColor: [220, 220, 220],
        textColor: 0,
        lineColor: [0, 0, 0], // black border for header
        lineWidth: 0.5,
      },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 50 },
        2: { cellWidth: 12 },
        3: { cellWidth: 18 },
        4: { cellWidth: 18 },
        5: { cellWidth: 18 },
        6: { cellWidth: 18 },
        7: { cellWidth: 18 },
        8: { cellWidth: 18 },
        9: { cellWidth: 18 },
      },
      theme: 'grid', // Ensure full grid with borders
    })

    const finalY = doc.lastAutoTable.finalY + 10

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Total Quoted Amount:', 14, finalY)

    doc.setFont('helvetica', 'normal')

    const lineSpacing = 6
    let currentY = finalY + lineSpacing

    doc.text(`Sri Kumaran:${totals[companies.kumaran].toLocaleString('en-IN')}`, 14, currentY)
    currentY += lineSpacing

    doc.text(
      `Santhosh Enterprises: ${totals[companies.santhosh].toLocaleString('en-IN')}`,
      14,
      currentY,
    )
    currentY += lineSpacing

    doc.text(
      `Sri Raghavendra: ${totals[companies.raghavendra].toLocaleString('en-IN')}`,
      14,
      currentY,
    )

    currentY += lineSpacing

    const lowestCompany = Object.keys(totals).reduce((a, b) => (totals[a] < totals[b] ? a : b))
    doc.setFont('helvetica', 'bold')
    doc.text(`Lowest Rate For: ${lowestCompany.toUpperCase()}`, 14, finalY + 30)

    const blobURL = doc.output('bloburl')
    window.open(blobURL)
  }

  const formatDateUTC = (dateString) => {
    if (!dateString) return '';
  
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
  
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // UTC month
    const day = String(date.getUTCDate()).padStart(2, '0'); // UTC day
  
    return `${day}-${month}-${year}`; // DD-MM-YYYY
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Reports</strong>
          </CCardHeader>
          <CCardBody>
            <CForm className="mb-4">
              <CRow className="mb-3">
                <CCol md={3}>
                  <CFormLabel>Start Date</CFormLabel>
                  <CFormInput
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
                  />
                </CCol>
                <CCol md={3}>
                  <CFormLabel>End Date</CFormLabel>
                  <CFormInput
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
                  />
                </CCol>
                <CCol md={4}>
                  <CFormLabel>Customer Name</CFormLabel>
                  <CFormSelect
                    value={filters.customerId}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, customerId: e.target.value }))
                    }
                  >
                    <option value="">Select Customer</option>
                    {customerList.map((cust) => (
                      <option key={cust.cust_id} value={cust.cust_id}>
                        {cust.cust_name}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
                <CCol md={2} className="d-flex align-items-end">
                  <CButton color="primary" onClick={() => applyFilters()} >
                    Filter
                  </CButton>
                  <CButton color="warning" style={{marginLeft:"5px"}} onClick={() => setFilters({
    startDate: '',
    endDate: '',
    customerId: '',
  })}>
                    Reset
                  </CButton>
                </CCol>
              </CRow>
            </CForm>


          </CCardBody>
        </CCard>
      </CCol>
      <CCol md={12}>
        <CCard>
          <CCardHeader>Data List</CCardHeader>
          <CCardBody>
            <CTable bordered hover responsive>
              <CTableHead>
              <CTableRow>
                  <CTableHeaderCell scope="col">#</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Billing Description</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Customer Name</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Company Name</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Overall Amt</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Created Date</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Action</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {billingList &&
                  billingList.map((prod, index) => (
                    <CTableRow key={index}>
                      <CTableHeaderCell scope="row">{index + 1}</CTableHeaderCell>
                      <CTableDataCell>{prod.billing_description}</CTableDataCell>
                      <CTableDataCell>{prod.cust_name}</CTableDataCell>
                      <CTableDataCell>{prod.company_name}</CTableDataCell>
                      <CTableDataCell>{prod.overall_amt}</CTableDataCell>
                      <CTableDataCell>{formatDateUTC(prod.created_at)}</CTableDataCell>
                      <CTableDataCell>
                        <CButton color="success" onClick={() => fetchgetBillingDetails(prod)}>
                          Download PDF
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

export default Reports
