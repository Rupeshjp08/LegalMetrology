// ============================================================================
// Member 5 - PDF Compliance Report Service
// ----------------------------------------------------------------------------
// Data-access layer for the Compliance Report page. Reads from the shared
// scan data store (scanDataService.js) which is the single source of truth.
// No hardcoded sample data — when the store is empty the page shows a
// "no data" state; when real scans exist they appear automatically.
//
// LATER: when the backend is ready, replace with real fetch() calls.
// The exported shapes follow the future backend contract so the UI
// components do NOT need to change.
//
// Expected Future API (Node.js/Express + MongoDB):
//   GET /api/reports/:id -> report data
// ============================================================================

import { getScanRecords, getChangeVersion, subscribe } from '../shared/scanDataService.js'

export const API_BASE_URL = '/api/reports'

// ----------------------------------------------------------------------------
// Helpers — convert a scan record into the report shape the UI expects
// ----------------------------------------------------------------------------

function scanToReport(record) {
  if (!record) return null
  return {
    reportId: record.id,
    scanDate: record.scanDateTime,
    officer: record.officer || '',
    product: {
      name: record.productName || '',
      brand: '',
      netQuantity: '',
      mrp: '',
      countryOfOrigin: 'India',
    },
    compliance: {
      score: record.complianceScore ?? 0,
      status: record.status || 'Pending',
      violations: record.violations > 0
        ? [`${record.violations} violation(s) detected — see Scan History for details.`]
        : [],
      findings: [],
      recommendations: record.status === 'Compliant'
        ? ['No action required — product is compliant.']
        : ['Review the scan history for details and take corrective action.'],
    },
  }
}

// ----------------------------------------------------------------------------
// Data-access functions
// ----------------------------------------------------------------------------

/** Returns the most recent scan as a report (for single-report views). */
export function getReport() {
  const records = getScanRecords()
  return scanToReport(records[0]) || scanToReport(null)
}

/** Look up a specific report by scan id. */
export function getReportById(reportId) {
  if (!reportId) return null
  const records = getScanRecords()
  const match = records.find((record) => record.id === reportId)
  return scanToReport(match)
}

// Expose change version / subscribe so the UI can react to store mutations.
export { getChangeVersion, subscribe }

// ----------------------------------------------------------------------------
// Async wrappers (future-proofing)
// ----------------------------------------------------------------------------

export async function getReportAsync() {
  return Promise.resolve(getReport())
}

export async function getReportByIdAsync(reportId) {
  return Promise.resolve(getReportById(reportId))
}