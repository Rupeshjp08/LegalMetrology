// ============================================================================
// Member 5 - jsPDF generation for the Packaged Commodities Compliance Report
// Builds an official-looking government compliance PDF from report data.
// ============================================================================

import { jsPDF } from 'jspdf'

const NAVY = [15, 36, 64]
const FONT_SIZE_BODY = 10
const FONT_SIZE_SMALL = 8.5

function drawGovHeader(doc) {
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setFillColor(...NAVY)
  doc.rect(0, 0, pageWidth, 38, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text(
    'Ministry of Consumer Affairs, Food & Public Distribution',
    pageWidth / 2,
    16,
    { align: 'center' }
  )

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text('Government of India', pageWidth / 2, 24, { align: 'center' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Packaged Commodities Compliance System', pageWidth / 2, 32, {
    align: 'center',
  })
}

function drawSectionTitle(doc, title, y) {
  doc.setFillColor(...NAVY)
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.roundedRect(20, y - 5, 5, 12, 1, 1, 'F')
  doc.text(title, 28, y)
  return y + 12
}

function drawLabelValue(doc, label, value, x, y, colWidth) {
  doc.setTextColor(80, 80, 80)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(FONT_SIZE_SMALL)
  doc.text(label, x, y - 2)

  doc.setTextColor(20, 20, 20)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(FONT_SIZE_BODY)
  doc.text(value, x, y + 4, { maxWidth: colWidth })
}

function addWrappedLines(doc, items, startY, pageHeight, lineSpacing) {
  let y = startY
  const marginX = 28
  const maxWidth = doc.internal.pageSize.getWidth() - 56

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(FONT_SIZE_BODY)
  doc.setTextColor(40, 40, 40)

  items.forEach((item) => {
    const lines = doc.splitTextToSize(item, maxWidth)

    if (y + lines.length * lineSpacing + 6 > pageHeight - 20) {
      doc.addPage()
      drawGovHeader(doc)
      y = 50
    }

    doc.circle(marginX, y - 1.5, 1.2, 'F')
    doc.text(lines, marginX + 5, y)
    y += lines.length * lineSpacing + 3
  })

  return y
}

export function generateReportPdf(report, options = {}) {
  const { onDownload = true } = options
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  drawGovHeader(doc)

  // ---- Report Information ----
  let y = 62
  doc.setFillColor(240, 242, 245)
  doc.roundedRect(20, 50, pageWidth - 40, 52, 6, 6, 'F')

  doc.setDrawColor(200, 200, 205)
  doc.setLineWidth(0.5)
  doc.line(20, 50, 20, 102)
  doc.line(pageWidth - 20, 50, pageWidth - 20, 102)

  drawLabelValue(doc, 'Report ID', report.reportId, 30, 60, 150)
  drawLabelValue(doc, 'Scan Date & Time', report.scanDate, 230, 60, 180)
  drawLabelValue(doc, 'Officer / User', report.officer, 30, 84, 220)

  y = 120
  doc.setTextColor(90, 90, 90)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('PACKAGED COMMODITIES COMPLIANCE REPORT', pageWidth / 2, y, {
    align: 'center',
  })
  y += 22

  // ---- Product Information ----
  y = drawSectionTitle(doc, '1. Product Information', y)
  doc.setDrawColor(200, 200, 205)
  doc.line(20, y, pageWidth - 20, y)

  drawLabelValue(doc, 'Product Name', report.product.name, 30, y + 12, 200)
  drawLabelValue(doc, 'Brand', report.product.brand, 30, y + 34, 120)
  drawLabelValue(doc, 'Net Quantity', report.product.netQuantity, 200, y + 34, 120)
  drawLabelValue(doc, 'MRP', report.product.mrp, 340, y + 34, 100)
  drawLabelValue(doc, 'Country of Origin', report.product.countryOfOrigin, 30, y + 56, 200)

  y += 78

  // ---- Compliance Result ----
  y = drawSectionTitle(doc, '2. Compliance Result', y)
  doc.setDrawColor(200, 200, 205)
  doc.line(20, y, pageWidth - 20, y)

  const statusMap = {
    'Compliant': [16, 163, 71],
    'Minor Issue': [227, 163, 37],
    'Major Violation': [191, 30, 30],
    'Pending': [30, 78, 216],
  }
  const statusColor = statusMap[report.compliance.status] || statusMap.Pending

  doc.setTextColor(90, 90, 90)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(FONT_SIZE_SMALL)
  doc.text('Compliance Score', 30, y + 12)

  doc.setTextColor(20, 20, 20)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(26)
  doc.text(`${report.compliance.score}%`, 30, y + 34)

  doc.setFontSize(FONT_SIZE_BODY)
  doc.setTextColor(90, 90, 90)
  doc.text('Compliance Status', 200, y + 12)

  doc.setFillColor(...statusColor)
  doc.roundedRect(200, y + 16, 130, 24, 12, 12, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(report.compliance.status, 265, y + 32, { align: 'center' })

  y += 52

  // ---- Violations ----
  y = drawSectionTitle(doc, '3. Violations / Issues', y)

  if (report.compliance.violations && report.compliance.violations.length) {
    y = addWrappedLines(doc, report.compliance.violations, y, pageHeight, 14)
  } else {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(FONT_SIZE_BODY)
    doc.setTextColor(16, 163, 71)
    doc.text('No violations detected.', 28, y + 4)
    y += 14
  }

  y += 6

  // ---- Findings / Recommendations ----
  y = drawSectionTitle(doc, '4. Findings / Recommendations', y)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(FONT_SIZE_BODY + 0.5)
  doc.setTextColor(20, 20, 20)
  doc.text('Findings', 28, y + 2)
  y += 14

  if (report.compliance.findings && report.compliance.findings.length) {
    y = addWrappedLines(doc, report.compliance.findings, y, pageHeight, 13)
  } else {
    y += 10
  }

  y += 8
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(FONT_SIZE_BODY + 0.5)
  doc.setTextColor(20, 20, 20)
  doc.text('Recommendations', 28, y + 2)
  y += 14

  if (report.compliance.recommendations && report.compliance.recommendations.length) {
    y = addWrappedLines(doc, report.compliance.recommendations, y, pageHeight, 13)
  } else {
    y += 10
  }

  // ---- Footer ----
  const footerY = pageHeight - 40
  doc.setDrawColor(200, 200, 205)
  doc.setLineWidth(0.5)
  doc.line(20, footerY - 8, pageWidth - 20, footerY - 8)

  doc.setTextColor(120, 120, 120)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(FONT_SIZE_SMALL)
  doc.text(
    'Legal Metrology (Packaged Commodities) Rules, 2011',
    pageWidth / 2,
    footerY,
    { align: 'center' }
  )

  const now = new Date()
  const generatedAt = now.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  doc.text(
    `Report generated on ${generatedAt}`,
    pageWidth / 2,
    footerY + 14,
    { align: 'center' }
  )

  const fileName = `Compliance_Report_${report.reportId}.pdf`

  if (onDownload) {
    doc.save(fileName)
  }

  return doc.output('datauristring')
}

export function getReportFileName(report) {
  return `Compliance_Report_${report.reportId}.pdf`
}