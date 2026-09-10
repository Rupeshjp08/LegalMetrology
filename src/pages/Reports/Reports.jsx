import { useEffect, useState } from 'react'
import Card from '../../components/ui/Card/Card'
import Table from '../../components/ui/Table/Table'
import StatusBadge from '../../components/ui/StatusBadge/StatusBadge'
import PageHeader from '../../components/ui/PageHeader/PageHeader'
import Button from '../../components/ui/Button/Button'
import Modal from '../../components/ui/Modal/Modal'
import {
  subscribe,
  getVersion,
} from '../../modules/admin/services/scanHistoryStore'
import { buildReport, getReportList } from '../../modules/admin/services/reportService'
import { generateInspectionPdf } from '../../modules/admin/services/pdfGenerator'
import '../../modules/admin/admin.css'

function openPdfInNewTab(dataUri) {
  const byteString = window.atob(dataUri.split(',')[1])
  const bytes = new Uint8Array(byteString.length)
  for (let i = 0; i < byteString.length; i += 1) {
    bytes[i] = byteString.charCodeAt(i)
  }
  const blob = new Blob([bytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const win = window.open(url, '_blank', 'noopener')
  if (!win) {
    URL.revokeObjectURL(url)
    return false
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 60000)
  return true
}

function PreviewBody({ report }) {
  if (!report) return null

  const counts = report.summaryCounts || {}
  const verdict = report.statutoryVerdict || {}
  const countsList = [
    { label: 'Verified', value: counts.verified || 0 },
    { label: 'Warnings', value: counts.warnings || 0 },
    { label: 'Verification Required', value: counts.verificationRequired || 0 },
    { label: 'Potential Non-Compliance', value: counts.potentialNonCompliance || 0 },
  ]

  return (
    <div className="m5-report-preview">
      <div className="m5-kv">
        <div className="m5-kv__item">
          <span className="m5-kv__label">Report ID</span>
          <span className="m5-kv__value">{report.reportId}</span>
        </div>
        <div className="m5-kv__item">
          <span className="m5-kv__label">Product</span>
          <span className="m5-kv__value">{report.productName}</span>
        </div>
        <div className="m5-kv__item">
          <span className="m5-kv__label">Category</span>
          <span className="m5-kv__value">{report.category}</span>
        </div>
        <div className="m5-kv__item">
          <span className="m5-kv__label">Scan Date</span>
          <span className="m5-kv__value">{report.scanDate}</span>
        </div>
        <div className="m5-kv__item">
          <span className="m5-kv__label">Compliance Score</span>
          <span className="m5-kv__value">{report.complianceScore}%</span>
        </div>
        <div className="m5-kv__item">
          <span className="m5-kv__label">Status</span>
          <span className="m5-kv__value">
            <StatusBadge status={report.status} />
          </span>
        </div>
      </div>

      <h3 className="m5-section-title">Summary Counts</h3>
      <div className="m5-kv">
        {countsList.map((item) => (
          <div key={item.label} className="m5-kv__item">
            <span className="m5-kv__label">{item.label}</span>
            <span className="m5-kv__value">{item.value}</span>
          </div>
        ))}
      </div>

      <h3 className="m5-section-title">Statutory Verdict</h3>
      <p className="m5-detail-note">
        {verdict.overallStatus || '—'} ·{' '}
        {report.isCompliant
          ? 'Compliant with applicable declarations'
          : `Action required: ${report.actionRequired || 'OFFICER_REVIEW'}`}
      </p>

      <h3 className="m5-section-title">Violations</h3>
      {report.violations.length ? (
        <ul className="m5-list">
          {report.violations.map((violation, index) => (
            <li key={index}>
              <strong>{violation.rule}</strong>
              {violation.statutoryClause ? ` [${violation.statutoryClause}]` : ''} —{' '}
              {violation.legalGrounds || 'No legal grounds recorded'}
            </li>
          ))}
        </ul>
      ) : (
        <ul className="m5-list">
          <li>No violations detected.</li>
        </ul>
      )}
    </div>
  )
}

export default function Reports() {
  const [, setVersionState] = useState(() => getVersion())
  const [selectedReport, setSelectedReport] = useState(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [downloading, setDownloading] = useState('')

  useEffect(() => subscribe(() => setVersionState(getVersion())), [])

  const reports = getReportList()

  const handleDownload = (record) => {
    const report = buildReport(record)
    if (!report) return
    setDownloading(record.id)
    window.setTimeout(() => {
      generateInspectionPdf(report)
      setDownloading('')
    }, 50)
  }

  const handleOpenPdf = (record) => {
    const report = buildReport(record)
    if (!report) return
    const dataUri = generateInspectionPdf(report, { onDownload: false })
    openPdfInNewTab(dataUri)
  }

  const handlePreview = (record) => {
    const report = buildReport(record)
    setSelectedReport(report)
    setPreviewOpen(true)
  }

  const columns = [
    {
      key: 'id',
      header: 'Report ID',
      render: (row) => <span className="m5-report-id">{row.id}</span>,
    },
    { key: 'productName', header: 'Product' },
    { key: 'category', header: 'Category' },
    { key: 'scanDateTime', header: 'Scanned' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="m5-row-actions">
          <Button
            variant="outline"
            size="sm"
            icon="eye"
            onClick={() => handlePreview(row)}
          >
            Preview
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon="download"
            loading={downloading === row.id}
            disabled={Boolean(downloading)}
            onClick={() => handleDownload(row)}
          >
            Download
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon="printer"
            onClick={() => handleOpenPdf(row)}
          >
            Print
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="m5-page">
      <PageHeader
        overline="PCLMCS · Officer Workspace"
        title="PDF Compliance Reports"
        description="Generate and download official compliance inspection reports in PDF format."
      />

      <Card
        title="Inspection Reports"
        subtitle="Reports available for download"
      >
        <Table
          columns={columns}
          rows={reports}
          emptyMessage="No compliance inspections are available for reporting yet. Run and save a scan from the Compliance module first."
          caption="All inspections saved to the compliance system"
        />
      </Card>

      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Report Preview"
        size="lg"
        footer={
          <div className="m5-detail-actions">
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Close
            </Button>
          </div>
        }
      >
        {selectedReport ? (
          <>
            <PreviewBody report={selectedReport} />
            <div className="m5-detail-actions">
              <Button
                variant="primary"
                icon="download"
                onClick={() => {
                  generateInspectionPdf(selectedReport)
                  setPreviewOpen(false)
                }}
              >
                Download PDF
              </Button>
              <Button
                variant="outline"
                icon="printer"
                onClick={() => openPdfInNewTab(generateInspectionPdf(selectedReport, { onDownload: false }))}
              >
                Print
              </Button>
            </div>
          </>
        ) : (
          <p className="m5-hint">No report selected.</p>
        )}
      </Modal>
    </div>
  )
}