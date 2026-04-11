import React, { useState, useEffect } from 'react'
import {
  CCard, CCardBody, CCardHeader, CCol, CRow, CForm,
  CFormInput, CFormLabel, CFormSelect, CButton,
  CTable, CTableHead, CTableRow, CTableHeaderCell,
  CTableBody, CTableDataCell,
} from '@coreui/react'
import Select from 'react-select'
import axios from 'axios'
import { createBilling } from '../services/api'
import { useNavigate } from 'react-router-dom'
import { api_url } from '../../../config'
import JSZip from 'jszip'  // npm install jszip

const BillingCreation = () => {
  const navigate = useNavigate()
  const [billings, setBillings] = useState([])
  const [parentList, setParentList] = useState([])
  const [customerList, setCustomerList] = useState([])
  const [productOptions, setProductOptions] = useState([])
  const [jsonData, setJsonData] = useState({ title: '', details: [], total_amount: 0, panchayat: 'Poondi panchayat', union: 'Poondi  union', officer: "M/S The special officer" });
  const [form, setForm] = useState({
    description: '',
    customerId: '',
    parent_produc_id: '',
    products: [],
  })

  const [newProduct, setNewProduct] = useState({ product: '', price: '', qty: '' })

  useEffect(() => {
    fetchgetBillingDetails()
  }, [])


  const fetchgetBillingDetails = () => {
    axios.get(`${api_url}products/billing-details/2`)
      .then((res) => setBillings(res.data.data)).catch(console.error)
  }





  const handleSubmit = async () => {
    try {
      console.log(jsonData,"jsonData")
      await createBilling(jsonData)
      alert('Billing created successfully!')
      navigate('/billingList')
    } catch {
      alert('Failed to create billing')
    }
  }


  const getCellText = (cellXml) => {
    const matches = cellXml.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || []
    return matches
      .map((m) => m.replace(/<w:t[^>]*>/, '').replace(/<\/w:t>/, ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  const getParaValues = (cellXml) => {
    const paragraphs = cellXml.match(/<w:p[ >].*?<\/w:p>/gs) || []
    const values = []
    for (const para of paragraphs) {
      const tTags = para.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || []
      const paraText = tTags
        .map(t => t.replace(/<w:t[^>]*>/, '').replace(/<\/w:t>/, ''))
        .join('')   // ← NO space: fixes split numbers like "20"+"00.00" = "2000.00"
        .trim()
      if (paraText) values.push(paraText)
    }
    return values
  }

  /** Full readable text of a cell (for headers / particulars). */
  const getCellFullText = (cellXml) =>
    getParaValues(cellXml).join(' ').replace(/\s+/g, ' ').trim()

  const splitParticulars = (text, count) => {
    if (!text || count <= 0) return []
    if (count === 1) return [text.trim()]
    const parts = text.split(/(?<=labour\s+charge)\s*/i).map(s => s.trim()).filter(Boolean)
    if (parts.length === count) return parts
    // Fallback: split evenly
    const chunk = Math.ceil(text.length / count)
    return Array.from({ length: count }, (_, i) => text.slice(i * chunk, (i + 1) * chunk).trim())
  }

  /** Parse single-contractor billing (KE4 format): S.NO | PATICULARS | QTY | RATE | AMOUNT */
  const parseSingleContractor = (rows, titleText) => {
    let headerIdx = -1
    for (let i = 0; i < rows.length; i++) {
      const cells = rows[i].match(/<w:tc[ >].*?<\/w:tc>/gs) || []
      const txt = cells.map(getCellFullText).join(' ').toUpperCase()
      if (txt.includes('S.NO') || txt.includes('PATICULAR')) { headerIdx = i; break }
    }
    if (headerIdx === -1) return null

    const dataRow = rows[headerIdx + 1]
    if (!dataRow) return null
    const cells = dataRow.match(/<w:tc[ >].*?<\/w:tc>/gs) || []

    const snos = getParaValues(cells[0] || '').filter(v => /^\d+$/.test(v.trim())).map(Number)
    const qtys = getParaValues(cells[2] || '')
    const rates = getParaValues(cells[3] || '').map(v => parseFloat(v.replace(/,/g, ''))).filter(n => !isNaN(n))
    const amounts = getParaValues(cells[4] || '').map(v => parseFloat(v.replace(/,/g, ''))).filter(n => !isNaN(n))
    const particulars = splitParticulars(getCellFullText(cells[1] || ''), snos.length)

    return {
      title: titleText,
      details: snos.map((sno, i) => ({
        'S.NO': sno,
        'PATICULARS': particulars[i] ?? '',
        'QTY': qtys[i] ?? '',
        'RATE': rates[i] ?? 0,
        'AMOUNT': amounts[i] ?? 0,
      })),
      total_amount: amounts.reduce((s, v) => s + v, 0),
      panchayat: 'Poondi panchayat', union: 'Poondi  union', officer: "M/S The special officer"
    }
  }

  const parseComparative = (rows, titleText) => {
    const dataRow = rows[2]  // rows 0,1 are two-row header; row 2 is data
    if (!dataRow) return null
    const cells = dataRow.match(/<w:tc[ >].*?<\/w:tc>/gs) || []

    const snos = getParaValues(cells[0] || '').filter(v => /^\d+$/.test(v.trim())).map(Number)
    const qtys = getParaValues(cells[2] || '')
    const rates = getParaValues(cells[3] || '').map(v => parseFloat(v.replace(/,/g, ''))).filter(n => !isNaN(n))
    const amounts = getParaValues(cells[4] || '').map(v => parseFloat(v.replace(/,/g, ''))).filter(n => !isNaN(n))
    const particulars = splitParticulars(getCellFullText(cells[1] || ''), snos.length)

    return {
      title: titleText,
      details: snos.map((sno, i) => ({
        'S.NO': sno,
        'PATICULARS': particulars[i] ?? '',
        'QTY': qtys[i] ?? '',
        'RATE': rates[i] ?? 0,
        'AMOUNT': amounts[i] ?? 0,
      })),
      total_amount: amounts.reduce((s, v) => s + v, 0),
      panchayat: 'Poondi panchayat', union: 'Poondi  union', officer: "M/S The special officer"
    }
  }


  const parseDocxToJSON = async (file) => {
    const zip = await JSZip.loadAsync(file)
    const xmlText = await zip.file('word/document.xml').async('string')
    const beforeTable = xmlText.split(/<w:tbl[ >]/)[0]
    const paras = beforeTable.match(/<w:p[ >].*?<\/w:p>/gs) || []

    console.log(paras)
    let titleText = ''
    for (const para of [...paras].reverse()) {
      const t = getCellFullText(para)
      if (t.length > 5) { titleText = t; break }
    }

    const rows = xmlText.match(/<w:tr[ >].*?<\/w:tr>/gs) || []
    if (!rows.length) return { title: titleText, details: [], total_amount: 0,panchayat: 'Poondi panchayat', union: 'Poondi  union', officer: "M/S The special officer" }

    // Detect format
    let isComparative = false
    for (let i = 0; i < Math.min(3, rows.length); i++) {
      const cells = rows[i].match(/<w:tc[ >].*?<\/w:tc>/gs) || []
      const txt = cells.map(getCellFullText).join(' ').toUpperCase()
      if (txt.includes('RATE QUOTED') || txt.includes('COMPARATIVE')) { isComparative = true; break }
    }

    const result = isComparative
      ? parseComparative(rows, titleText)
      : parseSingleContractor(rows, titleText)

    if (!result) return { title: titleText, details: [], total_amount: 0,panchayat: 'Poondi panchayat', union: 'Poondi  union', officer: "M/S The special officer" }
    console.log('Parsed DOCX:', JSON.stringify(result, null, 2))
    return result
  }


  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      const data = await parseDocxToJSON(file)
      console.log(data,"jhjhjhjhjhj")
      setJsonData(data)
      console.log('Parsed JSON:', data)
    } catch (err) {
      console.error('Parse error:', err)
      alert('Failed to parse DOCX file')
    }
  }

  const handleCellChange = (index, field, value) => {
    setJsonData((prev) => {
      const updatedDetails = [...prev.details];

      // Update the specific field with the new value
      updatedDetails[index] = {
        ...updatedDetails[index],
        [field]: value,
      };

      // Attempt to recalculate AMOUNT
      // We strip non-numeric characters from QTY for the calculation (e.g., "10 nos" -> 10)
      const rawQty = String(updatedDetails[index].QTY).replace(/[^0-9.]/g, '');
      const qty = parseFloat(rawQty) || 0;
      const rate = parseFloat(updatedDetails[index].RATE) || 0;

      // Only update AMOUNT if we have valid numbers
      if (field === 'QTY' || field === 'RATE') {
        updatedDetails[index].AMOUNT = qty * rate;
      }

      // Recalculate the Grand Total
      const newTotal = updatedDetails.reduce((sum, item) => sum + (parseFloat(item.AMOUNT) || 0), 0);

      return {
        ...prev,
        details: updatedDetails,
        total_amount: newTotal,
        
      };
    });
  };

  const handleRemoveProduct = (index) => {
    setJsonData((prev) => {
      const updatedDetails = prev.details.filter((_, i) => i !== index);
      const newTotal = updatedDetails.reduce((sum, item) => sum + (parseFloat(item.AMOUNT) || 0), 0);
      return {
        ...prev,
        details: updatedDetails,
        total_amount: newTotal
      };
    });
  };

  const handleAddProduct = () => {
    const newItem = {
      'S.NO': (jsonData?.details?.length || 0) + 1,
      'PATICULARS': '',
      'QTY': 0,
      'RATE': 0,
      'AMOUNT': 0,
    };

    setJsonData((prev) => ({
      ...prev,
      details: prev ? [...prev.details, newItem] : [newItem],
      // total_amount remains the same since AMOUNT is 0
    }));
  };




  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader><strong>Billing Creation</strong></CCardHeader>
          <CCardBody>
            <CForm className="mb-4">
              <CRow className="mb-3">
                <CCol md={4}>
                  <CFormLabel>Billing Doc</CFormLabel>
                  <input type="file" accept=".docx" onChange={handleFileChange} />
                </CCol>
                <CCol md={4}>
                  <CFormLabel>Billing Description</CFormLabel>
                  <CFormInput
                    value={jsonData.title}
                    onChange={(e) => setJsonData((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter billing title"
                  />
                </CCol>

                <CCol md={4}>
                  <CFormLabel>Panchayat Description</CFormLabel>
                  <CFormInput
                    value={jsonData.panchayat}
                    onChange={(e) => setJsonData((prev) => ({ ...prev, panchayat: e.target.value }))}
                    placeholder="Enter panchayat title"
                  />
                </CCol>

                <CCol md={4}>
                  <CFormLabel>Union Description</CFormLabel>
                  <CFormInput
                    value={jsonData.union}
                    onChange={(e) => setJsonData((prev) => ({ ...prev, union: e.target.value }))}
                    placeholder="Enter union title"
                  />
                </CCol>

                <CCol md={4}>
                  <CFormLabel>Officer Description</CFormLabel>
                  <CFormInput
                    value={jsonData.officer}
                    onChange={(e) => setJsonData((prev) => ({ ...prev, officer: e.target.value }))}
                    placeholder="Enter officer title"
                  />
                </CCol>


               


              </CRow>
            </CForm>

            <hr />


            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="m-0">Product Details</h5>
              <CButton color="success" variant="outline" onClick={handleAddProduct}>
                + Add Item
              </CButton>
            </div>

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
                {jsonData?.details.map((prod, index) => (
                  <CTableRow key={index}>
                    <CTableHeaderCell>{index + 1}</CTableHeaderCell>

                    {/* Particulars */}
                    <CTableDataCell>
                      <CFormInput
                        value={prod.PATICULARS}
                        onChange={(e) => handleCellChange(index, 'PATICULARS', e.target.value)}
                      />
                    </CTableDataCell>

                    {/* QTY - Shows the initial value from DOCX, but allows editing */}
                    <CTableDataCell>
                      <CFormInput
                        value={prod.QTY}
                        onChange={(e) => handleCellChange(index, 'QTY', e.target.value)}
                      />
                    </CTableDataCell>

                    {/* Rate */}
                    <CTableDataCell>
                      <CFormInput
                        type="number"
                        value={prod.RATE}
                        onChange={(e) => handleCellChange(index, 'RATE', e.target.value)}
                      />
                    </CTableDataCell>

                    {/* Amount (Calculated) */}
                    <CTableDataCell>
                      {parseFloat(prod.AMOUNT).toFixed(2)}
                    </CTableDataCell>

                    <CTableDataCell>
                      <CButton color="danger" size="sm" onClick={() => handleRemoveProduct(index)}>
                        Remove
                      </CButton>
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
              {/* Add this Footer section */}
              {jsonData?.details?.length > 0 && (
                <tfoot>
                  <CTableRow>
                    <CTableDataCell colSpan="4" className="text-end">
                      <strong>Grand Total:</strong>
                    </CTableDataCell>
                    <CTableDataCell colSpan="2">
                      <strong style={{ fontSize: '1.1rem', color: '#2eb85c' }}>
                        {/* Format to 2 decimal places with commas */}
                        {Number(jsonData.total_amount || 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </strong>
                    </CTableDataCell>
                  </CTableRow>
                </tfoot>
              )}
            </CTable>
          </CCardBody>
        </CCard>
      </CCol>

      <CRow className="mt-4">
        <CCol className="d-flex justify-content-end">
          <CButton color="primary" onClick={handleSubmit} style={{ margin: '10px' }}>Create Billing</CButton>
        </CCol>
      </CRow>
    </CRow>
  )
}

export default BillingCreation