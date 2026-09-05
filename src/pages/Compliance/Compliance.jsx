// src/pages/Compliance/Compliance.jsx
import React, { useState } from 'react'
import Card from '../../components/ui/Card/Card'
import StatusBadge from '../../components/ui/StatusBadge/StatusBadge'
import Button from '../../components/ui/Button/Button'
import PageHeader from '../../components/ui/PageHeader/PageHeader'
import Modal from '../../components/ui/Modal/Modal'
import { runComplianceAudit, COMPLIANCE_STATUS } from '../../modules/compliance'

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
  },
}

export default function Compliance() {
  const [auditResult, setAuditResult] = useState(() => runComplianceAudit(MOCK_INSPECTION_DATA))
  const [activePanelFinding, setActivePanelFinding] = useState(null)
  const [officerDecisionNotes, setOfficerDecisionNotes] = useState('')

  // Map engine status to Member 1's StatusBadge props
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

  // Officer override handler (chain of custody preservation)
  const handleOfficerOverride = (ruleId, newStatus) => {
    setAuditResult((prev) => {
      const updatedFindings = prev.findings.map((f) => {
        if (f.ruleId === ruleId) {
          return {
            ...f,
            status: newStatus,
            officerOverride: true,
            officerNote: officerDecisionNotes || 'Manually verified on package physical panel.',
          }
        }
        return f
      })

      // Recalculate summary totals
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
    <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <PageHeader
        title="Legal Metrology Compliance Intelligence"
        subtitle={`Session ID: ${auditResult.inspectionId} | Commodity: ${auditResult.productName}`}
      />

      {/* Summary Scorecards */}
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

      {/* Declaration Check List */}
      <Card title="Statutory Declaration Checks (Rule 6 Assessment)">
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
                      <span style={{ fontSize: '0.75rem', background: '#e0e7ff', color: '#3730a3', padding: '2px 8px', borderRadius: '12px' }}>
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
                </div>
                <div>
                  <Button variant="secondary" size="small" onClick={() => setActivePanelFinding(finding)}>
                    Review Panel
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Officer Manual Review / Decision Modal */}
      {activePanelFinding && (
        <Modal
          isOpen={Boolean(activePanelFinding)}
          onClose={() => setActivePanelFinding(null)}
          title={`Officer Verification — ${activePanelFinding.ruleName}`}
        >
          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <p style={{ margin: '0 0 0.25rem 0', color: '#4b5563', fontSize: '0.85rem' }}>Statutory Authority</p>
              <strong>{activePanelFinding.legalReference}</strong>
            </div>

            <div style={{ background: '#f9fafb', padding: '0.75rem', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
              <p style={{ margin: '0 0 0.25rem 0', color: '#4b5563', fontSize: '0.85rem' }}>Automated Analysis</p>
              <div>{activePanelFinding.message}</div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#374151', marginBottom: '0.25rem' }}>
                Officer Notes / Physical Inspection Justification:
              </label>
              <textarea
                rows={3}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                placeholder="E.g., Verified visually on top seal flap; text was obscured during initial camera pass."
                value={officerDecisionNotes}
                onChange={(e) => setOfficerDecisionNotes(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
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
        </Modal>
      )}
    </div>
  )
}