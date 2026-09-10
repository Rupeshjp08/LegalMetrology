// ============================================================================
// Member 5 - Admin Dashboard Service
// ----------------------------------------------------------------------------
// Single data-access layer for the Admin Dashboard. Every statistic, table row
// and chart value is COMPUTED from the shared scan data store
// (src/member5/shared/scanDataService.js) - the same source of truth that
// Scan History reads from. There is no hardcoded/sample data in this file.
//
// Flow: team scans product -> result added to the shared store -> this service
// derives overview / recent scans / compliance chart from the store records.
//
// LATER: switch to real Express/MongoDB calls:
//   GET /api/dashboard/overview             -> dashboardOverview
//   GET /api/dashboard/recent-scans?limit=8 -> recentScans
//   GET /api/dashboard/compliance-overview  -> complianceOverview
// ============================================================================

import {
  getScanRecords,
  VIOLATION_STATUSES,
} from '../shared/scanDataService.js'

export const API_BASE_URL = '/api/dashboard'

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

// ----------------------------------------------------------------------------
// Derived data (computed from the real scan history store)
// ----------------------------------------------------------------------------

export function getDashboardOverview() {
  const records = getScanRecords()
  const totalScans = records.length

  const compliantProducts = records.filter((record) => record.status === 'Compliant').length
  const violations = records.filter((record) =>
    VIOLATION_STATUSES.includes(record.status)
  ).length
  const pendingReviews = records.filter((record) => record.status === 'Pending').length

  const complianceRate =
    totalScans > 0 ? Math.round((compliantProducts / totalScans) * 100) : 0

  return {
    totalScans,
    compliantProducts,
    violations,
    pendingReviews,
    complianceRate,
  }
}

export function getRecentScans(limit = 8) {
  return getScanRecords().slice(0, limit)
}

export function getComplianceOverview() {
  const monthly = new Map()

  getScanRecords().forEach((record) => {
    // scanDateTime format: 'YYYY-MM-DD HH:MM AM'
    const monthKey = String(record.scanDateTime || '').slice(0, 7)
    if (!/^\d{4}-\d{2}$/.test(monthKey)) return

    const entry = monthly.get(monthKey) || {
      month: monthKey,
      compliant: 0,
      minorIssue: 0,
      majorViolation: 0,
    }
    if (record.status === 'Compliant') entry.compliant += 1
    if (record.status === 'Minor Issue') entry.minorIssue += 1
    if (record.status === 'Major Violation') entry.majorViolation += 1
    monthly.set(monthKey, entry)
  })

  return [...monthly.values()]
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((entry) => ({
      month: MONTH_SHORT[Number(entry.month.slice(5, 7)) - 1],
      compliant: entry.compliant,
      minorIssue: entry.minorIssue,
      majorViolation: entry.majorViolation,
    }))
}

// ----------------------------------------------------------------------------
// Async wrappers (future-proofing): mirror what fetch() to the backend would
// return, so callers can migrate to `await getDashboardOverviewAsync()` later.
// ----------------------------------------------------------------------------

export async function getDashboardOverviewAsync() {
  return Promise.resolve(getDashboardOverview())
}

export async function getRecentScansAsync() {
  return Promise.resolve(getRecentScans())
}

export async function getComplianceOverviewAsync() {
  return Promise.resolve(getComplianceOverview())
}