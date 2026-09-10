// src/pages/Compliance/Compliance.jsx
import React, { useState, useEffect, useMemo } from 'react'
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

const SAMPLE_COMMODITIES = {
  compliant_salt: {
    metadata: {
      productName: 'Tata Vacuum Evaporated Iodized Salt',
      barcode: '8901058002154',
      category: 'Food',
      scannedAt: new Date().toISOString(),
    },
    extractedFields: {
      mrp: '₹ 28.00 (inclusive of all taxes)',
      netQuantity: '1 kg',
      unitSalePrice: '₹ 0.028/g',
      manufacturerName: 'Tata Consumer Products Limited, Mumbai 400099',
      countryOfOrigin: 'India',
      monthYearOfManufacture: '08/2026',
      consumerCareDetails: 'Helpline: 1800-209-4500 | Email: care@tataconsumer.com',
      fssaiLicenseNumber: '10014022003058',
    },
    images: [
      {
        url: 'https://images.unsplash.com/photo-1518110168401-f2843586aa66?auto=format&fit=crop&w=300&q=80',
        caption: 'Tata Salt Package Panel',
      },
    ],
  },
  non_compliant_tea: {
    metadata: {
      productName: 'Apex Premium Assam CTC Dust Tea 500g',
      barcode: '8901234567890',
      category: 'Food',
      scannedAt: new Date().toISOString(),
    },
    extractedFields: {
      mrp: '₹ 350.00', // Missing 'inclusive of all taxes' statement
      netQuantity: '500 g',
      unitSalePrice: '', // Missing mandatory USP under Rule 6(1)(h) for >100g
      manufacturerName: 'Apex Tea Estates Pvt Ltd, Assam', // Missing pincode
      countryOfOrigin: 'India',
      monthYearOfManufacture: '07/2026',
      consumerCareDetails: '', // Missing customer care
      fssaiLicenseNumber: '123456', // Invalid FSSAI
    },
    images: [],
  },
  unverified_atta: {
    metadata: {
      productName: 'Organic Whole Wheat Sharbati Atta 5kg',
      barcode: '8909876543210',
      category: 'Food',
      scannedAt: new Date().toISOString(),
    },
    extractedFields: {
      mrp: '₹ 320.00 (incl. of all taxes)',
      netQuantity: '5 kg',
      unitSalePrice: '₹ 0.064/g',
      manufacturerName: 'Nature Pure Foods Pvt Ltd',
      countryOfOrigin: 'India',
      monthYearOfManufacture: '',
      consumerCareDetails: '',
      fssaiLicenseNumber: '10019011006543',
    },
    images: [],
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
  return null
}

function calculateUspStats(declaredNetQty, declaredMrp, declaredUsp) {
  if (!declaredNetQty || !declaredMrp || declaredNetQty === 'N/A' || declaredMrp === 'N/A') {
    return { calculatedStatutoryUsp: null, matchStatus: 'UNKNOWN', message: 'Insufficient Net Qty / MRP data for USP calculation.' }
  }

  const mrpMatch = String(declaredMrp).replace(/,/g, '').match(/(?:₹|RS|INR)?\s*([\d.]+)/i)
  const mrpValue = mrpMatch ? parseFloat(mrpMatch[1]) : null

  const netQtyMatch = String(declaredNetQty).replace(/,/g, '').match(/([\d.]+)\s*([a-zA-Z]+)/)
  const qtyVal = netQtyMatch ? parseFloat(netQtyMatch[1]) : null
  const qtyUnit = netQtyMatch ? netQtyMatch[2].toLowerCase() : ''

  if (!mrpValue || !qtyVal || mrpValue <= 0 || qtyVal <= 0) {
    return { calculatedStatutoryUsp: null, matchStatus: 'UNKNOWN', message: 'Unable to parse numeric MRP or Net Qty.' }
  }

  let totalGramsOrMl = null
  let displayUnit = 'g'

  if (qtyUnit === 'g' || qtyUnit === 'gm' || qtyUnit === 'grams') {
    totalGramsOrMl = qtyVal
    displayUnit = 'g'
  } else if (qtyUnit === 'kg' || qtyUnit === 'kgs') {
    totalGramsOrMl = qtyVal * 1000
    displayUnit = 'g'
  } else if (qtyUnit === 'ml') {
    totalGramsOrMl = qtyVal
    displayUnit = 'ml'
  } else if (qtyUnit === 'l' || qtyUnit === 'liter' || qtyUnit === 'litres') {
    totalGramsOrMl = qtyVal * 1000
    displayUnit = 'ml'
  }

  if (!totalGramsOrMl) {
    return { calculatedStatutoryUsp: null, matchStatus: 'UNKNOWN', message: `Unit '${qtyUnit}' does not require g/ml USP.` }
  }

  const perUnitCost = mrpValue / totalGramsOrMl
  const calculatedStatutoryUsp = `₹${perUnitCost.toFixed(3)}/${displayUnit}`

  if (!declaredUsp || declaredUsp === 'N/A' || declaredUsp.trim() === '') {
    return {
      calculatedStatutoryUsp,
      declaredUspDisplay: 'Missing / Not Declared',
      matchStatus: 'MISSING',
      message: `Statutory mandate requires USP = ${calculatedStatutoryUsp}, but package label lacks per-unit pricing.`,
    }
  }

  const declMatch = String(declaredUsp).match(/([\d.]+)/)
  const declVal = declMatch ? parseFloat(declMatch[1]) : null

  const isMatched = declVal && Math.abs(declVal - perUnitCost) < 0.05

  return {
    calculatedStatutoryUsp,
    declaredUspDisplay: declaredUsp,
    matchStatus: isMatched ? 'MATCHED' : 'MISMATCHED',
    message: isMatched
      ? `Declared USP (${declaredUsp}) matches statutory calculation (${calculatedStatutoryUsp}).`
      : `Declared USP (${declaredUsp}) differs from statutory calculation (${calculatedStatutoryUsp}).`,
  }
}

export default function Compliance() {
  const location = useLocation()
  const navigate = useNavigate()

  const rawScanData = location.state?.scanData || resolveScanInputData(location.state)

  const [activeScanData, setActiveScanData] = useState(rawScanData)
  const [selectedCategory, setSelectedCategory] = useState(() => rawScanData?.metadata?.category || 'Food')
  const [activeFilterTab, setActiveFilterTab] = useState('all')

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
  const [verdictSelection, setVerdictSelection] = useState(COMPLIANCE_STATUS.VERIFIED)

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

  const handleLoadSampleCommodity = (scenarioKey) => {
    const sample = SAMPLE_COMMODITIES[scenarioKey]
    if (!sample) return
    setActiveScanData(sample)
    setSelectedCategory(sample.metadata.category)
    const adapted = adaptScanToCompliance(sample)
    const evaluated = evaluateDeclarations(
      adapted.declarations,
      sample.metadata.category,
      adapted.scanMetadata,
      adapted.inspectionId,
      sample.metadata.productName
    )
    setAuditResult(evaluated)
    setActiveFilterTab('all')
  }

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

  const handleExportNoticeData = () => {
    if (!auditResult) return
    const summary = generateInspectionSummary(auditResult)
    const noticePayload = {
      inspectionId: auditResult.inspectionId,
      noticeType: 'SECTION_36_NON_COMPLIANCE',
      statutoryAct: 'Section 36(1) of Legal Metrology Act, 2009',
      compoundingFee: '₹ 25,000',
      commodityName: activeScanData?.metadata?.productName || 'Inspected Commodity',
      barcode: activeScanData?.metadata?.barcode || 'N/A',
      violations: summary.violations || [],
      issuedAt: new Date().toISOString(),
    }
    try {
      sessionStorage.setItem('pclmcs.notice_payload', JSON.stringify(noticePayload))
    } catch (err) {
      console.warn('Could not save notice payload to sessionStorage:', err)
    }

    const targetRoute = ROUTES.NOTICES || '/notices'
    navigate(targetRoute, { state: { noticePayload } })
  }

  const getBadgeProps = (status) => {
    switch (status) {
      case COMPLIANCE_STATUS.VERIFIED:
      case 'COMPLIANT':
        return { tone: 'success', label: 'Verified Compliant', color: '#059669' }
      case COMPLIANCE_STATUS.WARNING:
        return { tone: 'warning', label: 'Warning', color: '#ea580c' }
      case COMPLIANCE_STATUS.VERIFICATION_REQUIRED:
      case 'PENDING':
        return { tone: 'warning', label: 'Verification Required', color: '#d97706' }
      case COMPLIANCE_STATUS.POTENTIAL_NON_COMPLIANCE:
      case 'NON_COMPLIANT':
        return { tone: 'danger', label: 'Non-Compliance (Violation)', color: '#dc2626' }
      default:
        return { tone: 'neutral', label: status, color: '#64748b' }
    }
  }

  const handleConfirmVerdictOverride = (ruleId, newStatus) => {
    setAuditResult((prev) => {
      if (!prev) return prev
      const updatedFindings = prev.findings.map((f) => {
        if (f.ruleId === ruleId) {
          return {
            ...f,
            status: newStatus,
            officerOverride: true,
            officerNote: officerDecisionNotes || 'Manually verified by inspecting officer.',
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

  const filteredFindings = useMemo(() => {
    if (!auditResult?.findings) return []
    if (activeFilterTab === 'pending') {
      return auditResult.findings.filter(
        (f) =>
          f.status === COMPLIANCE_STATUS.VERIFICATION_REQUIRED ||
          f.status === COMPLIANCE_STATUS.WARNING
      )
    }
    if (activeFilterTab === 'verified') {
      return auditResult.findings.filter((f) => f.status === COMPLIANCE_STATUS.VERIFIED)
    }
    if (activeFilterTab === 'violations') {
      return auditResult.findings.filter(
        (f) => f.status === COMPLIANCE_STATUS.POTENTIAL_NON_COMPLIANCE
      )
    }
    return auditResult.findings
  }, [auditResult, activeFilterTab])

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
          title="Statutory Product Inspection Terminal"
          description="Inspect commodity package declarations against Legal Metrology Rules."
        />

        <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
          <Alert tone="warning" title="No active scan found. Select a sample commodity to test immediately.">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginTop: '0.75rem' }}>
              <span>Load a pre-configured sample commodity or scan a physical package.</span>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <Button variant="secondary" size="small" onClick={() => handleLoadSampleCommodity('compliant_salt')}>
                  Load Compliant Salt
                </Button>
                <Button variant="secondary" size="small" onClick={() => handleLoadSampleCommodity('non_compliant_tea')}>
                  Load Non-Compliant Tea
                </Button>
                <Button variant="primary" icon="camera" onClick={() => navigate(ROUTES.SCAN || '/scan')}>
                  Open Scanner
                </Button>
              </div>
            </div>
          </Alert>
        </div>

        <Card style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
          <EmptyState
            icon="barcode"
            title="No commodity loaded."
            description="No active product scan data found. Please select a sample commodity above or scan a package to begin inspection."
            action={
              <Button variant="primary" icon="camera" onClick={() => navigate(ROUTES.SCAN || '/scan')}>
                Scan Commodity Package
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
  const countryOfOrigin =
    activeScanData.extractedFields?.countryOfOrigin || activeScanData.countryOfOrigin || 'N/A'

  const imagePreviewUrl =
    activeScanData.images?.[0]?.url ||
    activeScanData.images?.[0]?.preview ||
    activeScanData.image ||
    activeScanData.imageUrl ||
    null

  const totalRulesCount = auditResult.findings.length
  const verifiedCount = auditResult.summary.verified
  const pendingCount = auditResult.summary.verificationRequired + auditResult.summary.warnings
  const violationsCount = auditResult.summary.potentialNonCompliance
  const passRate = Math.round((verifiedCount / (totalRulesCount || 1)) * 100)

  // Overall Health Score Ring calculation out of 100
  let healthScore = Math.round((verifiedCount / (totalRulesCount || 1)) * 100)
  if (violationsCount > 0 && healthScore > 65) {
    healthScore = 65
  }

  const healthScoreTone =
    violationsCount > 0
      ? { color: '#dc2626', bg: '#fee2e2', border: '#fca5a5', text: 'High Risk of Section 36 Action' }
      : pendingCount > 0
      ? { color: '#d97706', bg: '#fef3c7', border: '#fcd34d', text: 'Action Needed' }
      : { color: '#059669', bg: '#d1fae5', border: '#6ee7b7', text: 'Fully Compliant' }

  const uspCalculation = calculateUspStats(declaredNetQty, declaredMrp, declaredUsp)

  const pendingBadgePill = (
    <span
      style={{
        fontSize: '0.75rem',
        fontWeight: 600,
        backgroundColor: '#fef3c7',
        color: '#b45309',
        padding: '2px 8px',
        borderRadius: '4px',
        border: '1px solid #fcd34d',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
      }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
      <span>Pending Verification</span>
    </span>
  )

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
      <Breadcrumb
        items={[
          { to: ROUTES.DASHBOARD, label: 'Dashboard' },
          { to: ROUTES.SCAN, label: 'Scan Product' },
          { label: 'Compliance Inspection' },
        ]}
      />

      {/* Top Header Actions & Demo Commodity Selector Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <PageHeader
            overline="Government of India · Department of Consumer Affairs · Legal Metrology Wing"
            title="Statutory Product Inspection Terminal"
            subtitle={`Session ID: ${auditResult.inspectionId} | Commodity: ${productName}`}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Load Sample Commodity Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Demo Mode:</span>
            <select
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  handleLoadSampleCommodity(e.target.value)
                  e.target.value = ''
                }
              }}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#0A2540',
                cursor: 'pointer',
              }}
            >
              <option value="" disabled>Load Sample Commodity...</option>
              <option value="compliant_salt">✔ Tata Salt 1kg (Compliant)</option>
              <option value="non_compliant_tea">✖ Premium Tea 500g (USP Violation)</option>
              <option value="unverified_atta">⚠ Multigrain Atta 5kg (Unverified)</option>
            </select>
          </div>

          {/* Dynamic Notice Generation Button */}
          {violationsCount > 0 ? (
            <button
              type="button"
              onClick={handleExportNoticeData}
              style={{
                padding: '9px 16px',
                backgroundColor: '#dc2626',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 6px -1px rgba(220, 38, 38, 0.3)',
                animation: 'pulse 2s infinite',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              <span>Generate Sec. 36(1) Notice (₹25,000)</span>
            </button>
          ) : (
            <Button variant="secondary" size="medium" onClick={handleExportNoticeData}>
              Export Notice Data
            </Button>
          )}

          <button
            type="button"
            onClick={handleSaveInspection}
            style={{
              padding: '10px 20px',
              backgroundColor: '#0A2540',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 6px -1px rgba(10, 37, 64, 0.25)',
              transition: 'all 0.15s ease',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            <span>Save Inspection & Issue Report</span>
          </button>
        </div>
      </div>

      {/* Executive Inspected Commodity Manifest (Inspection Docket Header) */}
      <div
        style={{
          marginBottom: '1.5rem',
          padding: '1.25rem 1.5rem',
          borderRadius: '12px',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderLeft: '4px solid #0A2540',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}
      >
        {/* Left Column: Commodity Dossier with Hover Zoom / SVG Fallback */}
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flex: 1, minWidth: '320px' }}>
          <div style={{ flexShrink: 0, position: 'relative' }}>
            {imagePreviewUrl ? (
              <div
                style={{
                  width: '85px',
                  height: '85px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  border: '1px solid #cbd5e1',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                  cursor: 'pointer',
                }}
                title="Hover or click to inspect packaging evidence"
              >
                <img
                  src={imagePreviewUrl}
                  alt="Packaged Commodity Evidence"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.25s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.15)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1.0)' }}
                />
              </div>
            ) : (
              <div
                style={{
                  width: '85px',
                  height: '85px',
                  borderRadius: '10px',
                  background: '#f8fafc',
                  border: '1px dashed #94a3b8',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0A2540',
                  padding: '6px',
                  textAlign: 'center',
                }}
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#0A2540" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                <span style={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', color: '#0A2540', marginTop: '4px' }}>
                  Physical Package Mode
                </span>
              </div>
            )}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: '#0A2540', letterSpacing: '0.08em', background: '#eff6ff', padding: '2px 8px', borderRadius: '4px', border: '1px solid #bfdbfe' }}>
                INSPECTION DOCKET
              </span>
              <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontSize: '0.78rem', background: '#f1f5f9', color: '#334155', padding: '2.5px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 600, letterSpacing: '0.05em' }}>
                BARCODE: {barcode !== 'N/A' ? barcode : pendingBadgePill}
              </span>
              {activeScanData.metadata?.scannedAt && (
                <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontSize: '0.75rem', color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  <span>{new Date(activeScanData.metadata.scannedAt).toLocaleTimeString()}</span>
                </span>
              )}
            </div>

            <h2 style={{ margin: '0.15rem 0 0.4rem 0', fontSize: '1.25rem', color: '#0f172a', fontWeight: 700 }}>
              {productName}
            </h2>
          </div>
        </div>

        {/* Center: Overall Compliance Health Score Ring Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: healthScoreTone.bg, padding: '0.75rem 1.15rem', borderRadius: '10px', border: `1px solid ${healthScoreTone.border}` }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: healthScoreTone.color, color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem', fontFamily: 'ui-monospace, monospace', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            {healthScore}
          </div>
          <div>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: healthScoreTone.color, letterSpacing: '0.05em', display: 'block' }}>
              Compliance Health Score
            </span>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: healthScoreTone.color, marginTop: '2px' }}>
              Score: {healthScore}/100 · {healthScoreTone.text}
            </div>
          </div>
        </div>

        {/* Right Column: Statutory Quick Metrics Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', flex: 1, minWidth: '300px' }}>
          <div style={{ background: '#f8fafc', padding: '0.65rem 0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <span style={{ display: 'block', color: '#64748b', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Declared MRP</span>
            <div style={{ marginTop: '0.2rem', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
              {declaredMrp !== 'N/A' ? declaredMrp : pendingBadgePill}
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '0.65rem 0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <span style={{ display: 'block', color: '#64748b', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Net Quantity</span>
            <div style={{ marginTop: '0.2rem', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
              {declaredNetQty !== 'N/A' ? declaredNetQty : pendingBadgePill}
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '0.65rem 0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <span style={{ display: 'block', color: '#64748b', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Declared USP</span>
            <div style={{ marginTop: '0.2rem', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
              {declaredUsp !== 'N/A' ? declaredUsp : pendingBadgePill}
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '0.65rem 0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <span style={{ display: 'block', color: '#64748b', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Packer / Origin</span>
            <div style={{ marginTop: '0.2rem', fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={declaredManufacturer}>
              {declaredManufacturer !== 'N/A' ? declaredManufacturer : pendingBadgePill}
            </div>
          </div>
        </div>
      </div>

      {/* Executive Metric Summary Cards (Interactive Status Tiles) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
        {/* Verified Tile */}
        <div
          onClick={() => setActiveFilterTab('verified')}
          style={{
            padding: '1.25rem',
            borderRadius: '12px',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderTop: '3px solid #059669',
            boxShadow: activeFilterTab === 'verified' ? '0 0 0 2px #059669, 0 4px 6px -1px rgba(0,0,0,0.05)' : '0 4px 6px -1px rgba(0, 0, 0, 0.04)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verified</span>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#059669', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', lineHeight: 1.1, marginTop: '0.35rem' }}>
              {verifiedCount}
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#047857', marginTop: '0.35rem' }}>
              Pass Rate: {passRate}%
            </div>
          </div>
          <div style={{ background: '#d1fae5', padding: '8px', borderRadius: '50%', color: '#059669' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
        </div>

        {/* Verification Required Tile */}
        <div
          onClick={() => setActiveFilterTab('pending')}
          style={{
            padding: '1.25rem',
            borderRadius: '12px',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderTop: '3px solid #d97706',
            boxShadow: activeFilterTab === 'pending' ? '0 0 0 2px #d97706, 0 4px 6px -1px rgba(0,0,0,0.05)' : '0 4px 6px -1px rgba(0, 0, 0, 0.04)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verification Required</span>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#d97706', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', lineHeight: 1.1, marginTop: '0.35rem' }}>
              {auditResult.summary.verificationRequired}
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#b45309', marginTop: '0.35rem' }}>
              Manual Audit Needed
            </div>
          </div>
          <div style={{ background: '#fef3c7', padding: '8px', borderRadius: '50%', color: '#d97706' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          </div>
        </div>

        {/* Warnings Tile */}
        <div
          onClick={() => setActiveFilterTab('pending')}
          style={{
            padding: '1.25rem',
            borderRadius: '12px',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderTop: '3px solid #ea580c',
            boxShadow: activeFilterTab === 'pending' ? '0 0 0 2px #ea580c, 0 4px 6px -1px rgba(0,0,0,0.05)' : '0 4px 6px -1px rgba(0, 0, 0, 0.04)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Warnings</span>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ea580c', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', lineHeight: 1.1, marginTop: '0.35rem' }}>
              {auditResult.summary.warnings}
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#c2410c', marginTop: '0.35rem' }}>
              Review Recommended
            </div>
          </div>
          <div style={{ background: '#ffedd5', padding: '8px', borderRadius: '50%', color: '#ea580c' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
          </div>
        </div>

        {/* Non-Compliance Tile */}
        <div
          onClick={() => setActiveFilterTab('violations')}
          style={{
            padding: '1.25rem',
            borderRadius: '12px',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderTop: '3px solid #dc2626',
            boxShadow: activeFilterTab === 'violations' ? '0 0 0 2px #dc2626, 0 4px 6px -1px rgba(0,0,0,0.05)' : '0 4px 6px -1px rgba(0, 0, 0, 0.04)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Non-Compliance</span>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#dc2626', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', lineHeight: 1.1, marginTop: '0.35rem' }}>
              {violationsCount}
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#b91c1c', marginTop: '0.35rem' }}>
              Sec. 36(1) Violations
            </div>
          </div>
          <div style={{ background: '#fee2e2', padding: '8px', borderRadius: '50%', color: '#dc2626' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
          </div>
        </div>
      </div>

      {/* Sticky Action Bar & Segmented Category Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem', padding: '0.85rem 1.25rem', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0A2540' }}>
              Rule Set:
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
                fontWeight: 600,
                color: '#0f172a',
                cursor: 'pointer',
              }}
            >
              <option value="General">General Commodity (Standard Rule 6)</option>
              <option value="Food">Food & Beverages (FSSAI Rules)</option>
              <option value="Electronics">Electronics & IT Goods (BIS / CRS Rules)</option>
            </select>
          </div>

          <div style={{ height: '24px', width: '1px', background: '#cbd5e1' }} />

          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setActiveFilterTab('all')}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: activeFilterTab === 'all' ? '#0A2540' : '#cbd5e1',
                backgroundColor: activeFilterTab === 'all' ? '#0A2540' : '#ffffff',
                color: activeFilterTab === 'all' ? '#ffffff' : '#475569',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              All Rules ({totalRulesCount})
            </button>

            <button
              type="button"
              onClick={() => setActiveFilterTab('pending')}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: activeFilterTab === 'pending' ? '#d97706' : '#cbd5e1',
                backgroundColor: activeFilterTab === 'pending' ? '#d97706' : '#ffffff',
                color: activeFilterTab === 'pending' ? '#ffffff' : '#475569',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Pending Action ({pendingCount})
            </button>

            <button
              type="button"
              onClick={() => setActiveFilterTab('verified')}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: activeFilterTab === 'verified' ? '#059669' : '#cbd5e1',
                backgroundColor: activeFilterTab === 'verified' ? '#059669' : '#ffffff',
                color: activeFilterTab === 'verified' ? '#ffffff' : '#475569',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Verified ({verifiedCount})
            </button>

            <button
              type="button"
              onClick={() => setActiveFilterTab('violations')}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: activeFilterTab === 'violations' ? '#dc2626' : '#cbd5e1',
                backgroundColor: activeFilterTab === 'violations' ? '#dc2626' : '#ffffff',
                color: activeFilterTab === 'violations' ? '#ffffff' : '#475569',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Violations ({violationsCount})
            </button>
          </div>
        </div>
      </div>

      {/* Refactored 3-Column Enforcement Rule 6 Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem' }}>
        {filteredFindings.length === 0 ? (
          <Card style={{ padding: '2.5rem', textAlign: 'center' }}>
            <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
              No statutory declaration checks match the active filter (<strong>{activeFilterTab}</strong>).
            </p>
          </Card>
        ) : (
          filteredFindings.map((finding) => {
            const badge = getBadgeProps(finding.status)
            const isUspRule = finding.ruleId === 'rule_6_1_h_usp' || finding.field === 'unitSalePrice'

            return (
              <div
                key={finding.ruleId}
                style={{
                  border: '1px solid #e2e8f0',
                  borderLeft: `4px solid ${badge.color}`,
                  borderRadius: '12px',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.03)',
                  overflow: 'hidden',
                }}
              >
                {/* Header Row */}
                <div
                  style={{
                    padding: '0.85rem 1.35rem',
                    borderBottom: '1px solid #f1f5f9',
                    backgroundColor: '#fafafa',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                      {finding.ruleName}
                    </h3>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        backgroundColor: '#f1f5f9',
                        color: '#0A2540',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        border: '1px solid #cbd5e1',
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {(finding.legalReference || 'Rule 6').toUpperCase()} · PCR 2011
                    </span>
                    <StatusBadge tone={badge.tone} label={badge.label} />
                    {finding.officerOverride && (
                      <span style={{ fontSize: '0.75rem', background: '#e0e7ff', color: '#3730a3', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                        Officer Overridden
                      </span>
                    )}
                  </div>

                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                    Penal Section: <strong style={{ color: '#b91c1c' }}>{finding.penalSection || 'Sec. 36(1)'}</strong>
                  </span>
                </div>

                {/* 3-Column Side-by-Side Enforcement Layout */}
                <div
                  style={{
                    padding: '1.15rem 1.35rem',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '1.25rem',
                    alignItems: 'stretch',
                  }}
                >
                  {/* Left Column: Rule & Statutory Mandate */}
                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ display: 'block', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: '#0A2540', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>
                        Statutory Rule & Mandate
                      </span>
                      <div style={{ fontSize: '0.85rem', color: '#1e293b', fontWeight: 600, marginBottom: '0.4rem' }}>
                        {finding.ruleName}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.45 }}>
                        {finding.statutoryDirective || 'Mandatory declaration under Rule 6 of Legal Metrology (Packaged Commodities) Rules, 2011.'}
                      </div>
                    </div>

                    <div style={{ marginTop: '0.85rem', paddingTop: '0.65rem', borderTop: '1px solid #e2e8f0', fontSize: '0.75rem', color: '#64748b' }}>
                      <strong style={{ color: '#334155' }}>Status Finding: </strong>
                      {finding.message}
                    </div>
                  </div>

                  {/* Center Column: Observed OCR Extraction vs Standard + USP Calculation Panel */}
                  <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.06em' }}>
                          Observed Packaging Value (OCR)
                        </span>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#059669', background: '#d1fae5', padding: '1px 6px', borderRadius: '4px' }}>
                          AI Confidence: {finding.extractedValue ? '96%' : 'N/A'}
                        </span>
                      </div>

                      {finding.extractedValue ? (
                        <code style={{ display: 'block', background: '#f1f5f9', padding: '8px 12px', borderRadius: '6px', fontSize: '0.88rem', color: '#0f172a', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', border: '1px solid #cbd5e1', wordBreak: 'break-word' }}>
                          {finding.extractedValue}
                        </code>
                      ) : (
                        <div style={{ background: '#fff1f2', color: '#be123c', padding: '8px 12px', borderRadius: '6px', fontSize: '0.82rem', fontStyle: 'italic', border: '1px solid #fecdd3' }}>
                          [Pending OCR Capture / Declaration Missing]
                        </div>
                      )}
                    </div>

                    {/* Dedicated Auto-Calculated Statutory USP Box for Rule 6(1)(h) */}
                    {isUspRule && (
                      <div
                        style={{
                          background: uspCalculation.matchStatus === 'MATCHED' ? '#f0fdf4' : '#fef2f2',
                          border: `1px solid ${uspCalculation.matchStatus === 'MATCHED' ? '#bbf7d0' : '#feccae'}`,
                          borderRadius: '8px',
                          padding: '0.75rem',
                          marginTop: '0.2rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: uspCalculation.matchStatus === 'MATCHED' ? '#166534' : '#991b1b' }}>
                            Auto-Calculated Statutory USP
                          </span>
                          {uspCalculation.matchStatus === 'MATCHED' ? (
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#15803d', background: '#dcfce7', padding: '2px 6px', borderRadius: '4px' }}>
                              ✔ Statutory Match
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#b91c1c', background: '#fee2e2', padding: '2px 6px', borderRadius: '4px' }}>
                              ✖ Violation / Mismatch
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: '0.82rem', fontFamily: 'ui-monospace, monospace', color: '#0f172a', fontWeight: 600 }}>
                          Calculated: <strong style={{ color: '#0A2540' }}>{uspCalculation.calculatedStatutoryUsp || 'N/A'}</strong> | Declared: <strong style={{ color: '#334155' }}>{uspCalculation.declaredUspDisplay || 'Missing'}</strong>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.25rem' }}>
                          {uspCalculation.message}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Status & Officer Review Action */}
                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ display: 'block', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
                        Enforcement Status
                      </span>
                      <StatusBadge tone={badge.tone} label={badge.label} />
                      <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.78rem', color: '#64748b', lineHeight: 1.35 }}>
                        Click below to adjust physical verdict, record inspection notes, or flag for Sec. 36 penalty.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setOfficerDecisionNotes(finding.officerNote || '')
                        setVerdictSelection(finding.status || COMPLIANCE_STATUS.VERIFIED)
                        setActivePanelFinding(finding)
                      }}
                      style={{
                        marginTop: '1rem',
                        width: '100%',
                        padding: '10px 16px',
                        backgroundColor: '#0A2540',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        boxShadow: '0 2px 4px rgba(10, 37, 64, 0.2)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span>Review & Verify</span>
                      <span>➔</span>
                    </button>
                  </div>
                </div>

                {finding.officerNote && (
                  <div style={{ padding: '0.65rem 1.35rem', background: '#eff6ff', borderTop: '1px solid #bfdbfe', fontSize: '0.85rem', color: '#1e40af' }}>
                    <strong>Officer Physical Inspection Remarks: </strong>{finding.officerNote}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Interactive Officer Review Modal / Drawer */}
      {activePanelFinding && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(10, 37, 64, 0.65)',
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
              borderRadius: '14px',
              maxWidth: '640px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
              border: '1px solid #cbd5e1',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ padding: '1.25rem 1.5rem', backgroundColor: '#0A2540', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#93c5fd', letterSpacing: '0.08em' }}>
                  STATUTORY ENFORCEMENT MODAL
                </span>
                <h3 style={{ margin: '0.15rem 0 0 0', fontSize: '1.15rem', fontWeight: 700 }}>
                  Officer Verification — {activePanelFinding.ruleName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActivePanelFinding(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.6rem', cursor: 'pointer', color: '#ffffff', lineHeight: 1 }}
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.15rem', maxHeight: '72vh', overflowY: 'auto' }}>
              {/* Statutory Citation Card */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Governing Citation</span>
                    <div style={{ fontWeight: 700, color: '#0A2540', fontSize: '0.9rem', fontFamily: 'ui-monospace, monospace' }}>
                      {activePanelFinding.legalReference || 'Rule 6 · PCR 2011'}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Penal Section</span>
                    <div style={{ color: '#b91c1c', fontWeight: 700, fontSize: '0.9rem', fontFamily: 'ui-monospace, monospace' }}>
                      {activePanelFinding.penalSection || 'Section 36(1) of LM Act'}
                    </div>
                  </div>
                </div>

                <div style={{ paddingTop: '0.5rem', borderTop: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Statutory Directive</span>
                  <div style={{ color: '#334155', fontSize: '0.85rem', lineHeight: 1.45, marginTop: '2px' }}>
                    {activePanelFinding.statutoryDirective}
                  </div>
                </div>

                {activePanelFinding.extractedValue && (
                  <div style={{ paddingTop: '0.5rem', borderTop: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Extracted OCR Label Value</span>
                    <div style={{ background: '#ffffff', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', color: '#0f172a', fontFamily: 'ui-monospace, monospace', fontSize: '0.85rem', marginTop: '2px' }}>
                      {activePanelFinding.extractedValue}
                    </div>
                  </div>
                )}
              </div>

              {/* Verdict Radio Selection Panel */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#0A2540', marginBottom: '0.5rem' }}>
                  Select Inspection Verdict:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem' }}>
                  <label
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: `2px solid ${verdictSelection === COMPLIANCE_STATUS.VERIFIED ? '#059669' : '#e2e8f0'}`,
                      backgroundColor: verdictSelection === COMPLIANCE_STATUS.VERIFIED ? '#f0fdf4' : '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: '#047857',
                    }}
                  >
                    <input
                      type="radio"
                      name="verdict"
                      value={COMPLIANCE_STATUS.VERIFIED}
                      checked={verdictSelection === COMPLIANCE_STATUS.VERIFIED}
                      onChange={() => setVerdictSelection(COMPLIANCE_STATUS.VERIFIED)}
                    />
                    <span>Verified Compliant</span>
                  </label>

                  <label
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: `2px solid ${verdictSelection === COMPLIANCE_STATUS.POTENTIAL_NON_COMPLIANCE ? '#dc2626' : '#e2e8f0'}`,
                      backgroundColor: verdictSelection === COMPLIANCE_STATUS.POTENTIAL_NON_COMPLIANCE ? '#fef2f2' : '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: '#b91c1c',
                    }}
                  >
                    <input
                      type="radio"
                      name="verdict"
                      value={COMPLIANCE_STATUS.POTENTIAL_NON_COMPLIANCE}
                      checked={verdictSelection === COMPLIANCE_STATUS.POTENTIAL_NON_COMPLIANCE}
                      onChange={() => setVerdictSelection(COMPLIANCE_STATUS.POTENTIAL_NON_COMPLIANCE)}
                    />
                    <span>Non-Compliant (Violation)</span>
                  </label>

                  <label
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: `2px solid ${verdictSelection === COMPLIANCE_STATUS.VERIFICATION_REQUIRED ? '#d97706' : '#e2e8f0'}`,
                      backgroundColor: verdictSelection === COMPLIANCE_STATUS.VERIFICATION_REQUIRED ? '#fef3c7' : '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: '#b45309',
                    }}
                  >
                    <input
                      type="radio"
                      name="verdict"
                      value={COMPLIANCE_STATUS.VERIFICATION_REQUIRED}
                      checked={verdictSelection === COMPLIANCE_STATUS.VERIFICATION_REQUIRED}
                      onChange={() => setVerdictSelection(COMPLIANCE_STATUS.VERIFICATION_REQUIRED)}
                    />
                    <span>Verification Required</span>
                  </label>
                </div>
              </div>

              {/* Officer Remarks Textarea */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#374151', marginBottom: '0.35rem' }}>
                  Officer Physical Inspection Findings / Remarks:
                </label>
                <textarea
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                  placeholder="E.g., Physical package examined under magnifying lens: Customer care helpline 1800-209-4500 is embossed on back panel."
                  value={officerDecisionNotes}
                  onChange={(e) => setOfficerDecisionNotes(e.target.value)}
                />
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div style={{ padding: '1rem 1.5rem', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Button variant="secondary" size="medium" onClick={() => setActivePanelFinding(null)}>
                Cancel
              </Button>
              <button
                type="button"
                onClick={() => handleConfirmVerdictOverride(activePanelFinding.ruleId, verdictSelection)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#0A2540',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(10, 37, 64, 0.2)',
                }}
              >
                Confirm Verdict & Recalculate Score
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}