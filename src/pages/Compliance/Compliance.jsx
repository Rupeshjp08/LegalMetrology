// src/pages/Compliance/Compliance.jsx
import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Card from '../../components/ui/Card/Card'
import StatusBadge from '../../components/ui/StatusBadge/StatusBadge'
import Button from '../../components/ui/Button/Button'
import PageHeader from '../../components/ui/PageHeader/PageHeader'
import { ROUTES } from '../../constants'
import { runComplianceAudit, generateInspectionSummary, COMPLIANCE_STATUS } from '../../modules/compliance'

const MOCK_INSPECTION_DATA = {
  inspectionId: 'INS-2026-0042',
  product: {
    name: 'Standard Packaged Biscuits 250g',
    category: 'Food',
  },
  scanMetadata: {
    imageQuality: 'high',
    allSidesCaptured: true,
  },
  declarations: {
    mrp: { detected: true, rawText: 'MRP ₹40.00 (inclusive of all taxes)', clarity: 'clear' },
    netQuantity: { detected: true, rawText: '250 g', clarity: 'clear' },
    manufacturerDetails: { detected: true, rawText: 'Sunrise Bakeries Ltd, Plot 42, Peenya, Bengaluru', clarity: 'clear' },
    consumerCare: { detected: false, rawText: null, clarity: 'blurry' },
    countryOfOrigin: { detected: true, rawText: 'India', clarity: 'clear' },
    dateOfPackaging: { detected: true, rawText: '08/2026', clarity: 'clear' },
    fssaiLicense: { detected: true, rawText: '10012011000234', clarity: 'clear' },
    expiryDate: { detected: true, rawText: 'Best Before 6 months from packaging', clarity: 'clear' },
  },
}

function resolveScanInputData(locationState) {
  if (locationState?.scanData) {
    return locationState.scanData
  }
  try {
    const sessionSaved = sessionStorage.getItem('pclmcs.latest_scan')
    if (sessionSaved) {
      return JSON.parse(sessionSaved)
    }
  } catch (err) {
    console.warn('Could not parse sessionStorage scan data:', err)
  }
  return MOCK_INSPECTION_DATA
}

export default function Compliance() {
  const location = useLocation()
  const navigate = useNavigate()

  const [activeScanData, setActiveScanData] = useState(() => resolveScanInputData(location.state))
  const [auditResult, setAuditResult] = useState(() => runComplianceAudit(activeScanData))
  const [selectedCategory, setSelectedCategory] = useState(() => auditResult.category || 'Food')
  const [activePanelFinding, setActivePanelFinding] = useState(null)
  const [officerDecisionNotes, setOfficerDecisionNotes] = useState('')

  const handleCategorySwitch = (newCategory) => {
    setSelectedCategory(newCategory)
    const updatedInput = {
      ...activeScanData,
      product: {
        ...(activeScanData.product || {}),
        category: newCategory,
      },
    }
    setActiveScanData(updatedInput)
    setAuditResult(runComplianceAudit(updatedInput))
  }

  const handleSaveInspection = () => {
    const exportSummary = generateInspectionSummary(auditResult)
    try {
      const existing = JSON.parse(localStorage.getItem('pclmcs.inspections') || '[]')
      const updated = [
        exportSummary,
        ...existing.filter(
          (item) => item.inspectionMetadata?.inspectionId !== exportSummary.inspectionMetadata?.inspectionId
        ),
      ]
      localStorage.setItem('pclmcs.inspections', JSON.stringify(updated))
    } catch (err) {
      console.error('Failed to save inspection to localStorage:', err)
    }

    const targetRoute = ROUTES.REPORTS || ROUTES.INSPECTION || '/reports'
    navigate(targetRoute, {
      state: {
        inspectionId: auditResult.inspectionId,
        handoffPayload: exportSummary,
      },
    })
  }

  const handleExportHandoff = () => {
    const summary = generateInspectionSummary(auditResult)
    console.log('[Member 3 Handoff Payload for Member 4 & 5]:', summary)
    if (summary.violations.length > 0) {
      console.table(summary.violations)
    }
    alert(
      `Inspection Handoff Payload Exported!\n` +
      `Session: ${summary.inspectionMetadata.inspectionId}\n` +
      `Status: ${summary.statutoryVerdict.overallStatus}\n` +
      `Violations: ${summary.violations.length}\n` +
      `Action: ${summary.statutoryVerdict.actionRequired}`
    )
  }

  const getBadgeProps = (status) => {
    switch (status) {
      case COMPLIANCE_STATUS.VERIFIED:
        return { tone: 'success', label: 'Verified' }
      case COMPLIANCE_STATUS.WARNING:
        return { tone: 'warning', label: 'Warning' }
      case COMPLIANCE_STATUS.VERIFICATION_REQUIRED:
        return { tone: 'warning', label: 'Verification Required' }
      case COMPLIANCE_STATUS.POTENTIAL_NON_COMPLIANCE:
        return { tone: 'danger', label: 'Potential Non-Compliance' }
      default:
        return { tone: 'neutral', label: status }
    }
  }

  const handleOfficerOverride = (ruleId, newStatus) => {
    setAuditResult((prev) => {
      const updatedFindings = prev.findings.map((f) => {
        if (f.ruleId === ruleId) {
          return {
            ...f,
            status: newStatus,
            officerOverride: true,
            officerNote: officerDecisionNotes || 'Manually verified on physical package panel.',
          }
        }
        return f
      })

      const summary = {
        verified: 0,
        warnings: 0,
        verificationRequired: 0,
        potentialNonCompliance: 0,
      }

      updatedFindings.forEach((item) => {
        if (item.status === COMPLIANCE_STATUS.VERIFIED) summary.verified++
        else if (item.status === COMPLIANCE_STATUS.WARNING) summary.warnings++
        else if (item.status === COMPLIANCE_STATUS.VERIFICATION_REQUIRED) summary.verificationRequired++
        else if (item.status === COMPLIANCE_STATUS.POTENTIAL_NON_COMPLIANCE) summary.potentialNonCompliance++
      })

      return {
        ...prev,
        summary,
        findings: updatedFindings,
      }
    })
    setActivePanelFinding(null)
    setOfficerDecisionNotes('')
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
      {/* Top Header Actions Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <PageHeader
            title="Legal Metrology Compliance Intelligence"
            subtitle={`Session ID: ${auditResult.inspectionId} | Commodity: ${auditResult.productName}`}
          />
          {/* Category Selector Dropdown */}
          <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
              Statutory Category Rule Set:
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => handleCategorySwitch(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                fontSize: '0.85rem',
                fontWeight: 500,
                color: '#0f172a',
                cursor: 'pointer',
              }}
            >
              <option value="Food">Food / Beverage (FSSAI Rules)</option>
              <option value="Electronics">Electronics (BIS / CRS Rules)</option>
              <option value="General">General Commodity (Standard Rule 6)</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Button variant="secondary" size="medium" onClick={handleExportHandoff}>
            Export Notice Data
          </Button>
          <Button variant="primary" size="medium" onClick={handleSaveInspection}>
            Save Inspection & Issue Report
          </Button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', margin: '1.5rem 0' }}>
        <Card>
          <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>Verified</span>
          <div style={{ fontSize: '2rem', fontWeight: 600, color: '#16a34a' }}>{auditResult.summary.verified}</div>
        </Card>
        <Card>
          <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>Verification Required</span>
          <div style={{ fontSize: '2rem', fontWeight: 600, color: '#eab308' }}>{auditResult.summary.verificationRequired}</div>
        </Card>
        <Card>
          <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>Warnings</span>
          <div style={{ fontSize: '2rem', fontWeight: 600, color: '#f97316' }}>{auditResult.summary.warnings}</div>
        </Card>
        <Card>
          <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>Potential Non-Compliance</span>
          <div style={{ fontSize: '2rem', fontWeight: 600, color: '#dc2626' }}>{auditResult.summary.potentialNonCompliance}</div>
        </Card>
      </div>

      {/* Rule 6 Assessment Cards */}
      <Card title={`Statutory Declaration Checks (${selectedCategory} Category Assessment)`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {auditResult.findings.map((finding) => {
            const badge = getBadgeProps(finding.status)
            return (
              <div
                key={finding.ruleId}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: '#ffffff',
                }}
              >
                <div style={{ flex: 1, paddingRight: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                    <strong style={{ fontSize: '1.05rem' }}>{finding.ruleName}</strong>
                    <StatusBadge tone={badge.tone} label={badge.label} />
                    {finding.officerOverride && (
                      <span style={{ fontSize: '0.75rem', background: '#e0e7ff', color: '#3730a3', padding: '2px 8px', borderRadius: '12px', fontWeight: 500 }}>
                        Officer Overridden
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.5rem' }}>{finding.legalReference}</div>
                  <div style={{ color: '#1f2937', fontSize: '0.95rem' }}>{finding.message}</div>
                  {finding.extractedValue && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#4b5563' }}>
                      <strong>Captured Text: </strong>
                      <code style={{ background: '#f3f4f6', padding: '2px 8px', borderRadius: '4px' }}>{finding.extractedValue}</code>
                    </div>
                  )}
                  {finding.officerNote && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#1e40af' }}>
                      <strong>Officer Justification: </strong>{finding.officerNote}
                    </div>
                  )}
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setOfficerDecisionNotes(finding.officerNote || '')
                      setActivePanelFinding(finding)
                    }}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#f3f4f6',
                      color: '#1f2937',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                    }}
                  >
                    Review Panel
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Built-in Modal Overlay */}
      {activePanelFinding && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
          onClick={() => setActivePanelFinding(null)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '10px',
              maxWidth: '600px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a' }}>
                Officer Verification — {activePanelFinding.ruleName}
              </h3>
              <button
                type="button"
                onClick={() => setActivePanelFinding(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}
              >
                &times;
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '70vh', overflowY: 'auto' }}>
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Statutory Rule</span>
                  <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>{activePanelFinding.legalReference}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Penal Provision</span>
                  <div style={{ color: '#b91c1c', fontWeight: 600, fontSize: '0.85rem' }}>{activePanelFinding.penalSection}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Statutory Directive</span>
                  <div style={{ color: '#334155', fontSize: '0.85rem', lineHeight: 1.4 }}>{activePanelFinding.statutoryDirective}</div>
                </div>
              </div>

              <div style={{ background: '#fefce8', padding: '0.85rem', borderRadius: '6px', border: '1px solid #fef08a' }}>
                <p style={{ margin: '0 0 0.25rem 0', color: '#854d0e', fontSize: '0.8rem', fontWeight: 600 }}>SYSTEM FINDING</p>
                <div style={{ color: '#713f12', fontSize: '0.9rem' }}>{activePanelFinding.message}</div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#374151', marginBottom: '0.35rem' }}>
                  Officer Physical Inspection Notes / Legal Justification:
                </label>
                <textarea
                  rows={3}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.9rem', boxSizing: 'border-box' }}
                  placeholder="E.g., Package physically examined: Consumer Care helpline 1800-XXX-XXXX is embossed on the bottom crimp."
                  value={officerDecisionNotes}
                  onChange={(e) => setOfficerDecisionNotes(e.target.value)}
                />
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '1rem 1.5rem', backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <Button variant="secondary" size="small" onClick={() => setActivePanelFinding(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="small"
                onClick={() => handleOfficerOverride(activePanelFinding.ruleId, COMPLIANCE_STATUS.POTENTIAL_NON_COMPLIANCE)}
              >
                Confirm Violation
              </Button>
              <Button
                variant="primary"
                size="small"
                onClick={() => handleOfficerOverride(activePanelFinding.ruleId, COMPLIANCE_STATUS.VERIFIED)}
              >
                Mark Verified
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}