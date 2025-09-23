import React, { useState, useEffect } from 'react'
import CIcon from '@coreui/icons-react'
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
import {
  cilBell,
  cilCalculator,
  cilDataTransferDown
} from '@coreui/icons'
import Select from 'react-select'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable' 
import axios from 'axios'
import { api_url } from '../../../config'


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
      .get(`${api_url}customers`)
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
      const url = `${api_url}products/reports/?${queryString}`
      const res = await axios.get(url)
      setBillingList(res.data.data)
    } catch (error) {
      console.error('Error fetching filtered data', error)
    }
  }
  const fetchgetBillingDetails = (data) => {
    let id = data.billing_id
    axios
      .get(`${api_url}products/billing-details/${id}`)
      .then((res) => {
        let billingData = res.data.data
        let bill = data


        const mastersData = JSON.parse(localStorage.getItem('masters') || '[]')
        const masterSettings = Array.isArray(mastersData) ? mastersData[0] : mastersData
          if (masterSettings && masterSettings.gst_support) {
            const gstValueString = masterSettings.gst_value || '0'
            const gstPercent = parseFloat(gstValueString.replace('%', '')) || 0;
            console.log(gstPercent)
            generateComparativePDFWithGST(billingData, bill, gstPercent)
          } else {
            generateComparativePDF(billingData, bill)
          }
        
      })
      .catch((err) => console.error(err))
  }


  const generatePDFDownload = (data,orgId) => {
    const mastersData = JSON.parse(localStorage.getItem('masters') || '[]');
    const masterSettings = Array.isArray(mastersData) ? mastersData[0] : mastersData;
  
    const gstValueString = masterSettings?.gst_value || '0';
    const gstPercent = parseFloat(gstValueString.replace('%', '')) || 0;
  
    const settings = {
      gstSupport: !!masterSettings?.gst_support,
      pdfLabelSupport: !!masterSettings?.pdf_label_support,
    };
  
    let id = data.billing_id
    axios
      .get(`${api_url}products/billing-details/${id}`)
      .then((res) => {
        let billingData = res.data.data;
      let respData=  billingData.filter((res) => {
          return res.company_id === orgId;
        });
        console.log(respData)
         generateUnifiedPDF(respData, gstPercent, settings);
      })

    
  };
  
  const generateUnifiedPDF = (formData, gstPercent, settings) => {
    const doc = new jsPDF();
    const gstRate = gstPercent / 100;
    const pageWidth = doc.internal.pageSize.getWidth();
  
    // Format products
    const products = formData.map((item) => ({
      productName: item.prod_name,
      qty: Number(item.prod_qty),
      price: Number(item.prod_price),
      total: Number(item.total_amt),
    }));


    const totalAmountRaw = products.reduce((sum, p) => sum + p.total, 0);
const cgstAmountRaw = totalAmountRaw * gstRate;
const sgstAmountRaw = totalAmountRaw * gstRate;
const grandTotalRaw = totalAmountRaw + cgstAmountRaw + sgstAmountRaw;

// ✅ Round-off for display
const totalAmount = Math.round(totalAmountRaw);
const cgstAmount = Math.round(cgstAmountRaw);
const sgstAmount = Math.round(sgstAmountRaw);
const grandTotal = Math.round(grandTotalRaw);


    if (settings.pdfLabelSupport) {
      addCustomHeader(doc, pageWidth, formData[0]);
    }
  
    // Customer details
    const customer = formData[0];
    const customerStartY = 68;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(` ${customer.cust_name}`, 14, customerStartY);
    doc.text(`All Types of Motor Repairing with Panel Board Starters`, 14, customerStartY + 6);
  
    // Prepare table data
    const productRows = products.map((p, i) => [
      i + 1,
      p.productName,
      p.qty,
      p.price.toLocaleString(),
      p.total.toLocaleString(),
    ]);
  
    const productRowCount = productRows.length;
  
    // Totals and GST
    productRows.push(['', '', '', 'Total Amount', totalAmount.toLocaleString()]);
    if (settings.gstSupport && gstPercent > 0) {
      productRows.push(
        ['', '', '', `CGST (${gstPercent}%)`, cgstAmount.toLocaleString()],
        ['', '', '', `SGST (${gstPercent}%)`, sgstAmount.toLocaleString()],
        ['', '', '', 'Grand Total (incl. GST)', grandTotal.toLocaleString()]
      );
    }
  
    // Render table
    autoTable(doc, {
      startY: 80,
      head: [['S.NO', 'PARTICULARS', 'QTY', 'RATE', 'AMOUNT']],
      body: productRows,
      styles: {
        fontSize: 10,
        cellPadding: 3,
        valign: 'middle',
        halign: 'center',
      },
      headStyles: {
        fillColor: [220, 220, 220],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'center',
        lineWidth: 0.5,
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' }, // S.NO
        1: { cellWidth: 90, halign: 'left' },   // PARTICULARS
        2: { cellWidth: 20, halign: 'center' }, // QTY
        3: { cellWidth: 25, halign: 'right' },  // RATE
        4: { cellWidth: 30, halign: 'right' },  // AMOUNT
      },
  
      didParseCell: function (data) {
        const colIdx = data.column.index;
        const rowIdx = data.row.index;
        const productRowCount = data.table.body.length - (settings.gstSupport && gstPercent > 0 ? 4 : 1); 
        // Subtract number of total rows added dynamically (1 or 4 rows for totals)
      
        // Remove background color for all cells
        data.cell.styles.fillColor = [255, 255, 255];
      
        // For product rows (all rows before totals)
        if (rowIdx < productRowCount) {
          data.cell.styles.lineWidth = 0.3; // keep border for all columns in product rows
        } else {
          // For total/GST rows
          if (colIdx < 3) {
            data.cell.styles.lineWidth = 0; // no border for first three columns in total rows
          } else {
            data.cell.styles.lineWidth = 0.3; // border for RATE and AMOUNT columns in total rows
          }
          data.cell.styles.fontStyle = 'bold';
          if (colIdx === 3 || colIdx === 4) {
            data.cell.styles.halign = 'right';
          }
        }
      
        // Set text color always to black
        data.cell.styles.textColor = [0, 0, 0];
      },
      didDrawPage: function (data) {
        const pageWidth = doc.internal.pageSize.getWidth();
        const tableBottomY = data.cursor.y; // Get where table ends
    
        // Set font
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
    
        // Text to right
        doc.text(`For ${formData[0].company_name}`, pageWidth - 60, tableBottomY + 30);
      }
      
      
    });
  
    // Open the PDF
    const pdfBlobUrl = doc.output('bloburl');
    window.open(pdfBlobUrl, '_blank');
  };
  
  
  
  
  
  
  
  const addCustomHeader = (doc, pageWidth,cust) => {
    const gurudevText = 'Jai Gurudev';
    const textWidth = doc.getTextWidth(gurudevText);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(gurudevText, (pageWidth - textWidth) / 2, 10);
  
    // Optional: Replace this URL with actual base64 if needed
    const muruganImageBase64 =
      'https://thumbs.dreamstime.com/b/sketch-lord-murugan-kartikeya-outline-editable-vector-illustration-drawing-184058651.jpg';
    doc.addImage(muruganImageBase64, 'PNG', 10, 10, 25, 25);
  
    // Company Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 0, 0);
    doc.text(cust.company_name.toUpperCase(), 75, 17);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text('All Types of Motor Repairing with Panel Board Starters', 60, 25);
    doc.text('Panchayat Board Motors and Engineering Works done here.', 54, 30);
  
    doc.setFont('helvetica', 'normal');
    // doc.text('Prop. : SANJEEVA', 160, 15);
    // doc.text('Cell : 7708801975', 160, 20);
    doc.text('No.2, Saravana Complex, Nagalapuram Road, Uthukottai - 602 026.', 55, 42);
  
    // Document Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('QUATATION', 90, 36);
  };


  const generateComparativePDF = (data, bill) => {
    const doc = new jsPDF({ orientation: 'landscape' })
  
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
      'Sri Kumaran Electricals': 0,
      'Santhosh Enterprises': 0,
      'Sri Raghavendra Electricals': 0,
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
      kumaran: 'Sri Kumaran Electricals',
      santhosh: 'Santhosh Enterprises',
      raghavendra: 'Sri Raghavendra Electricals',
    }
  
    const rows = []
    let index = 1
  
    // Add product rows
    for (const prodName in grouped) {
      const row = grouped[prodName]
      rows.push([
        index++,
        prodName,
        row[companies.kumaran]?.qty || '-',
        row[companies.kumaran]?.rate?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || '-',
        row[companies.kumaran]?.amount?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || '-',
        row[companies.santhosh]?.rate?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || '-',
        row[companies.santhosh]?.amount?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || '-',
        row[companies.raghavendra]?.rate?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || '-',
        row[companies.raghavendra]?.amount?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || '-',
        '',
      ])
    }
  
    // Subtotal row inside table
    rows.push([
      { content: 'Subtotal', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } },
      '',
      totals[companies.kumaran].toLocaleString('en-IN', { maximumFractionDigits: 0 }),
      '',
      totals[companies.santhosh].toLocaleString('en-IN', { maximumFractionDigits: 0 }),
      '',
      totals[companies.raghavendra].toLocaleString('en-IN', { maximumFractionDigits: 0 }),
      '',
    ])
  
    // Build table
    autoTable(doc, {
      startY: 40,
      head: [
        [
          { content: 'No', rowSpan: 2, styles: { halign: 'center' } },
          { content: 'Description Of Work', rowSpan: 2 },
          { content: 'Qty', rowSpan: 2, styles: { halign: 'center' } },
          { content: 'Rate by Sri Kumaran', colSpan: 2, styles: { halign: 'center' } },
          { content: 'Rate by Santhosh', colSpan: 2, styles: { halign: 'center' } },
          { content: 'Rate by Raghavendra', colSpan: 2, styles: { halign: 'center' } },
          { content: 'Remarks', rowSpan: 2 },
        ],
        ['Rate', 'Amount', 'Rate', 'Amount', 'Rate', 'Amount'],
      ],
      body: rows,
      styles: {
        fontSize: 8,
        lineColor: [0, 0, 0],
        lineWidth: 0.2,
        halign: 'center',
      },
      headStyles: {
        fillColor: [220, 220, 220],
        textColor: 0,
        lineColor: [0, 0, 0],
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
      theme: 'grid',
    })
  
    // Lowest company after table
    const lowestCompany = Object.keys(totals).reduce((a, b) =>
      totals[a] < totals[b] ? a : b
    )
  
    const finalY = doc.lastAutoTable.finalY + 10
    doc.setFont('helvetica', 'bold')
    doc.text(`Lowest Rate For: ${lowestCompany.toUpperCase()}`, 14, finalY)
  
    const blobURL = doc.output('bloburl')
    window.open(blobURL)
  }




  const generateComparativePDFWithGST = (data, bill, gstPercent) => {
    const doc = new jsPDF({ orientation: 'landscape' })
  
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
      'Sri Kumaran Electricals': 0,
      'Santhosh Enterprises': 0,
      'Sri Raghavendra Electricals': 0,
    }
  
    data.forEach((item) => {
      const key = item.prod_name
      if (!grouped[key]) grouped[key] = {}
  
      grouped[key][item.company_name] = {
        qty: item.prod_qty,
        rate: Math.round(parseFloat(item.prod_price)),
        amount: Math.round(parseFloat(item.total_amt)),
      }
  
      totals[item.company_name] += Math.round(parseFloat(item.total_amt))
    })
  
    const companies = {
      kumaran: 'Sri Kumaran Electricals',
      santhosh: 'Santhosh Enterprises',
      raghavendra: 'Sri Raghavendra Electricals',
    }
  
    const formatAmount = (val) =>
      val !== '-' ? Number(val).toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '-'
  
    const rows = []
    let index = 1
  
    for (const prodName in grouped) {
      const row = grouped[prodName]
  
      rows.push([
        index++,
        prodName,
        row[companies.kumaran]?.qty || '-',
        formatAmount(row[companies.kumaran]?.rate) || '-',
        formatAmount(row[companies.kumaran]?.amount) || '-',
        formatAmount(row[companies.santhosh]?.rate) || '-',
        formatAmount(row[companies.santhosh]?.amount) || '-',
        formatAmount(row[companies.raghavendra]?.rate) || '-',
        formatAmount(row[companies.raghavendra]?.amount) || '-',
        '',
      ])
    }
  
    // Always show Subtotal
    rows.push([
      { content: 'Subtotal', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } },
      '',
      formatAmount(totals[companies.kumaran]),
      '',
      formatAmount(totals[companies.santhosh]),
      '',
      formatAmount(totals[companies.raghavendra]),
      '',
    ])
  
    let gstDetails = {}
    if (gstPercent > 0) {
      const gstRate = gstPercent / 100
      for (const company of Object.values(companies)) {
        const cgst = Math.round(totals[company] * gstRate)
        const sgst = Math.round(totals[company] * gstRate)
        const totalWithGst = totals[company] + cgst + sgst
        gstDetails[company] = { cgst, sgst, totalWithGst }
      }
  
      rows.push([
        { content: `CGST (${gstPercent}%)`, colSpan: 3, styles: { halign: 'right' } },
        '',
        formatAmount(gstDetails[companies.kumaran].cgst),
        '',
        formatAmount(gstDetails[companies.santhosh].cgst),
        '',
        formatAmount(gstDetails[companies.raghavendra].cgst),
        '',
      ])
  
      rows.push([
        { content: `SGST (${gstPercent}%)`, colSpan: 3, styles: { halign: 'right' } },
        '',
        formatAmount(gstDetails[companies.kumaran].sgst),
        '',
        formatAmount(gstDetails[companies.santhosh].sgst),
        '',
        formatAmount(gstDetails[companies.raghavendra].sgst),
        '',
      ])
  
      rows.push([
        { content: 'Grand Total (Incl. GST)', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } },
        '',
        formatAmount(gstDetails[companies.kumaran].totalWithGst),
        '',
        formatAmount(gstDetails[companies.santhosh].totalWithGst),
        '',
        formatAmount(gstDetails[companies.raghavendra].totalWithGst),
        '',
      ])
    }
  
    autoTable(doc, {
      startY: 40,
      head: [
        [
          { content: 'No', rowSpan: 2, styles: { halign: 'center' } },
          { content: 'Description Of Work', rowSpan: 2 },
          { content: 'Qty', rowSpan: 2, styles: { halign: 'center' } },
          { content: 'Sri Kumaran Electricals', colSpan: 2, styles: { halign: 'center' } },
          { content: 'Santhosh Enterprises', colSpan: 2, styles: { halign: 'center' } },
          { content: 'Sri Raghavendra Electricals', colSpan: 2, styles: { halign: 'center' } },
          { content: 'Remarks', rowSpan: 2 },
        ],
        ['Rate', 'Amount', 'Rate', 'Amount', 'Rate', 'Amount'],
      ],
      body: rows,
      styles: {
        fontSize: 8,
        lineColor: [0, 0, 0],
        lineWidth: 0.2,
        halign: 'center',
      },
      headStyles: {
        fillColor: [220, 220, 220],
        textColor: 0,
        lineColor: [0, 0, 0],
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
      theme: 'grid',
    })
  
    // Lowest calculation
    let lowestCompany
    if (gstPercent > 0) {
      lowestCompany = Object.values(companies).reduce((a, b) =>
        gstDetails[a].totalWithGst < gstDetails[b].totalWithGst ? a : b
      )
    } else {
      lowestCompany = Object.values(companies).reduce((a, b) =>
        totals[a] < totals[b] ? a : b
      )
    }
  
    const finalY = doc.lastAutoTable.finalY + 10
    doc.setFont('helvetica', 'bold')
    doc.text(`Lowest Rate For: ${lowestCompany.toUpperCase()}`, 14, finalY)
  
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
                  <CTableHeaderCell scope="col">Kumaran</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Santhosh</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Raghavendra</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Compare Statement</CTableHeaderCell>
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
                        {/* <CButton color="success" >
                        <CIcon icon={cilDataTransferDown} customClassName="nav-icon" />
                        </CButton> */}
                        <CButton color="info" onClick={() => generatePDFDownload(prod,1)}>
  <CIcon icon={cilDataTransferDown} title="Download file" />
</CButton>
                      </CTableDataCell>
                      <CTableDataCell>
                        <CButton color="primary" onClick={() => generatePDFDownload(prod,3)}>
                        <CIcon icon={cilDataTransferDown} title="Download file" /> 
                        </CButton>
                      </CTableDataCell>
                      <CTableDataCell>
                        <CButton color="warning" onClick={() => generatePDFDownload(prod,2)}>
                        <CIcon icon={cilDataTransferDown} title="Download file" /> 
                        </CButton>
                      </CTableDataCell>
                      <CTableDataCell>
                        <CButton color="success" onClick={() => fetchgetBillingDetails(prod)}>
                        <CIcon icon={cilDataTransferDown} title="Download file" />
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
