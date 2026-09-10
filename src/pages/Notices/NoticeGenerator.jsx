import React, { useState } from 'react'
import { useLocation } from 'react-router-dom'
import Button from '../../components/ui/Button/Button'
import PageHeader from '../../components/ui/PageHeader/PageHeader'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'
import Alert from '../../components/feedback/Alert/Alert'
import { ROUTES } from '../../constants'
import './NoticeGenerator.css'

const MOCK_REPORT_FALLBACK = {
  id: 'INS-2026-0042',
  timestamp: new Date().toISOString(),
  commodity: {
    barcode: '8901234567890',
    name: 'Standard Packaged Biscuits 250g',
    category: 'Food / Beverage',
    manufacturer: 'Sunrise Bakeries Ltd, Plot 42, Peenya, Bengaluru',
    mrp: '₹40.00 (inclusive of all taxes)',
    netQuantity: '250 g',
  },
  results: {
    totalRules: 7,
    verifiedCount: 5,
    verificationRequiredCount: 1,
    warningCount: 0,
    nonComplianceCount: 1,
    verdict: 'NON_COMPLIANT',
  },
  declarations: [
    {
      ruleId: 'R6_1_G',
      ruleName: 'Consumer Care & Grievance Contact Details',
      legalReference: 'Rule 6(1)(g) Legal Metrology (Packaged Commodities) Rules, 2011',
      penalSection: 'Section 36(1) of Legal Metrology Act, 2009',
      status: 'POTENTIAL_NON_COMPLIANCE',
      message: 'Missing toll-free helpline number or email address on package label.',
      extractedValue: null,
      officerNote: 'Missing mandatory toll-free consumer care details on side panel.',
    },
    {
      ruleId: 'R6_1_H',
      ruleName: 'Unit Sale Price (USP)',
      legalReference: 'Rule 6(1)(h) Legal Metrology (Packaged Commodities) Rules, 2011',
      penalSection: 'Section 36(1) of Legal Metrology Act, 2009',
      status: 'VERIFICATION_REQUIRED',
      message: 'Unit sale price missing from principal display panel.',
      extractedValue: null,
    },
  ],
}

function resolveReport(locationState, propReport) {
  if (propReport) return propReport
  if (locationState?.report) return locationState.report
  try {
    const sessionSaved = sessionStorage.getItem('pclmcs.latest_report')
    if (sessionSaved) return JSON.parse(sessionSaved)
  } catch (e) {
    console.warn('Could not parse sessionStorage report:', e)
  }
  return MOCK_REPORT_FALLBACK
}

function calculateDefaultDeadline() {
  const date = new Date()
  date.setDate(date.getDate() + 15)
  return date.toISOString().split('T')[0]
}

export default function NoticeGenerator({ report: propReport, onClose, isModal = false }) {
  const location = useLocation()

  const reportData = resolveReport(location.state, propReport)

  const [noticeNo] = useState(() => `LM-NOTICE-${Date.now().toString().slice(-6)}`)
  const [noticeDate] = useState(() => new Date().toISOString().split('T')[0])
  const [recipientName, setRecipientName] = useState(
    reportData.commodity?.manufacturer || 'M/s Sunrise Bakeries Ltd'
  )
  const [recipientAddress, setRecipientAddress] = useState(
    'Plot 42, Peenya Industrial Area, Phase II, Bengaluru, Karnataka - 560058'
  )
  const [commodityName, setCommodityName] = useState(
    reportData.commodity?.name || 'Packaged Commodity'
  )
  const [barcodeNumber, setBarcodeNumber] = useState(
    reportData.commodity?.barcode || 'N/A'
  )
  const [offenseLevel, setOffenseLevel] = useState('FIRST')
  const [replyDeadline, setReplyDeadline] = useState(calculateDefaultDeadline)
  const [officerName, setOfficerName] = useState('R. K. Sharma, LM-8492')
  const [officerDesignation, setOfficerDesignation] = useState('Inspector of Legal Metrology, Zone-4')
  const [isSaved, setIsSaved] = useState(false)

  // Penalty Calculation Engine
  const basePenalty =
    offenseLevel === 'FIRST' ? 25000 : offenseLevel === 'SECOND' ? 50000 : 100000

  const failedDeclarations = (reportData.declarations || []).filter(
    (d) =>
      d.status === 'POTENTIAL_NON_COMPLIANCE' ||
      d.status === 'NON_COMPLIANT' ||
      d.status === 'WARNING' ||
      d.status === 'VERIFICATION_REQUIRED'
  )

  const activeViolations = failedDeclarations.length > 0 ? failedDeclarations : reportData.declarations || []

  const handlePrintNotice = () => {
    window.print()
  }

  const handleSaveNotice = () => {
    const noticeRecord = {
      noticeNo,
      noticeDate,
      inspectionId: reportData.id,
      statutorySection: 'Section 36(1) of Legal Metrology Act, 2009',
      recipientName,
      recipientAddress,
      commodityName,
      barcodeNumber,
      offenseLevel,
      compoundingFine: basePenalty,
      replyDeadline,
      officerName,
      officerDesignation,
      violations: activeViolations,
      timestamp: new Date().toISOString(),
    }

    try {
      const existing = JSON.parse(localStorage.getItem('pclmcs.issued_notices') || '[]')
      const updated = [noticeRecord, ...existing.filter((n) => n.noticeNo !== noticeNo)]
      localStorage.setItem('pclmcs.issued_notices', JSON.stringify(updated))
      setIsSaved(true)
    } catch (err) {
      console.error('Failed to save notice to localStorage:', err)
    }
  }

  const contentMarkup = (
    <div className="notice-container">
      <div className="no-print">
        {!isModal && (
          <Breadcrumb
            items={[
              { to: ROUTES.DASHBOARD, label: 'Dashboard' },
              { to: ROUTES.REPORTS, label: 'Reports' },
              { label: 'Statutory Compounding Notice' },
            ]}
          />
        )}

        <div className="notice-header">
          <div>
            <PageHeader
              overline="Legal Metrology Act, 2009 · Section 36(1) Enforcement"
              title={`Statutory Compounding Notice Generator (${noticeNo})`}
              subtitle={`Inspection Session: ${reportData.id} | Statutory Offense Notice`}
            />
          </div>

          <div className="notice-header__actions">
            {isModal && onClose && (
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
            )}
            <Button variant="secondary" icon="printer" onClick={handlePrintNotice}>
              Download Notice (PDF / Print)
            </Button>
            <Button variant="primary" icon="check" onClick={handleSaveNotice}>
              Issue & Save Notice
            </Button>
          </div>
        </div>

        {isSaved && (
          <div style={{ marginBottom: '1.5rem' }}>
            <Alert tone="success" title="Notice Issued Successfully!">
              Statutory Compounding Notice <strong>{noticeNo}</strong> has been recorded in the Legal Metrology enforcement ledger (`pclmcs.issued_notices`).
            </Alert>
          </div>
        )}

        {/* Interactive Configuration Card */}
        <div className="notice-config-card">
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: '#0f172a' }}>
            Statutory Notice Parameters & Compounding Fee Engine
          </h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
            Modify recipient metadata and offense details. Penalty calculation updates automatically based on Section 36(1) compounding rules.
          </p>

          <div className="notice-config-grid">
            <div className="notice-field">
              <label>Manufacturer / Packer Recipient Name</label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
              />
            </div>
            <div className="notice-field">
              <label>Registered Factory Address</label>
              <input
                type="text"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
              />
            </div>
            <div className="notice-field">
              <label>Commodity Description</label>
              <input
                type="text"
                value={commodityName}
                onChange={(e) => setCommodityName(e.target.value)}
              />
            </div>
            <div className="notice-field">
              <label>Barcode / Batch Number</label>
              <input
                type="text"
                value={barcodeNumber}
                onChange={(e) => setBarcodeNumber(e.target.value)}
              />
            </div>
            <div className="notice-field">
              <label>Offense Count History (Section 36(1))</label>
              <select
                value={offenseLevel}
                onChange={(e) => setOffenseLevel(e.target.value)}
              >
                <option value="FIRST">First Offense (Compounding Fine ₹25,000)</option>
                <option value="SECOND">Second Offense (Compounding Fine ₹50,000)</option>
                <option value="SUBSEQUENT">Subsequent Offense (₹1,00,000 / Judicial Escalation)</option>
              </select>
            </div>
            <div className="notice-field">
              <label>Reply / Compounding Payment Deadline</label>
              <input
                type="date"
                value={replyDeadline}
                onChange={(e) => setReplyDeadline(e.target.value)}
              />
            </div>
            <div className="notice-field">
              <label>Inspecting Officer Name</label>
              <input
                type="text"
                value={officerName}
                onChange={(e) => setOfficerName(e.target.value)}
              />
            </div>
            <div className="notice-field">
              <label>Officer Designation & Jurisdiction</label>
              <input
                type="text"
                value={officerDesignation}
                onChange={(e) => setOfficerDesignation(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* FORMAL GOVERNMENT MEMORANDUM PRINT / VIEW PAPER */}
      <div className="notice-memo-paper">
        <div className="notice-memo-header">
          <div className="notice-memo-header__emblem">🏛️</div>
          <h1 className="notice-memo-header__govt">GOVERNMENT OF INDIA</h1>
          <h2 className="notice-memo-header__dept">
            DEPARTMENT OF CONSUMER AFFAIRS · LEGAL METROLOGY DIVISION
          </h2>
          <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '0.25rem' }}>
            Office of the Controller of Legal Metrology
          </div>
        </div>

        <div className="notice-memo-meta">
          <div>Ref No: {noticeNo}</div>
          <div>Date of Issuance: {noticeDate}</div>
        </div>

        <div className="notice-memo-recipient">
          <strong>TO:</strong>
          <br />
          {recipientName}
          <br />
          {recipientAddress}
          <br />
          <strong>Commodity:</strong> {commodityName} (Barcode: {barcodeNumber})
        </div>

        <div className="notice-memo-title">
          NOTICE FOR COMPOUNDING OF OFFENCE UNDER SECTION 48 READ WITH SECTION 36(1) OF THE LEGAL METROLOGY ACT, 2009
        </div>

        <div className="notice-memo-subject">
          SUBJECT: NON-COMPLIANCE WITH RULE 6 OF LEGAL METROLOGY (PACKAGED COMMODITIES) RULES, 2011 IN RESPECT OF "{commodityName}".
        </div>

        <div className="notice-memo-body">
          <p>
            WHEREAS, an inspection of the packaged commodity titled <strong>"{commodityName}"</strong> bearing Barcode/GTIN <strong>"{barcodeNumber}"</strong> was conducted by the undersigned Legal Metrology Officer under statutory powers conferred by Section 15 of the Legal Metrology Act, 2009;
          </p>

          <p>
            AND WHEREAS, upon physical and digital label examination, the package was found to be in direct contravention of Rule 6 of the Legal Metrology (Packaged Commodities) Rules, 2011, as detailed in the statutory violation breakdown schedule below:
          </p>

          <table className="notice-memo-table">
            <thead>
              <tr>
                <th>S.No.</th>
                <th>Statutory Requirement</th>
                <th>Legal Provision</th>
                <th>Detected Violation / Discrepancy</th>
              </tr>
            </thead>
            <tbody>
              {activeViolations.map((v, index) => (
                <tr key={v.ruleId || index}>
                  <td>{index + 1}</td>
                  <td>
                    <strong>{v.ruleName}</strong>
                  </td>
                  <td>{v.legalReference || 'Rule 6, PC Rules 2011'}</td>
                  <td>{v.message || v.officerNote || 'Mandatory declaration missing or incomplete.'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p>
            AND WHEREAS, manufacture, packing, import, or sale of non-standard pre-packaged commodities is an offence punishable under <strong>Section 36(1) of the Legal Metrology Act, 2009</strong>, attracting statutory fine of up to ₹25,000 for the first offence, ₹50,000 for the second offence, and up to ₹1,00,000 or imprisonment for subsequent offences.
          </p>

          <div className="notice-memo-penalty">
            STATUTORY COMPOUNDING FINE AMOUNT EVALUATED: ₹{basePenalty.toLocaleString('en-IN')} (Offense Category: {offenseLevel} OFFENSE)
          </div>

          <p>
            NOW THEREFORE, in accordance with Section 48 of the Legal Metrology Act, 2009, you are hereby given an opportunity to compound the said offence by depositing the compounding amount of <strong>₹{basePenalty.toLocaleString('en-IN')}</strong> before the designated officer on or before <strong>{replyDeadline}</strong> (15 calendar days from issuance).
          </p>

          <p>
            PLEASE TAKE NOTICE that if no compounding application or satisfactory cause is submitted by <strong>{replyDeadline}</strong>, formal criminal prosecution proceedings shall be initiated against your firm in the competent Court of Judicial Magistrate under Section 36(1) of the Legal Metrology Act, 2009 without further notice.
          </p>
        </div>

        <div className="notice-memo-signatory">
          <div className="notice-memo-seal">
            OFFICIAL SEAL
            <br />
            LEGAL METROLOGY
          </div>

          <div className="notice-memo-signature">
            <div>____________________________</div>
            <div style={{ marginTop: '0.35rem' }}>
              <strong>({officerName})</strong>
            </div>
            <div>{officerDesignation}</div>
            <div>Department of Consumer Affairs, Legal Metrology</div>
          </div>
        </div>
      </div>
    </div>
  )

  if (isModal) {
    return (
      <div className="notice-modal-overlay" onClick={onClose}>
        <div className="notice-modal-content" onClick={(e) => e.stopPropagation()}>
          {contentMarkup}
        </div>
      </div>
    )
  }

  return contentMarkup
}
