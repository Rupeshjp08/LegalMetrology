export const INSPECTIONS_STORAGE_KEY = 'pclmcs.inspections'

export const STATUS_OPTIONS = ['compliant', 'non-compliant', 'pending', 'warning']

const listeners = new Set()
let version = 0

export function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getVersion() {
  return version
}

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

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === null || event.key === INSPECTIONS_STORAGE_KEY) {
      emitChange()
    }
  })
}

export function deriveStatus(verdict) {
  const counts = verdict?.summaryCounts || {}
  if ((counts.potentialNonCompliance || 0) > 0) return 'non-compliant'
  if ((counts.warnings || 0) > 0) return 'warning'
  if ((counts.verificationRequired || 0) > 0) return 'pending'
  return 'compliant'
}

export function complianceScore(verdict) {
  const counts = verdict?.summaryCounts || {}
  const total = ['verified', 'warnings', 'verificationRequired', 'potentialNonCompliance'].reduce(
    (sum, key) => sum + (counts[key] || 0),
    0,
  )
  if (!total) return 100
  return Math.round(((counts.verified || 0) / total) * 100)
}

function formatScanDateTime(iso) {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function readRaw() {
  try {
    const raw = window.localStorage.getItem(INSPECTIONS_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function normalize(record) {
  const meta = record?.inspectionMetadata || {}
  const verdict = record?.statutoryVerdict || {}
  const violations = Array.isArray(record?.violations) ? record.violations : []

  return {
    id: meta.inspectionId || '',
    productName: meta.productName || 'Packaged Commodity',
    category: meta.category || 'General',
    scannedAt: meta.timestamp || '',
    scanDateKey: String(meta.timestamp || '').slice(0, 10),
    scanDateTime: formatScanDateTime(meta.timestamp),
    status: deriveStatus(verdict),
    complianceScore: complianceScore(verdict),
    violations: violations.length,
    violationsList: violations,
    statutoryVerdict: verdict,
    officerAuditTrail: Array.isArray(record?.officerAuditTrail) ? record.officerAuditTrail : [],
  }
}

export function getInspectionRecords() {
  return readRaw()
    .map(normalize)
    .filter((record) => Boolean(record.id))
    .sort((a, b) => String(b.scannedAt).localeCompare(String(a.scannedAt)))
}

export function getRecordById(id) {
  if (!id) return null
  return getInspectionRecords().find((record) => record.id === id) || null
}

export function getOverview() {
  const records = getInspectionRecords()
  const total = records.length
  const compliantProducts = records.filter((record) => record.status === 'compliant').length
  const violations = records.filter((record) =>
    ['non-compliant', 'warning'].includes(record.status),
  ).length
  const pendingReviews = records.filter((record) => record.status === 'pending').length
  const complianceRate = total ? Math.round((compliantProducts / total) * 100) : 0

  return {
    totalScans: total,
    compliantProducts,
    violations,
    pendingReviews,
    complianceRate,
  }
}

export function getRecentRecords(limit = 8) {
  return getInspectionRecords().slice(0, limit)
}

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

export function getComplianceOverview() {
  const monthly = new Map()

  getInspectionRecords().forEach((record) => {
    const key = String(record.scannedAt).slice(0, 7)
    if (!/^\d{4}-\d{2}$/.test(key)) return
    const entry = monthly.get(key) || {
      month: key,
      compliant: 0,
      warning: 0,
      nonCompliant: 0,
      pending: 0,
    }
    const column = record.status === 'non-compliant' ? 'nonCompliant' : record.status
    if (Object.prototype.hasOwnProperty.call(entry, column)) entry[column] += 1
    monthly.set(key, entry)
  })

  return [...monthly.values()]
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6)
    .map((entry) => ({
      month: `${MONTH_LABELS[Number(entry.month.slice(5, 7)) - 1]} ${entry.month.slice(2, 4)}`,
      compliant: entry.compliant,
      minorIssue: entry.warning,
      majorViolation: entry.nonCompliant,
      pending: entry.pending,
    }))
}

export const PAGE_SIZE = 8

export function getHistory({ page = 1, pageSize = PAGE_SIZE, filters = {} } = {}) {
  const search = String(filters.search || '').trim().toLowerCase()
  const status = filters.status || ''
  const date = filters.date || ''

  const filtered = getInspectionRecords().filter((record) => {
    if (search && !record.productName.toLowerCase().includes(search) && !record.id.toLowerCase().includes(search)) {
      return false
    }
    if (status && record.status !== status) {
      return false
    }
    if (date && !record.scanDateKey.startsWith(date)) {
      return false
    }
    return true
  })

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = (safePage - 1) * pageSize

  return {
    records: filtered.slice(start, start + pageSize),
    page: safePage,
    pageSize,
    total,
    totalPages,
  }
}