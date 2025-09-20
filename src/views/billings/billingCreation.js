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
import { createBilling } from '../services/api'
///import 'jspdf-autotable'; // This *extends* jsPDF with the autoTable plugin


// Setup pdfMake fonts

const BillingCreation = () => {
  const [billingInfo, setBillingInfo] = useState({
    description: '',
    customerName: '',
    companyName: '',
  })

  const [billings, setBillings] = useState([])

  const [parentList, setParentList] = useState([])
  const [customerList, setCustomerList] = useState([])
  const [productOptions, setProductOptions] = useState([])
  const [form, setForm] = useState({
    description: '',
    customerId: '',
    parent_produc_id: '',
    products: [] // array of added products
  });
  const [newProduct, setNewProduct] = useState({
    product: '',
    price: '',
    qty: '',
  })

  console.log(billings,
  )
  useEffect(() => {
    fetchParentProducts()
    fetchCustomers()
    fetchgetBillingDetails()
  }, [])

  const fetchParentProducts = () => {
    axios
      .get('http://localhost:5000/api/parent-products')
      .then((res) => setParentList(res.data))
      .catch((err) => console.error(err))
  }

  const fetchCustomers = () => {
    axios
      .get('http://localhost:5000/api/customers')
      .then((res) => setCustomerList(res.data))
      .catch((err) => console.error(err))
  }

  const fetchgetBillingDetails = () => {
    axios.get(`http://localhost:5000/api/products/billing-details/2`)
      .then((res) => setBillings(res.data.data))
      .catch((err) => console.error(err))
  }

  
  const generateComparativePDF = (data) => {
    const doc = new jsPDF()
  
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('COMPARATIVE STATEMENT', 75, 10)
  
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Name Of The Union     : Poondi', 14, 20)
    doc.text('Name Of The Panchayat : Melakkarumannur', 14, 26)
    doc.text('Name Of the Work      : ____________________', 14, 32)
  
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
      head: [[
        'Sl.No',
        'Description Of Work',
        'Qty',
        'Rate by Sri Kumaran',
        'Amount',
        'Rate by Santhosh',
        'Amount',
        'Rate by Raghavendra',
        'Amount',
        'Remarks',
      ]],
      body: rows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [220, 220, 220], textColor: 0 },
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
    })
  
    const finalY = doc.lastAutoTable.finalY + 10

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Total Quoted Amount:', 14, finalY);
    
    doc.setFont('helvetica', 'normal');
    
    const lineSpacing = 6; 
    let currentY = finalY + lineSpacing;
    
    doc.text(`Sri Kumaran:${totals[companies.kumaran].toLocaleString('en-IN')}`, 14, currentY);
    currentY += lineSpacing;
    
    doc.text(`Santhosh Enterprises: ${totals[companies.santhosh].toLocaleString('en-IN')}`, 14, currentY);
    currentY += lineSpacing;
    
    doc.text(`Sri Raghavendra: ${totals[companies.raghavendra].toLocaleString('en-IN')}`, 14, currentY);
    
    currentY += lineSpacing;
 
    const lowestCompany = Object.keys(totals).reduce((a, b) => (totals[a] < totals[b] ? a : b))
    doc.setFont('helvetica', 'bold')
    doc.text(`Lowest Rate For: ${lowestCompany.toUpperCase()}`, 14, finalY + 30)
  
    const blobURL = doc.output('bloburl')
    window.open(blobURL)
  }
  
  
  

  async function fetchProductsByParent(parentId) {
    try {
      const res = await axios.get(`http://localhost:5000/api/products/by-parent/${parentId}`);
      const options = res.data.map((p) => ({
        value: p.prod_id,
        label: p.prod_name,
        price: p.prod_price_1,
      }));
  
      console.log(res.data);
      setProductOptions(options);
    } catch (err) {
      console.error('Error fetching products', err);
      setProductOptions([]);
    }
  }
  
  useEffect(() => {
    if (form.parent_id) {
      fetchProductsByParent(form.parent_id);
    } else {
      setProductOptions([]); // clear options if no parent
    }
  }, [form.parent_id]);  // ✅ depend only on parent_id
  


  const handleRemoveProduct = (index) => {
    const updatedProducts = formData.products.filter((_, i) => i !== index)
    setForm((prev) => ({
      ...prev,
      products: updatedProducts,
    }))
  }

  const totalAmount = form.products.reduce((sum, item) => sum + item.total, 0)





  const handleSubmit = async () => {
    try {
      const response = await createBilling(form);
      alert("Billing created successfully!");
    } catch (error) {
      alert("Failed to create billing");
    }
  };


  const generatePDF = () => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()

    doc.setFontSize(10)

    // Center "Jai Gurudev" at the top
    const gurudevText = 'Jai Gurudev'
    const textWidth = doc.getTextWidth(gurudevText)
    doc.text(gurudevText, (pageWidth - textWidth) / 2, 10)
    const muruganImageBase64 =
      'https://thumbs.dreamstime.com/b/sketch-lord-murugan-kartikeya-outline-editable-vector-illustration-drawing-184058651.jpg' // insert base64 of red Murugan image
    doc.addImage(muruganImageBase64, 'PNG', 10, 10, 25, 25)
    // Company Header
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 0, 0)
    doc.text('SRI KUMARAN ELECTRICALS', 60, 17)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    doc.text('All Types of Motor Repairing with Panel Board Starters', 60, 25)
    doc.text('Panchayat Board Motors and Engineering Works done here.', 54, 30)

    doc.setFont('helvetica', 'bold')
    doc.text('QUATATION', 90, 36)
    doc.setFont('helvetica', 'normal')

    doc.text('Prop. : SANJEEVA', 160, 15)
    doc.text('Cell : 7708801975', 160, 20)

    doc.setFontSize(10)
    doc.text('No.2, Saravana Complex, Nagalapuram Road, Uthukottai - 602 026.', 55, 42)

    // Customer and Work Info
    doc.setFontSize(11)
    doc.text(`Customer Name: ${form.cust_name}`, 14, 55)
    doc.text(`Description: ${form.description}`, 14, 61)

    // Table
    autoTable(doc, {
      startY: 70,
      head: [['S.NO', 'PATICULARS', 'QTY', 'RATE', 'AMOUNT']],
      body: form.products.map((p, i) => [
        i + 1,
        p.productName,
        p.qty,
        p.price,
        p.total,
      ]),
      styles: {
        fontSize: 10,
        cellPadding: { top: 3, right: 3, bottom: 3, left: 3 },
        valign: 'middle',
        halign: 'center',
        lineColor: [0, 0, 0],
        lineWidth: 0.3,
      },
      headStyles: {
        fillColor: false,
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'center',
        lineWidth: 0.5,
        lineColor: [0, 0, 0],
      },
      bodyStyles: {
        fillColor: false,
        textColor: [0, 0, 0],
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' }, // S.NO
        1: { cellWidth: 100, halign: 'left' }, // PATICULARS
        2: { cellWidth: 20, halign: 'center' }, // QTY
        3: { cellWidth: 25, halign: 'right' }, // RATE
        4: { cellWidth: 30, halign: 'right' }, // AMOUNT
      },
      didDrawPage: function (data) {
        const finalY = data.cursor.y + 2
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text('TOTAL', 145, finalY + 10)
        doc.text(totalAmount.toFixed(2), 180, finalY + 10, { align: 'right' })
        doc.setLineWidth(0.5)
        doc.rect(140, finalY + 3, 60, 10) // Border around TOTAL amount
      },
    })

    // Total Amount
    doc.setFontSize(12)
    const pdfBlobUrl = doc.output('bloburl')
    window.open(pdfBlobUrl, '_blank')
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Billing Creation</strong>
          </CCardHeader>
          <CCardBody>
            <CForm className="mb-4">
              <CRow className="mb-3">
                <CCol md={4}>
                  <CFormLabel>Billing Description</CFormLabel>
                  <CFormInput
                    name="description"
                    value={form.description}
                    onChange={(e) => {
                      const selectedId = e.target.value
                      setForm((prev) => ({
                        ...prev,
                        description: selectedId,
                       
                      }))
                    }}
                    placeholder="Enter billing description"
                  />
                </CCol>
                <CCol md={4}>
                  <CFormLabel>Customer Name</CFormLabel>

                 

                  <CFormSelect
                    name="customerId"
                    value={form.cust_id || ''}
                    onChange={(e) => {
                      const selectedId = e.target.value
                      const selectedCustomer = customerList.find(
                        (c) => c.cust_id === parseInt(selectedId),
                      )

                      setForm((prev) => ({
                        ...prev,
                        cust_id: selectedId,
                        cust_name: selectedCustomer ? selectedCustomer.cust_name : '',
                      }))
                    }}
                  >
                    <option value="">Select Customer</option>
                    {customerList.map((p) => (
                      <option key={p.cust_id} value={p.cust_id}>
                        {p.cust_name}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
                <CCol md={4}>
                  <CFormLabel>Parent Product</CFormLabel>

                  <CFormSelect
                    name="parent_produc_id"
                    value={form.parent_id}
                    onChange={(e) => {
                      const selectedId = e.target.value
                      const selectedCustomer = parentList.find(
                        (c) => c.parent_id === parseInt(selectedId),
                      )

                      setForm((prev) => ({
                        ...prev,
                        parent_id: selectedId,
                        parent_product_name: selectedCustomer
                          ? selectedCustomer.parent_product_name
                          : '',
                      }))
                    }}
                  >
                    <option value="">Select Parent Product</option>
                    {parentList.map((p) => (
                      <option key={p.parent_id} value={p.parent_id}>
                        {p.parent_product_name}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
              </CRow>
            </CForm>

            <hr />

            <CRow className="mb-3">
              <CCol md={3}>
                <CFormLabel>Product</CFormLabel>
                <Select
                  name="product"
                  options={productOptions}
                  value={productOptions.find((opt) => opt.value === newProduct.product) || null}
                  onChange={(selectedOption) => {
                    setNewProduct({
                      ...newProduct,
                      product: selectedOption?.value || '',
                      productName: selectedOption?.label || '', 
                      price: selectedOption?.price || '',
                      qty: '',
                    })
                  }}
                  placeholder="Select product..."
                  isClearable
                />
              </CCol>

              <CCol md={3}>
                <CFormLabel>Quantity</CFormLabel>
                <CFormInput
                  type="number"
                  name="qty"
                  value={newProduct.qty}
                  onChange={(e) => {
                    const qty = parseInt(e.target.value) || 0
                    setNewProduct({
                      ...newProduct,
                      qty,
                      total: qty * (newProduct.price || 0),
                    })
                  }}
                />
              </CCol>

              <CCol md={3}>
                <CFormLabel>Price</CFormLabel>
                <CFormInput type="number" name="price" value={newProduct.price} disabled />
              </CCol>

              <CCol md={3} className="d-flex align-items-end">
                <CButton
                  onClick={() => {
                    if (newProduct.product && newProduct.qty && newProduct.price) {
                      setForm((prev) => ({
                        ...prev,
                        products: [
                          ...prev.products,
                          {
                            ...newProduct,
                            total: newProduct.qty * newProduct.price,
                          },
                        ],
                      }))
                      setNewProduct({ product: '', qty: '', price: '' }) // reset
                    }
                  }}
                >
                  Add Product
                </CButton>
              </CCol>
            </CRow>

            <CTable bordered hover>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>#</CTableHeaderCell>
                  <CTableHeaderCell>Product</CTableHeaderCell>
                  <CTableHeaderCell>Qty</CTableHeaderCell>
                  <CTableHeaderCell>Price</CTableHeaderCell>
                  <CTableHeaderCell>Total</CTableHeaderCell>
                  <CTableHeaderCell>Actions</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {form.products.map((prod, index) => (
                  <CTableRow key={index}>
                    <CTableHeaderCell>{index + 1}</CTableHeaderCell>
                    <CTableDataCell>{prod.productName}</CTableDataCell>
                    <CTableDataCell>{prod.qty}</CTableDataCell>
                    <CTableDataCell>{prod.price}</CTableDataCell>
                    <CTableDataCell>{prod.total}</CTableDataCell>
                    <CTableDataCell>
                      <CButton color="danger" size="sm" onClick={() => handleRemoveProduct(index)}>
                        Remove
                      </CButton>
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          </CCardBody>
        </CCard>
      </CCol>

      <CRow className="mt-4">
        <CCol className="d-flex justify-content-end">
          <CButton color="success" onClick={generatePDF} style={{margin:"10px"}}>
            Download PDF
          </CButton>
          <CButton color="primary" onClick={handleSubmit} style={{margin:"10px"}}>
          Create Billing
          </CButton>
        </CCol>
      </CRow>
    </CRow>
  )
}

export default BillingCreation
