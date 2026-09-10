// ============================================================================
// Member 5 - Analytics Service
// ----------------------------------------------------------------------------
// Single data-access layer for the Analytics page. Every summary number and
// chart value is COMPUTED from the shared scan data store
// (src/member5/shared/scanDataService.js) - the same source of truth that
// Scan History and the Admin Dashboard read from. No hardcoded values.
//
// If the store is empty, hasAnalyticsData() returns false so the page can show
// "No analytics data available".
//
// LATER: switch getAnalyticsData to a real Express/MongoDB call
//   GET /api/analytics -> analyticsData (identical shape)
// ============================================================================

import {
  getScanRecords,
  VIOLATION_STATUSES,
} from '../shared/scanDataService.js'

export const API_BASE_URL = '/api/analytics'

// Maps a record's violationType to the Violation Analysis chart keys.
export const VIOLATION_CATEGORY_KEYS = {
  'MRP Declaration': 'mrp',
  'Net Quantity': 'netQuantity',
  'Manufacturer Details': 'manufacturerDetails',
  'Country of Origin': 'countryOfOrigin',
  'Consumer Care Details': 'consumerCare',
  'Date of Packing': 'dateOfPacking',
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// ----------------------------------------------------------------------------
// Derived data (computed from the real scan history store)
// ----------------------------------------------------------------------------

function getViolationsBreakdown(records) {
  const breakdown = {
    mrp: 0,
    netQuantity: 0,
    manufacturerDetails: 0,
    countryOfOrigin: 0,
    consumerCare: 0,
    dateOfPacking: 0,
    other: 0,
  }

  records.forEach((record) => {
    if (!VIOLATION_STATUSES.includes(record.status)) return
    const key = VIOLATION_CATEGORY_KEYS[record.violationType] || 'other'
    breakdown[key] += 1
  })

  return breakdown
}

function getDailyCount(records, day) {
  const dateKey = day.toISOString().slice(0, 10)
  return records.filter((record) =>
    String(record.scanDateTime || '').startsWith(dateKey)
  ).length
}

// Last 7 days (calendar), including today - dynamic labels + real counts.
function getScanTrend(records) {
  const labels = []
  const values = []

  for (let i = 6; i >= 0; i -= 1) {
    const day = new Date()
    day.setDate(day.getDate() - i)
    labels.push(DAY_NAMES[day.getDay()])
    values.push(getDailyCount(records, day))
  }

  return { labels, values }
}

function getTrendPercent(current, previous) {
  if (!previous) return '0%'
  const diff = Math.round(((current - previous) / previous) * 100)
  return `${diff >= 0 ? '+' : '-'}${Math.abs(diff)}%`
}

export function getAnalyticsData() {
  const records = getScanRecords()

  const totalScans = records.length
  const compliant = records.filter((record) => record.status === 'Compliant').length
  const minorIssue = records.filter((record) => record.status === 'Minor Issue').length
  const majorViolation = records.filter(
    (record) => record.status === 'Major Violation'
  ).length
  const pending = records.filter((record) => record.status === 'Pending').length
  const violations = minorIssue + majorViolation

  const todayKey = new Date().toISOString().slice(0, 10)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayKey = yesterday.toISOString().slice(0, 10)

  const dayRecords = (dayKey) =>
    records.filter((record) => String(record.scanDateTime || '').startsWith(dayKey))
  const countStatus = (list, status) =>
    list.filter((record) => record.status === status).length

  const todayRecords = dayRecords(todayKey)
  const yesterdayRecords = dayRecords(yesterdayKey)

  const rate = totalScans > 0 ? Math.round((compliant / totalScans) * 100) : 0

  return {
    summary: {
      totalScans,
      compliant,
      violations,
      pending,
      trends: {
        totalScans: getTrendPercent(todayRecords.length, yesterdayRecords.length),
        compliant: getTrendPercent(
          countStatus(todayRecords, 'Compliant'),
          countStatus(yesterdayRecords, 'Compliant')
        ),
        violations: getTrendPercent(
          todayRecords.filter((r) => VIOLATION_STATUSES.includes(r.status)).length,
          yesterdayRecords.filter((r) => VIOLATION_STATUSES.includes(r.status)).length
        ),
        pending: getTrendPercent(
          countStatus(todayRecords, 'Pending'),
          countStatus(yesterdayRecords, 'Pending')
        ),
      },
    },
    compliance: {
      compliant,
      minorIssue,
      majorViolation,
      pending,
    },
    violations: getViolationsBreakdown(records),
    scanTrend: getScanTrend(records),
    complianceRate: { rate },
  }
}

// Returns true when the data object has meaningful values (for UI guards).
export function hasAnalyticsData(data) {
  if (!data || typeof data !== 'object') return false
  if (!data.summary) return false
  return data.summary.totalScans > 0
}

// ----------------------------------------------------------------------------
// Async wrappers (future-proofing): becomes a real fetch() to the backend.
// ----------------------------------------------------------------------------

export async function getAnalyticsDataAsync() {
  return Promise.resolve(getAnalyticsData())
}