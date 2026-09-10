// ============================================================================
// Member 5 - Scan History Service
// ----------------------------------------------------------------------------
// Data-access layer for the Scan History page. ALL records come from the
// shared scan data store (src/member5/shared/scanDataService.js) - the single
// source of truth used by Scan History, Admin Dashboard and Analytics.
//
// No sample/seed data lives here. The store starts empty; records appear when
// the scanning/compliance workflow adds them (addScanRecord / addScan below).
//
// LATER: switch getHistory to a real Express/MongoDB call
//   GET /api/history?page=1&limit=10&search=&status=&from=&to=
//       -> { scans: [...], page, totalPages, total }
// The exported signatures stay the same so the UI does NOT change.
// ============================================================================

import { getScanRecords, addScanRecord } from '../shared/scanDataService.js'

export const API_BASE_URL = '/api/history'
export const PAGE_SIZE = 8

// ----------------------------------------------------------------------------
// Filtering + pagination (UI-side). Later these run on the backend.
// ----------------------------------------------------------------------------

export function getFilteredScans({ search = '', status = '', date = '' } = {}) {
  const query = search.trim().toLowerCase()

  return getScanRecords().filter((scan) => {
    if (query && !scan.productName.toLowerCase().includes(query)) {
      return false
    }
    if (status && scan.status !== status) {
      return false
    }
    if (date && !scan.scanDateTime.startsWith(date)) {
      return false
    }
    return true
  })
}

export function paginateScans(scans, page = 1, pageSize = PAGE_SIZE) {
  const total = scans.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = (safePage - 1) * pageSize
  const slice = scans.slice(start, start + pageSize)

  return {
    scans: slice,
    page: safePage,
    pageSize,
    total,
    totalPages,
  }
}

// ----------------------------------------------------------------------------
// Data-access helpers (future backend contract)
// ----------------------------------------------------------------------------

export function getHistory({ page = 1, pageSize = PAGE_SIZE, filters = {} } = {}) {
  const filtered = getFilteredScans(filters)
  return paginateScans(filtered, page, pageSize)
}

export function getStatusOptions() {
  return ['Compliant', 'Minor Issue', 'Major Violation', 'Pending']
}

/** Add a scan result to the shared store (used by the scanning workflow). */
export function addScan(record) {
  return addScanRecord(record)
}

// Async wrappers: future-proofing for when data is fetched from the backend.
export async function getHistoryAsync(params) {
  return Promise.resolve(getHistory(params))
}