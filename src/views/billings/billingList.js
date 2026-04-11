import React, { useState, useEffect } from 'react'
import CIcon from '@coreui/icons-react'
import {
  CCard, CCardBody, CCardHeader, CCol, CRow, CTable,
  CTableBody, CTableDataCell, CTableHead, CTableHeaderCell,
  CTableRow, CButton,
} from '@coreui/react'
import { cilDataTransferDown } from '@coreui/icons'
import { Link } from 'react-router-dom'
import axios from 'axios'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { api_url } from '../../../config'

const BilllingList = () => {
  const [billingList, setBillingList] = useState([])

  useEffect(() => {
    fetchgetAllBillings()
  }, [])

  const fetchgetAllBillings = () => {
    axios
      .get(`${api_url}products/all-billings`)
      .then((res) => setBillingList(res.data.data))
      .catch((err) => console.error(err))
  }

  const handleDelete = (data) => {
    if (window.confirm("Are you sure you want to delete this billing?")) {
      axios.delete(`${api_url}products/billing/${data.billing_id}`)
        .then(() => {
          fetchgetAllBillings();
          alert("Billing deleted successfully")
        });
    }
  };

  /** * Helper: Maps Organization ID to Company Names 
   */
  const getCompanyNameById = (id) => {
    const names = {
      1: "Sri Kumaran Electricals",
      2: "Raghavendra Enterprises",
      3: "Santhosh Enterprises"
    }
    return names[id] || ""
  }

  /** * Logic for Individual Company Quotations 
   */
const generatePDFDownload = (row, orgId) => {
    const mastersData = JSON.parse(localStorage.getItem('masters') || '[]')
    const masterSettings = Array.isArray(mastersData) ? mastersData[0] : mastersData
    const gstPercent = parseFloat(masterSettings?.gst_value?.replace('%', '')) || 0
    const settings = {
      gstSupport: !!masterSettings?.gst_support,
      pdfLabelSupport: !!masterSettings?.pdf_label_support,
    }

    axios.get(`${api_url}products/billing-details/${row.billing_id}`).then((res) => {
      const rawData = res.data.data[0]
      if (!rawData) return alert("No data found")

      // 1. Handle JSON string parsing
      const parsedDetails = typeof rawData.details === 'string' ? JSON.parse(rawData.details) : rawData.details

      // 2. Determine Price Increase Multiplier
      // orgId 2 = 2% increase (1.02), orgId 3 = 3% increase (1.03), else 1 (no change)
      let multiplier = 1;
      if (orgId === 2) multiplier = 1.02;
      else if (orgId === 3) multiplier = 1.03;

      // 3. Map DB keys to PDF Function keys with applied price increase
      const formattedProducts = parsedDetails.map(item => {
        const originalRate = parseFloat(item.RATE) || 0;
        const increasedRate = originalRate * multiplier;
        
        // We strip non-numeric characters from QTY (e.g., "5RM" -> 5) for the math
        const qtyValue = parseFloat(String(item.QTY).replace(/[^0-9.]/g, '')) || 0;
        const increasedAmount = increasedRate * qtyValue;

        return {
          prod_name: item.PATICULARS,
          prod_qty: item.QTY, // Keeps the original string like "5RM"
          prod_price: increasedRate,
          total_amt: increasedAmount,
          company_name: getCompanyNameById(orgId),
          cust_name: rawData.title ,
          officer: rawData.officer,
          panchayat: rawData.panchayat,
          union: rawData.union 
        };
      });

      generateUnifiedPDF(formattedProducts, gstPercent, settings)
    })
  }

  /** * Logic for Comparative Statement 
   */
  const fetchgetBillingDetails = (row) => {
    axios.get(`${api_url}products/billing-details/${row.billing_id}`).then((res) => {
      const rawData = res.data.data[0]
      const parsedDetails = typeof rawData.details === 'string' ? JSON.parse(rawData.details) : rawData.details
      
      const mastersData = JSON.parse(localStorage.getItem('masters') || '[]')
      const masterSettings = Array.isArray(mastersData) ? mastersData[0] : mastersData
      const gstPercent = parseFloat(masterSettings?.gst_value?.replace('%', '')) || 0

      if (masterSettings?.gst_support) {
        generateComparativePDFWithGST(parsedDetails, row, gstPercent)
      } else {
        generateComparativePDF(parsedDetails, row)
      }
    })
  }

  // --- PDF GENERATION ENGINES ---

const generateUnifiedPDF = (formData, gstPercent, settings) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const customer = formData[0];

  // =========================
  // FORMAT FUNCTION (.00)
  // =========================
  const formatCurrency = (val) =>
    Number(val).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

  if (settings.pdfLabelSupport) {
    addCustomHeader(doc, pageWidth, formData[0]);
  }

  // =========================
  // CUSTOMER HEADER
  // =========================
  const headerLines = [
     customer.officer,
       customer.panchayat,
         customer.union,
    customer.cust_name,
  ];

  headerLines.forEach((line, index) => {
    doc.setFont("times", "normal").setFontSize(10);
    doc.text(line, 15, 60 + (index * 6));
  });

  // =========================
  // BODY DATA
  // =========================
  const productRows = formData.map((p, i) => [
    i + 1,
    p.prod_name,
    p.prod_qty,
    formatCurrency(p.prod_price),
    formatCurrency(p.total_amt)
  ]);

  // =========================
  // TOTAL CALCULATION
  // =========================
  const subtotal = formData.reduce((sum, p) => sum + p.total_amt, 0);
  const gstRate = gstPercent / 100;
  const tax = Math.round(subtotal * gstRate);
  const grandTotal = subtotal + (tax * 2);

  // =========================
  // FOOTER ROWS
  // =========================
  if (settings.gstSupport && gstPercent > 0) {
    productRows.push([
      '', '', '',
      'CGST (' + gstPercent + '%)',
      formatCurrency(tax)
    ]);

    productRows.push([
      '', '', '',
      'SGST (' + gstPercent + '%)',
      formatCurrency(tax)
    ]);

    productRows.push([
      '', '', '',
      'Grand Total (Incl. GST)',
      formatCurrency(grandTotal)
    ]);
  } else {
    productRows.push([
      '', '', '',
      'TOTAL',
      formatCurrency(subtotal)
    ]);
  }

  // =========================
  // TABLE
  // =========================
  autoTable(doc, {
    startY: 80,
    head: [["S.NO", "PARTICULARS", "METIRIAL", "RATE", "AMOUNT (Rs)"]],
    body: productRows,

    // ❌ remove grid
    theme: 'plain',

    styles: {
      font: "times",
      fontSize: 10,
      halign: 'center',
      lineWidth: 0,
      cellPadding: 2
    },

    headStyles: {
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center'
    },

    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: 95, halign: 'left' },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: 30, halign: 'right' },
    },

    // =========================
    // ALIGN FOOTER TEXT RIGHT
    // =========================
    didParseCell: function (data) {
      const lastRowsStart = data.table.body.length - (settings.gstSupport ? 3 : 1);

      if (data.section === 'body' && data.row.index >= lastRowsStart) {
        if (data.column.index === 3) {
          data.cell.styles.halign = 'right';
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },

    // =========================
    // BORDER CONTROL
    // =========================
    didDrawCell: (data) => {
      const { x, y, width, height } = data.cell;
      doc.setDrawColor(0);

      // HEADER → FULL BORDER
      if (data.section === 'head') {
        doc.setLineWidth(0.4);
        doc.rect(x, y, width, height);
      }

      // BODY → ONLY COLUMN LINES
      if (data.section === 'body') {
        doc.setLineWidth(0.2);

        // vertical lines
        doc.line(x, y, x, y + height);
        doc.line(x + width, y, x + width, y + height);

        // bottom border for last row
        const isLastRow = data.row.index === data.table.body.length - 1;
        if (isLastRow) {
          doc.setLineWidth(0.4);
          doc.line(x, y + height, x + width, y + height);
        }
      }
    }
  });

  // =========================
  // SIGNATURE
  // =========================
  doc.text(`For ${customer.company_name}`, pageWidth - 15, doc.lastAutoTable.finalY + 30, { align: 'right' });

  window.open(doc.output("bloburl"), "_blank");
};

  const addCustomHeader = (doc, pageWidth, cust) => {
    const header_content = [
        { company_name: "sri kumaran electricals", line_1: "All Types of Motor Repairing...", line_2: "Panchayat Board Motors...", address: "No.2, Saravana Complex..." },
        { company_name: "santhosh enterprises", line_1: "Tecmo Pump Set Dealers...", line_2: "Dealers in Crompton...", address: "No.141 /A5, G.N.T. Road..." },
        { company_name: "raghavendra enterprises", line_1: "We Undertake borewell works...", line_2: "Dealers in Submotor Pumps...", address: "No.1/141, G.N.T. Road..." }
    ]

    const header = header_content.find(h => h.company_name === cust.company_name.toLowerCase()) || header_content[0]
    
    doc.setFont("times", "bold").setFontSize(16).setTextColor(255, 0, 0)
    doc.text(header.company_name.toUpperCase(), pageWidth / 2, 20, { align: 'center' })
    doc.setFontSize(10).setTextColor(0).setFont("times", "normal")
    doc.text(header.line_1, pageWidth / 2, 26, { align: 'center' })
    doc.text(header.address, pageWidth / 2, 37, { align: 'center' })
    doc.line(15, 45, pageWidth - 15, 45)
  }

const generateComparativePDFWithGST = (data, bill) => {
  const doc = new jsPDF({ orientation: 'landscape' });

  // =========================
  // FORMAT FUNCTION (.00)
  // =========================
  const format = (val) =>
    Number(val).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

  // =========================
  // TITLE
  // =========================
  doc.setFont("times", "bold");
  doc.setFontSize(14);
  doc.text('COMPARATIVE STATEMENT', 148, 15, { align: 'center' });

  // =========================
  // HEADER DETAILS
  // =========================
  doc.setFontSize(10).setFont("times", "normal");
  doc.text(`Name Of The Union : ${bill.union || ''}`, 14, 25);
  doc.text(`Name Of The Panchayat : ${bill.panchayat || ''}`, 14, 31);
  doc.text(`Name Of the Work : ${bill.title || ''}`, 14, 37);

  const rows = [];
  const totals = { kumaran: 0, santhosh: 0, raghavendra: 0 };

  // =========================
  // DATA ROWS
  // =========================
  data.forEach((item, index) => {
    const baseRate = parseFloat(item.RATE) || 0;
    const qtyStr = item.QTY;
    const qtyNum = parseFloat(String(qtyStr).replace(/[^0-9.]/g, '')) || 0;

    const r_k = Math.round(baseRate);
    const a_k = r_k * qtyNum;

    const r_s = Math.round(baseRate * 1.02);
    const a_s = r_s * qtyNum;

    const r_r = Math.round(baseRate * 1.03);
    const a_r = r_r * qtyNum;

    totals.kumaran += a_k;
    totals.santhosh += a_s;
    totals.raghavendra += a_r;

    rows.push([
      index + 1,
      item.PATICULARS,
      qtyStr,
      format(r_k), format(a_k),
      format(r_s), format(a_s),
      format(r_r), format(a_r),
      ''
    ]);
  });

  // =========================
  // GST CALCULATION
  // =========================
  const gst = (val) => Math.round(val * 0.09);

  // Subtotal
  rows.push([
    '', 'Subtotal', '',
    '', format(totals.kumaran),
    '', format(totals.santhosh),
    '', format(totals.raghavendra),
    ''
  ]);

  // CGST
  rows.push([
    '', 'CGST 9%', '',
    '', format(gst(totals.kumaran)),
    '', format(gst(totals.santhosh)),
    '', format(gst(totals.raghavendra)),
    ''
  ]);

  // SGST
  rows.push([
    '', 'SGST 9%', '',
    '', format(gst(totals.kumaran)),
    '', format(gst(totals.santhosh)),
    '', format(gst(totals.raghavendra)),
    ''
  ]);

  // Grand Total
  const grand_k = totals.kumaran + gst(totals.kumaran) * 2;
  const grand_s = totals.santhosh + gst(totals.santhosh) * 2;
  const grand_r = totals.raghavendra + gst(totals.raghavendra) * 2;

  rows.push([
    '', 'Grand Total', '',
    '', format(grand_k),
    '', format(grand_s),
    '', format(grand_r),
    ''
  ]);

  // =========================
  // TABLE
  // =========================
  autoTable(doc, {
    startY: 40,
    head: [
      [
        { content: 'Sl.No', rowSpan: 2 },
        { content: 'Description Of Work', rowSpan: 2 },
        { content: 'Qty', rowSpan: 2 },
        { content: 'Rate  Quoted  by Sri Kumaran Elec', colSpan: 2 },
        { content: 'Rate  Quoted  by Santhosh Eps', colSpan: 2 },
        { content: 'Rate  Quoted  by Raghavendra Eps', colSpan: 2 },
        { content: 'Remarks', rowSpan: 2 }
      ],
      ['Rate', 'Amount', 'Rate', 'Amount', 'Rate', 'Amount']
    ],
    body: rows,
    theme: 'plain',

    styles: {
      font: 'times',
      fontSize: 9,
      halign: 'center',
      lineWidth: 0,
      cellPadding: 2
    },

    columnStyles: {
      1: { halign: 'left', cellWidth: 80 }
    },

    // Align GST & totals text right
    didParseCell: function (data) {
      const totalRowsStart = data.table.body.length - 4;

      if (data.section === 'body' && data.row.index >= totalRowsStart) {
        if (data.column.index === 1) {
          data.cell.styles.halign = 'right';
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },

    // =========================
    // BORDER CONTROL
    // =========================
    didDrawCell: (data) => {
      const { x, y, width, height } = data.cell;
      doc.setDrawColor(0);

      // HEADER → FULL BORDER
      if (data.section === 'head') {
        doc.setLineWidth(0.3);
        doc.rect(x, y, width, height);
      }

      // BODY → ONLY COLUMN LINES
      if (data.section === 'body') {
        doc.setLineWidth(0.2);

        // vertical lines
        doc.line(x, y, x, y + height);
        doc.line(x + width, y, x + width, y + height);

        // bottom border for last row
        const isLastRow = data.row.index === data.table.body.length - 1;
        if (isLastRow) {
          doc.setLineWidth(0.3);
          doc.line(x, y + height, x + width, y + height);
        }
      }
    }
  });

  // =========================
  // LOWEST VENDOR
  // =========================
  const lowest = Math.min(grand_k, grand_s, grand_r);
  let lowestName = '';

  if (lowest === grand_k) lowestName = 'SRI KUMARAN ELECTRICALS';
  else if (lowest === grand_s) lowestName = 'SANTHOSH';
  else lowestName = 'RAGHAVENDRA';

  doc.setFont("times", "bold");
  doc.text(`Lowest Rate For : ${lowestName}`, 100, doc.lastAutoTable.finalY + 10);

  // =========================
  // OUTPUT
  // =========================
  window.open(doc.output('bloburl'));
};

const generateComparativePDF = (data, bill) => {
  const doc = new jsPDF({ orientation: 'landscape' });

  // =========================
  // FORMAT FUNCTION (.00)
  // =========================
  const format = (val) =>
    Number(val).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

  // =========================
  // TITLE
  // =========================
  doc.setFont("times", "bold").setFontSize(12);
  doc.text('COMPARATIVE STATEMENT', 148, 15, { align: 'center' });

  // =========================
  // HEADER DETAILS
  // =========================
  doc.setFontSize(10).setFont("times", "normal");
  doc.text(`Name Of The Union : ${bill.union || ''}`, 14, 25);
  doc.text(`Name Of The Panchayat : ${bill.panchayat || ''}`, 14, 31);
  doc.text(`Name Of the Work : ${bill.title || ''}`, 14, 37);
  const rows = [];
  const totals = { kumaran: 0, santhosh: 0, raghavendra: 0 };

  // =========================
  // DATA ROWS
  // =========================
  data.forEach((item, index) => {
    const baseRate = parseFloat(item.RATE) || 0;
    const qtyStr = item.QTY;
    const qtyNum = parseFloat(String(qtyStr).replace(/[^0-9.]/g, '')) || 0;

    const r_kumaran = Math.round(baseRate);
    const a_kumaran = r_kumaran * qtyNum;

    const r_santhosh = Math.round(baseRate * 1.03);
    const a_santhosh = r_santhosh * qtyNum;

    const r_raghavendra = Math.round(baseRate * 1.02);
    const a_raghavendra = r_raghavendra * qtyNum;

    totals.kumaran += a_kumaran;
    totals.santhosh += a_santhosh;
    totals.raghavendra += a_raghavendra;

    rows.push([
      index + 1,
      item.PATICULARS,
      qtyStr,
      format(r_kumaran), format(a_kumaran),
      format(r_santhosh), format(a_santhosh),
      format(r_raghavendra), format(a_raghavendra),
      ''
    ]);
  });

  // =========================
  // TOTAL ROW
  // =========================
  rows.push([
    '', 'Total', '',
    '', format(totals.kumaran),
    '', format(totals.santhosh),
    '', format(totals.raghavendra),
    ''
  ]);

  // =========================
  // TABLE
  // =========================
  autoTable(doc, {
    startY: 42,
    head: [
      [
        { content: 'No', rowSpan: 2 },
        { content: 'Description Of Work', rowSpan: 2 },
        { content: 'Qty', rowSpan: 2 },
        { content: 'Rate  Quoted  by Sri Kumaran Elec', colSpan: 2 },
        { content: 'Rate  Quoted  by Santhosh Eps', colSpan: 2 },
        { content: 'Rate  Quoted  by Raghavendra Eps', colSpan: 2 },
        { content: 'Remarks', rowSpan: 2 }
      ],
      ['Rate', 'Amount', 'Rate', 'Amount', 'Rate', 'Amount']
    ],
    body: rows,

    // ❌ remove default grid
    theme: 'plain',

    styles: {
      font: 'times',
      fontSize: 9,
      halign: 'center',
      lineWidth: 0,
      cellPadding: 2
    },

    columnStyles: {
      1: { halign: 'left', cellWidth: 60 }
    },

    // =========================
    // ALIGN TOTAL TEXT RIGHT
    // =========================
    didParseCell: function (data) {
      const lastRow = data.table.body.length - 1;

      if (data.section === 'body' && data.row.index === lastRow) {
        if (data.column.index === 1) {
          data.cell.styles.halign = 'right';
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },

    // =========================
    // BORDER CONTROL
    // =========================
    didDrawCell: (data) => {
      const { x, y, width, height } = data.cell;
      doc.setDrawColor(0);

      // HEADER → FULL BORDER
      if (data.section === 'head') {
        doc.setLineWidth(0.3);
        doc.rect(x, y, width, height);
      }

      // BODY → ONLY COLUMN LINES
      if (data.section === 'body') {
        doc.setLineWidth(0.2);

        // vertical lines
        doc.line(x, y, x, y + height);
        doc.line(x + width, y, x + width, y + height);

        // bottom border for last row
        const isLastRow = data.row.index === data.table.body.length - 1;
        if (isLastRow) {
          doc.setLineWidth(0.3);
          doc.line(x, y + height, x + width, y + height);
        }
      }
    }
  });

  // =========================
  // LOWEST VENDOR
  // =========================
  const lowest = Object.keys(totals).reduce((a, b) =>
    totals[a] < totals[b] ? a : b
  );

  doc.setFont("times", "bold").text(
    `Lowest Rate For: ${getCompanyNameById(
      lowest === 'kumaran' ? 1 : lowest === 'raghavendra' ? 2 : 3
    ).toUpperCase()}`,
    100,
    doc.lastAutoTable.finalY + 10
  );

  window.open(doc.output('bloburl'));
};



const formatDateTimeUTC = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)

    // Date components
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()

    // Time components
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')

    // Returns format: DD-MM-YYYY HH:mm:ss
    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`
  }

  return (
    <CRow>
      <CCol xs={12} className="d-flex justify-content-end my-3">
        <Link to="/billingCreation"><CButton color="primary">Generate Billing</CButton></Link>
      </CCol>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader><strong>Billings Table</strong></CCardHeader>
          <CCardBody>
            <CTable bordered hover responsive>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>#</CTableHeaderCell>
                  <CTableHeaderCell>Description</CTableHeaderCell>
                  <CTableHeaderCell>Date</CTableHeaderCell>
                  <CTableHeaderCell>Kumaran</CTableHeaderCell>
                  <CTableHeaderCell>Santhosh</CTableHeaderCell>
                  <CTableHeaderCell>Raghavendra</CTableHeaderCell>
                  <CTableHeaderCell>Compare</CTableHeaderCell>
                  <CTableHeaderCell>Action</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {billingList.map((prod, index) => (
                  <CTableRow key={index}>
                    <CTableDataCell>{index + 1}</CTableDataCell>
                    <CTableDataCell>{prod.title}</CTableDataCell>
                    <CTableDataCell>{formatDateTimeUTC(prod.created_at)}</CTableDataCell>
                    <CTableDataCell><CButton color="info" size="sm" onClick={() => generatePDFDownload(prod, 1)}><CIcon icon={cilDataTransferDown} /></CButton></CTableDataCell>
                    <CTableDataCell><CButton color="primary" size="sm" onClick={() => generatePDFDownload(prod, 3)}><CIcon icon={cilDataTransferDown} /></CButton></CTableDataCell>
                    <CTableDataCell><CButton color="warning" size="sm" onClick={() => generatePDFDownload(prod, 2)}><CIcon icon={cilDataTransferDown} /></CButton></CTableDataCell>
                    <CTableDataCell><CButton color="success" size="sm" onClick={() => fetchgetBillingDetails(prod)}><CIcon icon={cilDataTransferDown} /></CButton></CTableDataCell>
                    <CTableDataCell><CButton color="danger" size="sm" onClick={() => handleDelete(prod)}>Delete</CButton></CTableDataCell>
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

export default BilllingList