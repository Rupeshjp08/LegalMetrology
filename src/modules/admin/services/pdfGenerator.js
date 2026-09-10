import { jsPDF } from 'jspdf'

const NAVY = [0, 51, 102]
const FONT_SIZE_BODY = 10
const FONT_SIZE_SMALL = 8.5

const STATUS_TITLES = {
  compliant: 'Compliant',
  'non-compliant': 'Non-Compliant',
  pending: 'Pending Review',
  warning: 'Warning',
}

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
    { align: 'center' },
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

export function generateInspectionPdf(report, options = {}) {
  const { onDownload = true } = options
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const statusTitle = STATUS_TITLES[report.status] || String(report.status || '')

  drawGovHeader(doc)

  let y = 62
  doc.setFillColor(240, 242, 245)
  doc.roundedRect(20, 50, pageWidth - 40, 52, 6, 6, 'F')
  doc.setDrawColor(200, 200, 205)
  doc.setLineWidth(0.5)
  doc.line(20, 50, 20, 102)
  doc.line(pageWidth - 20, 50, pageWidth - 20, 102)

  drawLabelValue(doc, 'Report ID', report.reportId, 30, 60, 150)
  drawLabelValue(doc, 'Scan Date & Time', report.scanDate, 230, 60, 180)
  drawLabelValue(doc, 'Product Category', report.category, 30, 84, 220)

  y = 120
  doc.setTextColor(90, 90, 90)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('PACKAGED COMMODITIES COMPLIANCE REPORT', pageWidth / 2, y, {
    align: 'center',
  })
  y += 22

  y = drawSectionTitle(doc, '1. Product Information', y)
  doc.setDrawColor(200, 200, 205)
  doc.line(20, y, pageWidth - 20, y)

  drawLabelValue(doc, 'Product Name', report.productName, 30, y + 12, 260)

  y += 40

  y = drawSectionTitle(doc, '2. Compliance Result', y)
  doc.setDrawColor(200, 200, 205)
  doc.line(20, y, pageWidth - 20, y)

  const statusColor =
    report.status === 'non-compliant'
      ? [191, 30, 30]
      : report.status === 'warning'
        ? [227, 163, 37]
        : report.status === 'pending'
          ? [30, 78, 216]
          : [16, 163, 71]

  doc.setTextColor(90, 90, 90)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(FONT_SIZE_SMALL)
  doc.text('Compliance Score', 30, y + 12)
  doc.setTextColor(20, 20, 20)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(26)
  doc.text(`${report.complianceScore || 0}%`, 30, y + 34)

  doc.setFontSize(FONT_SIZE_BODY)
  doc.setTextColor(90, 90, 90)
  doc.text('Compliance Status', 200, y + 12)

  doc.setFillColor(...statusColor)
  doc.roundedRect(200, y + 16, 130, 24, 12, 12, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(statusTitle, 265, y + 32, { align: 'center' })

  doc.setTextColor(40, 40, 40)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(FONT_SIZE_SMALL)
  doc.text(
    `Statutory verdict: ${report.overallStatus || '—'}`,
    30,
    y + 44,
    { maxWidth: 260 },
  )

  const counts = report.summaryCounts || {}
  const countsText = [
    `Verified: ${counts.verified || 0}`,
    `Warnings: ${counts.warnings || 0}`,
    `Verification Required: ${counts.verificationRequired || 0}`,
    `Potential Non-Compliance: ${counts.potentialNonCompliance || 0}`,
  ].join('  |  ')
  doc.setTextColor(120, 120, 120)
  doc.text(countsText, 30, y + 56, { maxWidth: pageWidth - 60 })

  y += 68

  y = drawSectionTitle(doc, '3. Violations / Issues', y)

  if (report.violations && report.violations.length) {
    const lines = report.violations.map(
      (violation) =>
        `${violation.rule || 'Rule violation'} — ${violation.legalGrounds || ''}` +
        (violation.statutoryClause ? ` [${violation.statutoryClause}]` : '') +
        (violation.actSection ? ` (${violation.actSection})` : ''),
    )
    y = addWrappedLines(doc, lines, y, pageHeight, 14)
  } else {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(FONT_SIZE_BODY)
    doc.setTextColor(16, 163, 71)
    doc.text('No violations detected.', 28, y + 4)
    y += 14
  }

  y += 6

  y = drawSectionTitle(doc, '4. Statutory Verdict / Action', y)

  const verdictLines = []
  if (report.isCompliant) {
    verdictLines.push('The packaged commodity is compliant with the applicable declarations under the Legal Metrology (Packaged Commodities) Rules, 2011.')
  } else {
    verdictLines.push(`Action required: ${report.actionRequired || 'OFFICER_REVIEW_REQUIRED'}.`)
    if (report.compoundableUnderSection49) {
      verdictLines.push(
        `The reported violations are compoundable under ${report.compoundingSectionReference}.`,
      )
    }
  }

  y = addWrappedLines(doc, verdictLines, y, pageHeight, 13)

  if (report.summaryCounts || report.officerAuditTrail) {
    y += 8
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(FONT_SIZE_BODY + 0.5)
    doc.setTextColor(20, 20, 20)
    doc.text('Findings', 28, y + 2)
    y += 14

    const findings = []
    if (report.violations && report.violations.length) {
      report.violations.forEach((violation) => {
        if (violation.statutoryClause) findings.push(violation.statutoryClause)
        if (violation.capturedEvidence) {
          findings.push(`Captured evidence: ${violation.capturedEvidence}`)
        }
      })
    }
    if (!findings.length) findings.push('No statutory findings were flagged for this inspection.')

    y = addWrappedLines(doc, findings, y, pageHeight, 13)

    y += 8
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(FONT_SIZE_BODY + 0.5)
    doc.setTextColor(20, 20, 20)
    doc.text('Officer Audit Trail', 28, y + 2)
    y += 14

    if (report.officerAuditTrail && report.officerAuditTrail.length) {
      const trail = report.officerAuditTrail.map(
        (item) => `${item.ruleId || 'Rule'} → ${item.finalStatus || ''}: ${item.officerNotes || ''}`,
      )
      y = addWrappedLines(doc, trail, y, pageHeight, 13)
    } else {
      y += 12
    }
  }

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
    { align: 'center' },
  )

  doc.text(
    `Report generated on ${new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })}`,
    pageWidth / 2,
    footerY + 14,
    { align: 'center' },
  )

  if (onDownload) {
    doc.save(`Compliance_Report_${report.reportId}.pdf`)
  }

  return doc.output('datauristring')
}

export function getReportFileName(report) {
  return `Compliance_Report_${report.reportId}.pdf`
}