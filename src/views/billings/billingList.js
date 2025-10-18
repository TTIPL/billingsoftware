import React, { useState, useEffect } from 'react'
import CIcon from '@coreui/icons-react'
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
import {cilDataTransferDown } from '@coreui/icons'
import { Link } from 'react-router-dom'
import axios from 'axios'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { api_url } from '../../../config'

const BilllingList = () => {
  const [billings, setBillings] = useState([])
  const [billingList, setBillingList] = useState([])
  useEffect(() => {
    fetchgetAllBillings()
  }, [])

  const handleDelete = (data) => {
    axios.delete(`${api_url}products/billing/${data.billing_id}`)
    .then(() => {
      fetchgetAllBillings();
      alert("billing deleted successfully")
    });
  };


  const fetchgetAllBillings = () => {
    axios
      .get(`${api_url}products/all-billings`)
      .then((res) => setBillingList(res.data.data))
      .catch((err) => console.error(err))
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
          const gstPercent = parseFloat(gstValueString.replace('%', '')) || 0
          console.log(gstPercent)
          generateComparativePDFWithGST(billingData, bill, gstPercent)
        } else {
          generateComparativePDF(billingData, bill)
        }
      })
      .catch((err) => console.error(err))
  }

  const generateComparativePDF = (data, bill) => {
    const doc = new jsPDF({ orientation: 'landscape' })

    doc.setFontSize(12)
    doc.setFont('times', 'bold')
    doc.text('COMPARATIVE STATEMENT', 75, 10)

    doc.setFontSize(10)
    doc.setFont('times', 'normal')
    doc.text(`Name Of The Union     : ${bill.cust_address}`, 14, 20)
    doc.text(`Name Of The Panchayat : ${bill.cust_name}`, 14, 26)
    doc.text(`Name Of the Work      : ${bill.billing_description}`, 14, 32)

    const grouped = {}
    const totals = {
      'Sri Kumaran Electricals': 0,
      'Santhosh Enterprises': 0,
      'Raghavendra Enterprises': 0,
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
      raghavendra: 'Raghavendra Enterprises',
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
        row[companies.kumaran]?.amount?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) ||
          '-',
        row[companies.santhosh]?.rate?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || '-',
        row[companies.santhosh]?.amount?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) ||
          '-',
        row[companies.raghavendra]?.rate?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) ||
          '-',
        row[companies.raghavendra]?.amount?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) ||
          '-',
        '',
      ])
    }

    // Subtotal row inside table
    rows.push([
      { content: 'Subtotal', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' ,font: "times",  
        fontSize: 10,} },
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
        font: 'times', // use Times New Roman (built-in as "times")
        fontStyle: 'normal', // normal / bold / italic / bolditalic
        fontSize: 10,
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
    const lowestCompany = Object.keys(totals).reduce((a, b) => (totals[a] < totals[b] ? a : b))

    const finalY = doc.lastAutoTable.finalY + 10
    doc.setFont('times', 'bold')
    doc.text(`Lowest Rate For: ${lowestCompany.toUpperCase()}`, 14, finalY)

    const blobURL = doc.output('bloburl')
    window.open(blobURL)
  }

  const generateComparativePDFWithGST = (data, bill, gstPercent) => {
    const doc = new jsPDF({ orientation: 'landscape' })

    doc.setFontSize(12)
    doc.setFont('times', 'bold')
    doc.text('COMPARATIVE STATEMENT', 75, 10)

    doc.setFontSize(12)
    doc.setFont('times', 'normal')
    doc.text(`Name Of The Union     : ${bill.cust_address}`, 14, 20)
    doc.text(`Name Of The Panchayat : ${bill.cust_name}`, 14, 26)
    doc.text(`Name Of the Work      : ${bill.billing_description}`, 14, 32)

    const grouped = {}
    const totals = {
      'Sri Kumaran Electricals': 0,
      'Santhosh Enterprises': 0,
      'Raghavendra Enterprises': 0,
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
      raghavendra: 'Raghavendra Enterprises',
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
      { content: 'Subtotal', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' ,
        font: "times",  
        fontSize: 10,
      } },
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
        { content: `CGST (${gstPercent}%)`, colSpan: 3,styles: { halign: 'right', fontStyle: 'bold' ,
          font: 'times',  
          fontSize: 10,
        } },
        '',
        formatAmount(gstDetails[companies.kumaran].cgst),
        '',
        formatAmount(gstDetails[companies.santhosh].cgst),
        '',
        formatAmount(gstDetails[companies.raghavendra].cgst),
        '',
      ])

      rows.push([
        { content: `SGST (${gstPercent}%)`, colSpan: 3,styles: { halign: 'right', fontStyle: 'bold' ,
          font: 'times',  
      
          fontSize: 10,
        } },
        '',
        formatAmount(gstDetails[companies.kumaran].sgst),
        '',
        formatAmount(gstDetails[companies.santhosh].sgst),
        '',
        formatAmount(gstDetails[companies.raghavendra].sgst),
        '',
      ])

      rows.push([
        {
          content: 'Grand Total (Incl. GST)',
          colSpan: 3,
          styles: { halign: 'right', fontStyle: 'bold' },
        },
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
          { content: 'Raghavendra Enterprises', colSpan: 2, styles: { halign: 'center' } },
          { content: 'Remarks', rowSpan: 2 },
        ],
        ['Rate', 'Amount', 'Rate', 'Amount', 'Rate', 'Amount'],
      ],
      body: rows,
      styles: {
        font: 'times', // use Times New Roman (built-in as "times")
        fontStyle: 'normal', // normal / bold / italic / bolditalic
        fontSize: 10,
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
        gstDetails[a].totalWithGst < gstDetails[b].totalWithGst ? a : b,
      )
    } else {
      lowestCompany = Object.values(companies).reduce((a, b) => (totals[a] < totals[b] ? a : b))
    }

    const finalY = doc.lastAutoTable.finalY + 10
    doc.setFont('times', 'bold')
    doc.text(`Lowest Rate For: ${lowestCompany.toUpperCase()}`, 14, finalY)

    const blobURL = doc.output('bloburl')
    window.open(blobURL)
  }

  const generatePDFDownload = (data, orgId) => {
    const mastersData = JSON.parse(localStorage.getItem('masters') || '[]')
    const masterSettings = Array.isArray(mastersData) ? mastersData[0] : mastersData

    const gstValueString = masterSettings?.gst_value || '0'
    const gstPercent = parseFloat(gstValueString.replace('%', '')) || 0

    const settings = {
      gstSupport: !!masterSettings?.gst_support,
      pdfLabelSupport: !!masterSettings?.pdf_label_support,
    }

    let id = data.billing_id
    axios.get(`${api_url}products/billing-details/${id}`).then((res) => {
      let billingData = res.data.data
      let respData = billingData.filter((res) => {
        return res.company_id === orgId
      })
      generateUnifiedPDF(respData, gstPercent, settings)
    })
  }


  const generateUnifiedPDF = (formData, gstPercent, settings) => {
    const doc = new jsPDF();
    const gstRate = gstPercent / 100;
    const pageWidth = doc.internal.pageSize.getWidth();
  
    // Prepare product data
    const products = formData.map((item) => ({
      productName: item.prod_name,
      qty: Number(item.prod_qty),
      price: Number(item.prod_price),
      total: Number(item.total_amt),
    }));
  
    // Totals
    const totalAmountRaw = products.reduce((sum, p) => sum + p.total, 0);
    const cgstAmountRaw = totalAmountRaw * gstRate;
    const sgstAmountRaw = totalAmountRaw * gstRate;
    const grandTotalRaw =  Math.round(parseFloat(totalAmountRaw)) +  Math.round(parseFloat(cgstAmountRaw)) +  Math.round(parseFloat(sgstAmountRaw));
  
    const totalAmount =  Math.round(parseFloat(totalAmountRaw));
    const cgstAmount = Math.round(parseFloat(cgstAmountRaw));
    const sgstAmount = Math.round(parseFloat(sgstAmountRaw));
    const grandTotal = Math.round(parseFloat(grandTotalRaw));
  
    // Header
    if (settings.pdfLabelSupport) {
      addCustomHeader(doc, pageWidth, formData[0]);
    }
  
    const customer = formData[0];
    const customerStartY = 75;
  
    doc.setFontSize(10);
    doc.setFont("times", "normal");
    doc.setTextColor(0, 0, 0);
    doc.text(` ${customer.cust_name}`, 14, customerStartY);
    doc.text(
      `All Types of Motor Repairing with Panel Board Starters`,
      14,
      customerStartY + 6
    );
  
    // Table rows
    const productRows = products.map((p, i) => [
      i + 1,
      p.productName,
      p.qty,
      p.price.toLocaleString(),
      p.total.toLocaleString(),
    ]);
  
    // Subtotal row
    productRows.push([
      { content: "Subtotal", colSpan: 4, styles: { halign: "right", fontStyle: "bold" } },
      { content: totalAmount.toLocaleString(), styles: { halign: "right", fontStyle: "bold" } },
    ]);
  
    // GST rows
    if (settings.gstSupport && gstPercent > 0) {
      productRows.push(
        [
          { content: `CGST (${gstPercent}%)`, colSpan: 4, styles: { halign: "right", fontStyle: "bold" } },
          { content: cgstAmount.toLocaleString(), styles: { halign: "right", fontStyle: "bold" } },
        ],
        [
          { content: `SGST (${gstPercent}%)`, colSpan: 4, styles: { halign: "right", fontStyle: "bold" } },
          { content: sgstAmount.toLocaleString(), styles: { halign: "right", fontStyle: "bold" } },
        ],
        [
          { content: "Gran Total (Incl. GST)", colSpan: 4, styles: { halign: "right", fontStyle: "bold" } },
          { content: grandTotal.toLocaleString(), styles: { halign: "right", fontStyle: "bold" } },
        ]
      );
    }
  
    // Render table
    autoTable(doc, {
      startY: 85,
      head: [["S.NO", "PARTICULARS", "QTY", "RATE", "AMOUNT"]],
      body: productRows,
      styles: {
        font: "times",
        fontStyle: "normal",
        fontSize: 10,
        cellPadding: 3,
        valign: "middle",
        halign: "center",
        lineWidth: 0.3,         // ✅ add border
        lineColor: [0, 0, 0],   // ✅ black border
        fillColor: [255, 255, 255], // ✅ white background for all
      },
      headStyles: {
        textColor: [0, 0, 0],
        fontStyle: "bold",
        halign: "center",
        lineWidth: 0.3,        // ✅ border in header
        lineColor: [0, 0, 0],
        fillColor: [255, 255, 255], // ✅ remove gray background
      },
      alternateRowStyles: {
        fillColor: [255, 255, 255], // ✅ remove gray on odd rows
      },
      columnStyles: {
        0: { cellWidth: 15, halign: "center" }, // S.NO
        1: { cellWidth: 90, halign: "left" },   // PARTICULARS
        2: { cellWidth: 20, halign: "center" }, // QTY
        3: { cellWidth: 25, halign: "right" },  // RATE
        4: { cellWidth: 30, halign: "right" },  // AMOUNT
      },
      didDrawPage: function (data) {
        const pageWidth = doc.internal.pageSize.getWidth();
        const tableBottomY = data.cursor.y;
        doc.setFontSize(10);
        doc.setFont("times", "normal");
        doc.text(
          `For ${formData[0].company_name}`,
          pageWidth - 60,
          tableBottomY + 30
        );
      },
    });
  
    // Open PDF
    const pdfBlobUrl = doc.output("bloburl");
    window.open(pdfBlobUrl, "_blank");
  };
  

const addCustomHeader = (doc, pageWidth, cust) => {
  const header_content = [
    {
      company_name: "sri kumaran electricals",
      line_1: "All Types of Motor Repairing with Panel Board Starters",
      line_2: "Panchayat Board Motors and Engineering Works done here.",
      address: "No.2, Saravana Complex, Nagalapuram Road, Uthukottai - 602 026.",
    },
    {
      company_name: "santhosh enterprises",
      line_1: "Tecmo Pump Set Dealers IS/ISO 9002 & Hardwares",
      line_2: "Dealers in Crompton Greaves Lights & True Bore Pipe",
      address: "No.141 /A5, G.N.T. Road, Karanodai, Chennai - 600 067",
    },
    {
      company_name: "raghavendra enterprises",
      line_1:
        "We Undertake all types of bore well plumbing works and electrical contracts",
      line_2:
        "Dealers in Submotor Pumps, G.I. Pipes, PVC Supreme Pipes I.S.I 9001 & Bore Pipes",
      address: "No.1/141, G.N.T. Road, Sholavaram, Chennai - 600 067",
    },
  ];

  // ✅ Find matching company (case-insensitive)
  const headerData =
    header_content.find(
      (h) =>
        h.company_name.trim().toLowerCase() ===
        cust.company_name.trim().toLowerCase()
    ) || header_content[0];

  // --- Common setup ---
  doc.setFont("times", "normal");
  doc.setTextColor(0, 0, 0);

  // ✅ Only for Sri Kumaran Electricals → Jai Gurudev + Murugan logo
  if (headerData.company_name.toLowerCase() === "sri kumaran electricals") {
    const gurudevText = "Jai Gurudev";
    const textWidth = doc.getTextWidth(gurudevText);
    doc.setFontSize(10);
    doc.text(gurudevText, (pageWidth - textWidth) / 2, 10);

    const muruganImageBase64 =
      "https://thumbs.dreamstime.com/b/sketch-lord-murugan-kartikeya-outline-editable-vector-illustration-drawing-184058651.jpg";
    doc.addImage(muruganImageBase64, "PNG", 15, 12, 22, 22); // left logo
  }

  // --- Company name ---
  doc.setFont("times", "bold");
  doc.setFontSize(16);
  doc.setTextColor(255, 0, 0);

  const companyText = headerData.company_name.toUpperCase();
  const companyWidth = doc.getTextWidth(companyText);
  doc.text(companyText, (pageWidth - companyWidth) / 2, 20);

  // --- Taglines / line_1 and line_2 ---
  doc.setFont("times", "normal");
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);

  const line1Width = doc.getTextWidth(headerData.line_1);
  const line2Width = doc.getTextWidth(headerData.line_2);
  doc.text(headerData.line_1, (pageWidth - line1Width) / 2, 26);
  doc.text(headerData.line_2, (pageWidth - line2Width) / 2, 31);

  // --- Address ---
  const addrWidth = doc.getTextWidth(headerData.address);
  doc.text(headerData.address, (pageWidth - addrWidth) / 2, 37);

  // // --- Quotation title ---
  // doc.setFont("times", "bold");
  // doc.setFontSize(12);
  // doc.setTextColor(0, 0, 0);
  // const quotationText = "QUOTATION";
  // const quotationWidth = doc.getTextWidth(quotationText);
  // doc.text(quotationText, (pageWidth - quotationWidth) / 2, 43);

  // --- Optional separator line for neatness ---
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(15, 45, pageWidth - 15, 45);
};


  const formatDateUTC = (dateString) => {
    if (!dateString) return ''

    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''

    const year = date.getUTCFullYear()
    const month = String(date.getUTCMonth() + 1).padStart(2, '0') 
    const day = String(date.getUTCDate()).padStart(2, '0') 

    return `${day}-${month}-${year}` 
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
                  <CTableHeaderCell scope="col">Created Date</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Kumaran</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Santhosh</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Raghavendra</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Compare Statement</CTableHeaderCell>
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
                      <CTableDataCell>{formatDateUTC(prod.created_at)}</CTableDataCell>
                      <CTableDataCell>
                        <CButton color="info" onClick={() => generatePDFDownload(prod, 1)}>
                          <CIcon icon={cilDataTransferDown} title="Download file" />
                        </CButton>
                      </CTableDataCell>
                      <CTableDataCell>
                        <CButton color="primary" onClick={() => generatePDFDownload(prod, 3)}>
                          <CIcon icon={cilDataTransferDown} title="Download file" />
                        </CButton>
                      </CTableDataCell>
                      <CTableDataCell>
                        <CButton color="warning" onClick={() => generatePDFDownload(prod, 2)}>
                          <CIcon icon={cilDataTransferDown} title="Download file" />
                        </CButton>
                      </CTableDataCell>
                      <CTableDataCell>
                        <CButton color="success" onClick={() => fetchgetBillingDetails(prod)}>
                        <CIcon icon={cilDataTransferDown} title="Download file" />
                        </CButton>
                      </CTableDataCell>
                      <CTableDataCell>
                      <CButton size="sm" color="info" onClick={() => handleDelete(prod)} className="me-1">Delete</CButton>
                      
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

export default BilllingList
