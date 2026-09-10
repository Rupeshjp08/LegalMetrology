// src/pages/Compliance/Compliance.jsx
import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Card from '../../components/ui/Card/Card'
import StatusBadge from '../../components/ui/StatusBadge/StatusBadge'
import Button from '../../components/ui/Button/Button'
import PageHeader from '../../components/ui/PageHeader/PageHeader'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'
import EmptyState from '../../components/feedback/EmptyState/EmptyState'
import Alert from '../../components/feedback/Alert/Alert'
import { ROUTES } from '../../constants'
import {
  adaptScanToCompliance,
  evaluateDeclarations,
  generateInspectionSummary,
  COMPLIANCE_STATUS
} from '../../modules/compliance'

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
  return null
}

export default function Compliance() {
  const location = useLocation()
  const navigate = useNavigate()

  const rawScanData = location.state?.scanData || resolveScanInputData(location.state)

  const [activeScanData, setActiveScanData] = useState(rawScanData)
  const [selectedCategory, setSelectedCategory] = useState(() => rawScanData?.metadata?.category || 'Food')

  const [auditResult, setAuditResult] = useState(() => {
    if (!rawScanData) return null
    const adapted = adaptScanToCompliance(rawScanData)
    const categoryToUse = rawScanData.metadata?.category || adapted.product?.category || 'Food'
    return evaluateDeclarations(
      adapted.declarations,
      categoryToUse,
      adapted.scanMetadata,
      adapted.inspectionId,
      rawScanData.metadata?.productName || adapted.product?.name
    )
  })

  const [activePanelFinding, setActivePanelFinding] = useState(null)
  const [officerDecisionNotes, setOfficerDecisionNotes] = useState('')

  useEffect(() => {
    const freshScanData = location.state?.scanData || resolveScanInputData(location.state)
    if (freshScanData) {
      setActiveScanData(freshScanData)
      const adapted = adaptScanToCompliance(freshScanData)
      const categoryToUse = freshScanData.metadata?.category || adapted.product?.category || selectedCategory || 'Food'
      setSelectedCategory(categoryToUse)
      const evaluated = evaluateDeclarations(
        adapted.declarations,
        categoryToUse,
        adapted.scanMetadata,
        adapted.inspectionId,
        freshScanData.metadata?.productName || adapted.product?.name
      )
      setAuditResult(evaluated)
    }
  }, [location.state])

  const handleCategorySwitch = (newCategory) => {
    setSelectedCategory(newCategory)
    if (!activeScanData) return
    const updatedInput = {
      ...activeScanData,
      metadata: {
        ...(activeScanData.metadata || {}),
        category: newCategory,
      },
      product: {
        ...(activeScanData.product || {}),
        category: newCategory,
      },
      category: newCategory,
    }
    setActiveScanData(updatedInput)
    const adapted = adaptScanToCompliance(updatedInput)
    const evaluated = evaluateDeclarations(
      adapted.declarations,
      newCategory,
      adapted.scanMetadata,
      adapted.inspectionId,
      updatedInput.metadata?.productName || adapted.product?.name
    )
    setAuditResult(evaluated)
  }

  const handleSaveInspection = () => {
    if (!auditResult) return
    const exportSummary = generateInspectionSummary(auditResult)

    const verifiedCount = auditResult.summary?.verified || 0
    const verificationRequiredCount = auditResult.summary?.verificationRequired || 0
    const warningCount = auditResult.summary?.warnings || 0
    const nonComplianceCount = auditResult.summary?.potentialNonCompliance || 0
    const totalRules = auditResult.findings?.length || 7

    const overallVerdict =
      nonComplianceCount > 0
        ? 'NON_COMPLIANT'
        : verificationRequiredCount > 0
        ? 'PENDING_VERIFICATION'
        : 'COMPLIANT'

    const statutoryCitation =
      nonComplianceCount > 0
        ? 'Liable for action under Section 36(1) of Legal Metrology Act, 2009'
        : 'Compliant with Rule 6 of PCR 2011'

    const evaluationResults = (auditResult.findings || []).map((finding) => ({
      ruleId: finding.ruleId,
      ruleName: finding.ruleName,
      field: finding.field,
      legalReference: finding.legalReference,
      penalSection: finding.penalSection,
      statutoryDirective: finding.statutoryDirective,
      status: finding.status,
      priority: finding.priority,
      message: finding.message,
      extractedValue: finding.extractedValue || null,
      officerNote: finding.officerNote || null,
      officerOverride: Boolean(finding.officerOverride),
    }))

    const inspectionRecord = {
      inspectionId: auditResult.inspectionId || `INS-${Date.now().toString().slice(-6)}`,
      inspectionDate: new Date().toISOString(),
      officerName: 'Inspection Officer (Legal Metrology)',
      commodity: {
        barcode: activeScanData?.metadata?.barcode || activeScanData?.barcode || 'N/A',
        productName: activeScanData?.metadata?.productName || activeScanData?.productName || auditResult.productName || 'Inspected Commodity',
        name: activeScanData?.metadata?.productName || activeScanData?.productName || auditResult.productName || 'Inspected Commodity',
        category: selectedCategory || activeScanData?.metadata?.category || 'General Commodity',
        extractedFields: activeScanData?.extractedFields || {},
        mrp: activeScanData?.extractedFields?.mrp || activeScanData?.mrp || 'N/A',
        netQuantity: activeScanData?.extractedFields?.netQuantity || activeScanData?.netQuantity || 'N/A',
        manufacturer: activeScanData?.extractedFields?.manufacturerName || activeScanData?.manufacturer || 'N/A',
      },
      summary: {
        totalRules,
        verifiedCount,
        verificationRequiredCount,
        warningCount,
        nonComplianceCount,
        overallVerdict,
        statutoryCitation,
      },
      rules: evaluationResults,
      // Backwards compatibility properties
      id: auditResult.inspectionId || `INS-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      results: {
        totalRules,
        verifiedCount,
        verificationRequiredCount,
        warningCount,
        nonComplianceCount,
        verdict: overallVerdict,
      },
      declarations: evaluationResults,
      officerNotes: officerDecisionNotes || '',
      exportSummary,
    }

    try {
      sessionStorage.setItem('pclmcs.latest_report', JSON.stringify(inspectionRecord))
      const history = JSON.parse(localStorage.getItem('pclmcs.inspections_history') || '[]')
      const updatedHistory = [
        inspectionRecord,
        ...history.filter((item) => item.inspectionId !== inspectionRecord.inspectionId && item.id !== inspectionRecord.id),
      ]
      localStorage.setItem('pclmcs.inspections_history', JSON.stringify(updatedHistory))
      localStorage.setItem('pclmcs.inspections', JSON.stringify(updatedHistory))
    } catch (err) {
      console.error('Failed to save inspection report to storage:', err)
    }

    const targetRoute = ROUTES.REPORTS || '/reports'
    navigate(targetRoute, {
      state: {
        report: inspectionRecord,
        inspectionId: auditResult.inspectionId,
        handoffPayload: exportSummary,
      },
    })
  }

  const handleExportHandoff = () => {
    if (!auditResult) return
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
      case 'COMPLIANT':
        return { tone: 'success', label: 'Verified Compliant' }
      case COMPLIANCE_STATUS.WARNING:
        return { tone: 'warning', label: 'Warning' }
      case COMPLIANCE_STATUS.VERIFICATION_REQUIRED:
      case 'PENDING':
        return { tone: 'warning', label: 'Verification Required' }
      case COMPLIANCE_STATUS.POTENTIAL_NON_COMPLIANCE:
      case 'NON_COMPLIANT':
        return { tone: 'danger', label: 'Non-Compliance' }
      default:
        return { tone: 'neutral', label: status }
    }
  }

  const handleOfficerOverride = (ruleId, newStatus) => {
    setAuditResult((prev) => {
      if (!prev) return prev
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

  if (!activeScanData || !auditResult) {
    return (
      <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
        <Breadcrumb
          items={[
            { to: ROUTES.DASHBOARD, label: 'Dashboard' },
            { label: 'Compliance Inspection' },
          ]}
        />
        <PageHeader
          overline="Legal Metrology · Compliance Intelligence"
          title="Statutory Product Inspection"
          description="Inspect commodity package declarations against Legal Metrology Rules."
        />

        <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
          <Alert tone="warning" title="No active scan found. You are in manual commodity entry mode.">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem' }}>
              <span>Please scan or upload a packaged commodity to ingest package declarations for statutory inspection.</span>
              <Button variant="primary" icon="camera" onClick={() => navigate(ROUTES.SCAN || '/scan')}>
                Open Scanner
              </Button>
            </div>
          </Alert>
        </div>

        <Card style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
          <EmptyState
            icon="barcode"
            title="No commodity scanned."
            description="No active product scan data found. Please scan or upload a packaged commodity to begin compliance inspection."
            action={
              <Button variant="primary" icon="camera" onClick={() => navigate(ROUTES.SCAN || '/scan')}>
                No commodity scanned. Click here to scan a package
              </Button>
            }
          />
        </Card>
      </div>
    )
  }

  const productName =
    activeScanData.metadata?.productName || activeScanData.productName || auditResult.productName || 'Scanned Commodity'
  const barcode = activeScanData.metadata?.barcode || activeScanData.barcode || 'N/A'
  const declaredMrp = activeScanData.extractedFields?.mrp || activeScanData.mrp || 'N/A'
  const declaredNetQty = activeScanData.extractedFields?.netQuantity || activeScanData.netQuantity || 'N/A'
  const declaredUsp =
    activeScanData.extractedFields?.unitSalePrice ||
    activeScanData.extractedFields?.usp ||
    activeScanData.unitSalePrice ||
    'N/A'
  const declaredManufacturer =
    activeScanData.extractedFields?.manufacturerName || activeScanData.manufacturer || 'N/A'

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
      <Breadcrumb
        items={[
          { to: ROUTES.DASHBOARD, label: 'Dashboard' },
          { to: ROUTES.SCAN, label: 'Scan Product' },
          { label: 'Compliance Inspection' },
        ]}
      />

      {/* Top Header Actions Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <PageHeader
            overline="Legal Metrology Compliance Intelligence"
            title="Statutory Product Inspection"
            subtitle={`Session ID: ${auditResult.inspectionId} | Commodity: ${productName}`}
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
              <option value="General">General Commodity (Standard Rule 6)</option>
              <option value="Food">Food & Beverages (FSSAI Rules)</option>
              <option value="Electronics">Electronics & IT Goods (BIS / CRS Rules)</option>
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

      {/* Commodity Summary Banner */}
      <Card style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', border: '1px solid #cbd5e1' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#2563eb', letterSpacing: '0.05em' }}>
              Active Commodity Scan Data
            </span>
            <h2 style={{ margin: '0.2rem 0', fontSize: '1.3rem', color: '#0f172a', fontWeight: 700 }}>
              {productName}
            </h2>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Barcode / EAN: <strong style={{ color: '#0f172a' }}>{barcode}</strong>
              {activeScanData.metadata?.scannedAt && ` · Scanned: ${new Date(activeScanData.metadata.scannedAt).toLocaleTimeString()}`}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.85rem' }}>
            <div>
              <span style={{ display: 'block', color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}>Declared MRP</span>
              <strong style={{ color: '#0f172a' }}>{declaredMrp}</strong>
            </div>
            <div>
              <span style={{ display: 'block', color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}>Net Quantity</span>
              <strong style={{ color: '#0f172a' }}>{declaredNetQty}</strong>
            </div>
            <div>
              <span style={{ display: 'block', color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}>Declared USP</span>
              <strong style={{ color: '#0f172a' }}>{declaredUsp}</strong>
            </div>
            <div>
              <span style={{ display: 'block', color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}>Manufacturer / Packer</span>
              <strong style={{ color: '#0f172a' }}>{declaredManufacturer}</strong>
            </div>
          </div>
        </div>
      </Card>

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
          <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>Non-Compliance</span>
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

      {/* Built-in Review Modal / Drawer */}
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
                {activePanelFinding.extractedValue && (
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Extracted OCR / Scanned Text</span>
                    <div style={{ background: '#ffffff', padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', color: '#0f172a', fontFamily: 'monospace', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                      {activePanelFinding.extractedValue}
                    </div>
                  </div>
                )}
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
            <div style={{ padding: '1rem 1.5rem', backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', flexWrap: 'wrap' }}>
              <Button variant="secondary" size="small" onClick={() => setActivePanelFinding(null)}>
                Cancel
              </Button>
              <Button
                variant="warning"
                size="small"
                onClick={() => handleOfficerOverride(activePanelFinding.ruleId, COMPLIANCE_STATUS.VERIFICATION_REQUIRED)}
              >
                Pending Clarification
              </Button>
              <Button
                variant="danger"
                size="small"
                onClick={() => handleOfficerOverride(activePanelFinding.ruleId, COMPLIANCE_STATUS.POTENTIAL_NON_COMPLIANCE)}
              >
                Non-Compliant (Violation)
              </Button>
              <Button
                variant="primary"
                size="small"
                onClick={() => handleOfficerOverride(activePanelFinding.ruleId, COMPLIANCE_STATUS.VERIFIED)}
              >
                Verified Compliant
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}