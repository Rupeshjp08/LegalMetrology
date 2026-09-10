// src/pages/Reports/Reports.jsx
import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Card from '../../components/ui/Card/Card'
import Button from '../../components/ui/Button/Button'
import StatusBadge from '../../components/ui/StatusBadge/StatusBadge'
import PageHeader from '../../components/ui/PageHeader/PageHeader'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'
import NoticeGenerator from '../Notices/NoticeGenerator'
import { ROUTES } from '../../constants'
import './Reports.css'

const MOCK_REPORT = {
  inspectionId: 'INS-2026-0042',
  inspectionDate: new Date().toISOString(),
  officerName: 'Inspection Officer (Legal Metrology)',
  commodity: {
    barcode: '8901234567890',
    productName: 'Standard Packaged Biscuits 250g',
    category: 'Food & Beverages',
    manufacturer: 'Sunrise Bakeries Ltd, Plot 42, Peenya, Bengaluru',
    mrp: '₹40.00 (inclusive of all taxes)',
    netQuantity: '250 g',
  },
  summary: {
    totalRules: 7,
    verifiedCount: 5,
    verificationRequiredCount: 1,
    warningCount: 0,
    nonComplianceCount: 1,
    overallVerdict: 'NON_COMPLIANT',
    statutoryCitation: 'Liable for action under Section 36(1) of Legal Metrology Act, 2009',
  },
  rules: [
    {
      ruleId: 'LM-R6-03-MANUFACTURER',
      ruleName: 'Name & Address of Manufacturer / Packer',
      legalReference: 'Rule 6(1)(a) Legal Metrology (Packaged Commodities) Rules, 2011',
      penalSection: 'Section 36(1), Legal Metrology Act, 2009',
      statutoryDirective: 'Complete commercial name and operational premises address must be clearly legible.',
      status: 'VERIFIED',
      message: 'Manufacturer name and registered factory address are clearly printed.',
      extractedValue: 'Sunrise Bakeries Ltd, Plot 42, Peenya, Bengaluru',
    },
    {
      ruleId: 'LM-R6-05-ORIGIN',
      ruleName: 'Country of Origin',
      legalReference: 'Rule 6(10) Legal Metrology (Packaged Commodities) Rules, 2011',
      penalSection: 'Section 36(1), Legal Metrology Act, 2009',
      statutoryDirective: 'Country of origin must be stated explicitly.',
      status: 'VERIFIED',
      message: 'Country of origin is declared as India on principal display panel.',
      extractedValue: 'Made in India',
    },
    {
      ruleId: 'LM-R6-02-NET-QTY',
      ruleName: 'Net Quantity Declaration',
      legalReference: 'Rule 6(1)(b) & Second Schedule',
      penalSection: 'Section 36(1) & Section 39, Legal Metrology Act, 2009',
      statutoryDirective: 'Net quantity must be declared using standard metric units.',
      status: 'VERIFIED',
      message: 'Net quantity standard unit (g) is valid and clear.',
      extractedValue: '250 g',
    },
    {
      ruleId: 'LM-R6-01-MRP',
      ruleName: 'Maximum Retail Price (MRP) & Tax Statement',
      legalReference: 'Rule 6(1)(e) Legal Metrology (Packaged Commodities) Rules, 2011',
      penalSection: 'Section 36(1), Legal Metrology Act, 2009',
      statutoryDirective: 'MRP must be stated explicitly inclusive of all taxes.',
      status: 'VERIFIED',
      message: 'MRP formatted with inclusive of all taxes statement.',
      extractedValue: 'MRP ₹40.00 (inclusive of all taxes)',
    },
    {
      ruleId: 'LM-R6-07-USP',
      ruleName: 'Unit Sale Price (USP)',
      legalReference: 'Rule 6(1)(h) Legal Metrology (Packaged Commodities) Rules, 2011',
      penalSection: 'Section 36(1), Legal Metrology Act, 2009',
      statutoryDirective: 'Price per unit measurement mandatory for > 1kg/1L.',
      status: 'VERIFICATION_REQUIRED',
      message: 'Unit sale price declaration requires officer manual review.',
      extractedValue: '₹0.16 per g',
    },
    {
      ruleId: 'LM-R6-04-CONSUMER-CARE',
      ruleName: 'Consumer Care Cell Details',
      legalReference: 'Rule 6(2) Consumer Grievance Contact',
      penalSection: 'Section 36(1), Legal Metrology Act, 2009',
      statutoryDirective: 'Mandatory contact details of consumer grievance cell.',
      status: 'POTENTIAL_NON_COMPLIANCE',
      message: 'Missing toll-free helpline number or email address on package label.',
      extractedValue: null,
      officerNote: 'Missing mandatory toll-free consumer care details on side panel.',
    },
  ],
  officerNotes: 'Package physically examined. Missing mandatory toll-free consumer care details on side panel.',
}

function resolveReportData(locationState) {
  if (locationState?.report) {
    return locationState.report
  }
  try {
    const sessionSaved = sessionStorage.getItem('pclmcs.latest_report')
    if (sessionSaved) {
      return JSON.parse(sessionSaved)
    }
  } catch (err) {
    console.warn('Could not parse sessionStorage report data:', err)
  }
  return MOCK_REPORT
}

function getVerdictProps(verdict) {
  switch (verdict) {
    case 'NON_COMPLIANT':
    case 'POTENTIAL_NON_COMPLIANCE':
      return {
        tone: 'danger',
        label: 'NON-COMPLIANT',
        bannerClass: 'reports-verdict-banner--non_compliant',
        bannerTitle: 'VIOLATION DETECTED — ACTION RECOMMENDED',
        bannerSubtitle: 'Liable for statutory action under Section 36(1) of Legal Metrology Act, 2009.',
      }
    case 'PENDING_VERIFICATION':
    case 'VERIFICATION_REQUIRED':
    case 'PENDING':
      return {
        tone: 'warning',
        label: 'PENDING VERIFICATION',
        bannerClass: 'reports-verdict-banner--pending_verification',
        bannerTitle: 'VERIFICATION INCOMPLETE',
        bannerSubtitle: 'Certain statutory declaration checks require physical package examination.',
      }
    case 'COMPLIANT':
    case 'VERIFIED':
    default:
      return {
        tone: 'success',
        label: 'STATUTORILY COMPLIANT',
        bannerClass: 'reports-verdict-banner--compliant',
        bannerTitle: 'STATUTORILY COMPLIANT',
        bannerSubtitle: 'All mandatory Legal Metrology Rule 6 packaging declarations passed inspection.',
      }
  }
}

function getDeclarationBadge(status) {
  switch (status) {
    case 'VERIFIED':
    case 'COMPLIANT':
      return <StatusBadge tone="success" label="Pass" />
    case 'WARNING':
    case 'VERIFICATION_REQUIRED':
    case 'PENDING':
      return <StatusBadge tone="warning" label="Pending" />
    case 'POTENTIAL_NON_COMPLIANCE':
    case 'NON_COMPLIANT':
    case 'REJECTED':
      return <StatusBadge tone="danger" label="Fail" />
    default:
      return <StatusBadge tone="neutral" label={status} />
  }
}

export default function Reports() {
  const location = useLocation()
  const navigate = useNavigate()

  const [reportData] = useState(() => resolveReportData(location.state))
  const [showNoticeModal, setShowNoticeModal] = useState(false)

  const inspectionId = reportData.inspectionId || reportData.id || 'INS-N/A'
  const inspectionDate = reportData.inspectionDate || reportData.timestamp
  const officerName = reportData.officerName || 'Inspection Officer (Legal Metrology)'
  const commodityName = reportData.commodity?.productName || reportData.commodity?.name || 'Inspected Commodity'
  const barcode = reportData.commodity?.barcode || 'N/A'
  const category = reportData.commodity?.category || 'General Commodity'
  const manufacturer = reportData.commodity?.manufacturer || 'N/A'
  const mrp = reportData.commodity?.mrp || 'N/A'
  const netQuantity = reportData.commodity?.netQuantity || 'N/A'

  const overallVerdict =
    reportData.summary?.overallVerdict ||
    reportData.results?.verdict ||
    'COMPLIANT'

  const verdictInfo = getVerdictProps(overallVerdict)

  const verifiedCount = reportData.summary?.verifiedCount ?? reportData.results?.verifiedCount ?? 0
  const verificationRequiredCount = reportData.summary?.verificationRequiredCount ?? reportData.results?.verificationRequiredCount ?? 0
  const warningCount = reportData.summary?.warningCount ?? reportData.results?.warningCount ?? 0
  const nonComplianceCount = reportData.summary?.nonComplianceCount ?? reportData.results?.nonComplianceCount ?? 0
  const totalRules = reportData.summary?.totalRules ?? reportData.results?.totalRules ?? 7

  const rulesList = reportData.rules || reportData.declarations || []

  const handlePrint = () => {
    window.print()
  }

  const handleOpenNotice = () => {
    setShowNoticeModal(true)
  }

  const handleScanAnother = () => {
    navigate(ROUTES.SCAN || '/scan')
  }

  const formattedDate = inspectionDate
    ? new Date(inspectionDate).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : new Date().toLocaleString()

  const isNonCompliant =
    overallVerdict === 'NON_COMPLIANT' ||
    nonComplianceCount > 0

  return (
    <div className="reports-container">
      <div className="no-print">
        <Breadcrumb
          items={[
            { to: ROUTES.DASHBOARD, label: 'Dashboard' },
            { to: ROUTES.COMPLIANCE, label: 'Compliance' },
            { label: 'Inspection Report' },
          ]}
        />
      </div>

      <div className="reports-header">
        <PageHeader
          overline="Government of India · Department of Consumer Affairs · Legal Metrology Wing"
          title={`Official Product Inspection Verification Report: ${inspectionId}`}
          subtitle={`Generated on ${formattedDate} | Legal Metrology Enforcement Portal`}
        />

        <div className="reports-header__actions no-print">
          <Button variant="outline" icon="upload" onClick={handleScanAnother}>
            New Inspection
          </Button>
          <Button variant="secondary" icon="printer" onClick={handlePrint}>
            Print / Download PDF Certificate
          </Button>
          {isNonCompliant && (
            <Button variant="danger" icon="alertTriangle" onClick={handleOpenNotice}>
              Issue Statutory Notice under Sec. 36(1)
            </Button>
          )}
        </div>
      </div>

      {/* Official Verdict Banner */}
      <div className={`reports-verdict-banner ${verdictInfo.bannerClass}`}>
        <div>
          <h2 className="reports-verdict-banner__title">{verdictInfo.bannerTitle}</h2>
          <p className="reports-verdict-banner__subtitle">{verdictInfo.bannerSubtitle}</p>
        </div>
        <StatusBadge tone={verdictInfo.tone} label={verdictInfo.label} />
      </div>

      {/* Grid: Commodity Details & Key Summary Metrics */}
      <div className="reports-grid">
        <Card title="Commodity & Inspection Metadata">
          <div className="reports-details-list">
            <div className="reports-details-item">
              <span className="reports-details-item__label">Inspection ID</span>
              <span className="reports-details-item__value">{inspectionId}</span>
            </div>
            <div className="reports-details-item">
              <span className="reports-details-item__label">Inspection Date</span>
              <span className="reports-details-item__value">{formattedDate}</span>
            </div>
            <div className="reports-details-item">
              <span className="reports-details-item__label">Enforcement Officer</span>
              <span className="reports-details-item__value">{officerName}</span>
            </div>
            <div className="reports-details-item">
              <span className="reports-details-item__label">Commodity Name</span>
              <span className="reports-details-item__value">{commodityName}</span>
            </div>
            <div className="reports-details-item">
              <span className="reports-details-item__label">Barcode / GTIN</span>
              <span className="reports-details-item__value">{barcode}</span>
            </div>
            <div className="reports-details-item">
              <span className="reports-details-item__label">Statutory Category</span>
              <span className="reports-details-item__value">{category}</span>
            </div>
            <div className="reports-details-item">
              <span className="reports-details-item__label">Manufacturer / Packer</span>
              <span className="reports-details-item__value">{manufacturer}</span>
            </div>
            <div className="reports-details-item">
              <span className="reports-details-item__label">Declared Net Quantity</span>
              <span className="reports-details-item__value">{netQuantity}</span>
            </div>
            <div className="reports-details-item">
              <span className="reports-details-item__label">Maximum Retail Price</span>
              <span className="reports-details-item__value">{mrp}</span>
            </div>
          </div>
        </Card>

        <Card title="Statutory Inspection Audit Score">
          <div className="reports-metrics">
            <div className="reports-metric-card">
              <div className="reports-metric-card__value" style={{ color: '#0f172a' }}>
                {totalRules}
              </div>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Total Rules Evaluated</span>
            </div>
            <div className="reports-metric-card">
              <div className="reports-metric-card__value" style={{ color: '#16a34a' }}>
                {verifiedCount}
              </div>
              <span style={{ fontSize: '0.8rem', color: '#16a34a' }}>Passed / Verified</span>
            </div>
            <div className="reports-metric-card">
              <div className="reports-metric-card__value" style={{ color: '#eab308' }}>
                {verificationRequiredCount}
              </div>
              <span style={{ fontSize: '0.8rem', color: '#854d0e' }}>Verification Required</span>
            </div>
            <div className="reports-metric-card">
              <div className="reports-metric-card__value" style={{ color: '#f97316' }}>
                {warningCount}
              </div>
              <span style={{ fontSize: '0.8rem', color: '#c2410c' }}>Warnings</span>
            </div>
            <div className="reports-metric-card">
              <div className="reports-metric-card__value" style={{ color: '#dc2626' }}>
                {nonComplianceCount}
              </div>
              <span style={{ fontSize: '0.8rem', color: '#dc2626' }}>Non-Compliant / Fail</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Rule 6 Declaration Checklist */}
      <Card title="Legal Metrology Rule 6 Statutory Declaration Checklist">
        <div className="reports-checklist">
          {rulesList.map((dec, idx) => (
            <div key={dec.ruleId || idx} className="reports-checklist-item">
              <div className="reports-checklist-item__main">
                <h3 className="reports-checklist-item__title">{dec.ruleName}</h3>
                <div className="reports-checklist-item__ref">{dec.legalReference}</div>
                {dec.statutoryDirective && (
                  <div className="reports-checklist-item__ref" style={{ color: '#475569', fontStyle: 'italic' }}>
                    Mandate: {dec.statutoryDirective}
                  </div>
                )}
                <div className="reports-checklist-item__msg">{dec.message}</div>
                {dec.extractedValue && (
                  <div className="reports-checklist-item__value">
                    <strong>Captured Label Text: </strong>
                    <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                      {dec.extractedValue}
                    </code>
                  </div>
                )}
                {dec.officerNote && (
                  <div className="reports-checklist-item__value" style={{ color: '#1e40af' }}>
                    <strong>Officer Note / Justification: </strong>{dec.officerNote}
                  </div>
                )}
              </div>
              <div>{getDeclarationBadge(dec.status)}</div>
            </div>
          ))}
        </div>

        {reportData.officerNotes && (
          <div className="reports-officer-notes">
            <h4 className="reports-officer-notes__title">Enforcement Officer Remarks</h4>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>{reportData.officerNotes}</p>
          </div>
        )}
      </Card>

      {showNoticeModal && (
        <NoticeGenerator
          report={reportData}
          isModal
          onClose={() => setShowNoticeModal(false)}
        />
      )}
    </div>
  )
}