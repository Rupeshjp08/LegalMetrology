// ============================================================================
// Member 5 - Shared Scan Data Service (SINGLE SOURCE OF TRUTH)
// ----------------------------------------------------------------------------
// Every Member 5 screen that shows scan results reads from this ONE store:
//   - Scan History         (historyService delegates here)
//   - Admin Dashboard      (statistics, recent activity, compliance charts)
//   - Analytics            (summary, compliance, violations, scan trend)
//
// All scan records produced by the team's scanning / compliance workflow must
// be persisted through this service (addScanRecord / updateScanStatus) or
// written directly to localStorage under STORAGE_KEY. There is NO sample or
// seed data - the store starts empty so every number on the UI is derived.
//
// Storage: window.localStorage (key: member5_scan_history)
//   - Survives refresh
//   - Cross-tab sync via the browser 'storage' event
//   - Same-tab updates via a tiny pub/sub (subscribe/emitChange)
//
// LATER: when the backend exists, swap these helpers for Express/MongoDB calls
// (GET/POST /api/scans, PATCH /api/scans/:id/status). Keep the same exports so
// the UI layers do not need to change.
// ============================================================================

export const STORAGE_KEY = 'member5_scan_history'

// Statuses that count as a violation for dashboard/analytics purposes.
export const VIOLATION_STATUSES = ['Minor Issue', 'Major Violation']

// Allowed compliance statuses (must match the Scan History UI).
export const STATUS_OPTIONS = ['Compliant', 'Minor Issue', 'Major Violation', 'Pending']

// ----------------------------------------------------------------------------
// Change notifications (pub/sub) - lets Dashboard / History refresh live.
// ----------------------------------------------------------------------------

const listeners = new Set()
let version = 0

function emitChange() {
  version += 1
  listeners.forEach((listener) => {
    try {
      listener()
    } catch {
      // a listener must never break the store
    }
  })
}

/** Subscribe to store changes. Returns an unsubscribe function. */
export function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Monotonic version number - bumped on every mutation. */
export function getChangeVersion() {
  return version
}

// Cross-tab sync: when another tab writes to the same storage key, re-notify.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === null || event.key === STORAGE_KEY) {
      emitChange()
    }
  })
}

// ----------------------------------------------------------------------------
// Persistence helpers
// ----------------------------------------------------------------------------

function readAll() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(records) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch {
    // Storage unavailable (private mode / quota) - keep in-memory only.
  }
}

// Newest-first ordering based on scanDateTime ('YYYY-MM-DD HH:MM AM').
function sortNewestFirst(records) {
  return [...records].sort((a, b) =>
    String(b.scanDateTime || '').localeCompare(String(a.scanDateTime || ''))
  )
}

// ----------------------------------------------------------------------------
// Public API (read / write)
// ----------------------------------------------------------------------------

/** All scan records, newest first. */
export function getScanRecords() {
  return sortNewestFirst(readAll())
}

/** Add a new scan result and notify listeners (dashboard/history update). */
export function addScanRecord(record) {
  const normalized = normalizeRecord(record)
  const next = [normalized, ...readAll()]
  writeAll(next)
  emitChange()
  return normalized
}

/** Update the compliance status of an existing scan and notify listeners. */
export function updateScanStatus(id, status) {
  const records = readAll()
  const exists = records.some((record) => record.id === id)
  if (!exists) return false
  writeAll(records.map((record) => (record.id === id ? { ...record, status } : record)))
  emitChange()
  return true
}

/** Remove a single scan record and notify listeners. */
export function removeScanRecord(id) {
  const next = readAll().filter((record) => record.id !== id)
  writeAll(next)
  emitChange()
}

/** Wipe all scan records (danger zone). */
export function clearAllScans() {
  writeAll([])
  emitChange()
}

// ----------------------------------------------------------------------------
// Record normalisation
// ----------------------------------------------------------------------------

function generateScanId(records) {
  let max = 0
  records.forEach((record) => {
    const match = String(record.id || '').match(/SCN-(\d+)$/)
    if (match) max = Math.max(max, Number(match[1]))
  })
  return `SCN-${String(max + 1).padStart(5, '0')}`
}

function normalizeRecord(record = {}) {
  const existing = readAll()
  const status = STATUS_OPTIONS.includes(record.status) ? record.status : 'Pending'
  const isViolation = VIOLATION_STATUSES.includes(status)

  return {
    id: record.id || generateScanId(existing),
    productName: String(record.productName || ''),
    scanDateTime: record.scanDateTime || new Date().toLocaleString('en-IN'),
    complianceScore:
      typeof record.complianceScore === 'number' ? record.complianceScore : null,
    status,
    violations:
      isViolation && record.violations ? record.violations : isViolation ? 1 : 0,
    officer: String(record.officer || ''),
    violationType: record.violationType || 'Other',
  }
}

// Future backend contract (unused until an API exists).
export async function fetchScanRecords() {
  return Promise.resolve(getScanRecords())
}

export async function persistScanRecord(record) {
  return Promise.resolve(addScanRecord(record))
}