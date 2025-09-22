import React, { useState, useEffect } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CTable,
  CTableBody,
  CTableCaption,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CButton,
} from '@coreui/react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { api_url } from '../../../config'

const billlingList = () => {
  const [billings, setBillings] = useState([])
  const [billingList, setBillingList] = useState([])
  useEffect(() => {
    fetchgetAllBillings()
  }, [])

  const fetchgetBillingDetails = (data) => {
    let id = data.billing_id
    axios
      .get(`${api_url}products/billing-details/${id}`)
      .then((res) => {
        setBillings(res.data.data)
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

  const fetchgetAllBillings = () => {
    axios
      .get(`${api_url}products/all-billings`)
      .then((res) => setBillingList(res.data.data))
      .catch((err) => console.error(err))
  }
  return (
    <CRow>
      <CCol xs={12} className="d-flex justify-content-end my-3">
        <Link to="/billingCreation">
          <CButton color="primary">Generate Billing</CButton>
        </Link>
      </CCol>

      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Billings Table</strong>
          </CCardHeader>
          <CCardBody>
            <CTable bordered>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell scope="col">#</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Billing Description</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Customer Name</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Company Name</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Overall Amt</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Action</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {billingList &&
                  billingList.map((prod, index) => (
                    <CTableRow>
                      <CTableHeaderCell scope="row">{index + 1}</CTableHeaderCell>
                      <CTableDataCell>{prod.billing_description}</CTableDataCell>
                      <CTableDataCell>{prod.cust_name}</CTableDataCell>
                      <CTableDataCell>{prod.company_name}</CTableDataCell>
                      <CTableDataCell>{prod.overall_amt}</CTableDataCell>
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

export default billlingList
