import { Download, Printer, Eye } from 'lucide-react'
import AdminLayout from '../admin/components/AdminLayout'
import StatusBadge from '../admin/components/StatusBadge'
import { getReport } from './reportService'
import { generateReportPdf } from './components/generateReportPdf'
import '../admin/adminDashboard.css'
import './reports.css'

function ReportSection({ title, children }) {
  return (
    <section className="report-doc__section">
      <h3 className="report-doc__section-title">{title}</h3>
      <div className="report-doc__section-body">{children}</div>
    </section>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="report-doc__row">
      <span className="report-doc__label">{label}</span>
      <span className="report-doc__value">{value}</span>
    </div>
  )
}

function ListItems({ items, emptyText }) {
  if (!items || items.length === 0) {
    return (
      <p className="report-doc__empty">{emptyText || 'None reported.'}</p>
    )
  }
  return (
    <ul className="report-doc__list">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  )
}

function PDFReport() {
  const report = getReport()
  const { product, compliance } = report

  const handleDownload = () => {
    generateReportPdf(report, { onDownload: true })
  }

  const handleView = () => {
    const dataUri = generateReportPdf(report, { onDownload: false })
    window.open(dataUri, '_blank')
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <AdminLayout>
      <div className="admin-page report-page">
        <div className="admin-page__header">
          <div>
            <h1 className="admin-page__heading">Compliance Report</h1>
            <p className="admin-page__subheading">
              Generated PDF report for the selected product scan
            </p>
          </div>
          <div className="report-page__actions">
            <button
              type="button"
              className="report-page__btn"
              onClick={handleView}
            >
              <Eye size={16} aria-hidden="true" />
              View Report
            </button>
            <button
              type="button"
              className="report-page__btn report-page__btn--primary"
              onClick={handleDownload}
            >
              <Download size={16} aria-hidden="true" />
              Download PDF
            </button>
            <button
              type="button"
              className="report-page__btn"
              onClick={handlePrint}
            >
              <Printer size={16} aria-hidden="true" />
              Print Report
            </button>
          </div>
        </div>

        <div className="report-doc__scroll">
          <article className="report-doc">
            <header className="report-doc__header">
              <div className="report-doc__gov">
                <div className="report-doc__gov-seal" aria-hidden="true">
                  <ShieldMark />
                </div>
                <div>
                  <h2 className="report-doc__ministry">
                    Ministry of Consumer Affairs, Food &amp; Public Distribution
                  </h2>
                  <p className="report-doc__govt">Government of India</p>
                  <p className="report-doc__system">
                    Packaged Commodities Compliance System
                  </p>
                </div>
              </div>
              <p className="report-doc__title">
                Packaged Commodities Compliance Report
              </p>
              <p className="report-doc__legal">
                Legal Metrology (Packaged Commodities) Rules, 2011
              </p>
            </header>

            <ReportSection title="Report Information">
              <div className="report-doc__grid">
                <InfoRow label="Report ID" value={report.reportId} />
                <InfoRow label="Scan Date & Time" value={report.scanDate} />
                <InfoRow label="Officer / User" value={report.officer} />
              </div>
            </ReportSection>

            <ReportSection title="Product Information">
              <div className="report-doc__grid">
                <InfoRow label="Product Name" value={product.name} />
                <InfoRow label="Brand" value={product.brand} />
                <InfoRow label="Net Quantity" value={product.netQuantity} />
                <InfoRow label="MRP" value={product.mrp} />
                <InfoRow
                  label="Country of Origin"
                  value={product.countryOfOrigin}
                />
              </div>
            </ReportSection>

            <ReportSection title="Compliance Result">
              <div className="report-doc__result">
                <div className="report-doc__score">
                  <span className="report-doc__score-label">
                    Compliance Score
                  </span>
                  <span className="report-doc__score-value">
                    {compliance.score}
                    <span>%</span>
                  </span>
                </div>
                <div className="report-doc__status">
                  <span className="report-doc__status-label">
                    Compliance Status
                  </span>
                  <StatusBadge status={compliance.status} />
                </div>
              </div>
            </ReportSection>

            <ReportSection title="Violations / Issues">
              <ListItems
                items={compliance.violations}
                emptyText="No violations detected."
              />
            </ReportSection>

            <ReportSection title="Findings / Recommendations">
              <h4 className="report-doc__subheading">Findings</h4>
              <ListItems items={compliance.findings} />

              <h4 className="report-doc__subheading">Recommendations</h4>
              <ListItems items={compliance.recommendations} />
            </ReportSection>

            <footer className="report-doc__footer">
              <p>Legal Metrology (Packaged Commodities) Rules, 2011</p>
              <p>
                Report generated on{' '}
                {new Date().toLocaleString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </footer>
          </article>
        </div>
      </div>
    </AdminLayout>
  )
}

function ShieldMark() {
  return (
    <svg
      width="42"
      height="42"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

export default PDFReport