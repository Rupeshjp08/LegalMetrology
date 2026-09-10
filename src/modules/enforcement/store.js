import { ENFORCEMENT_STATUS, STORAGE_KEY } from './constants'
import { MOCK_NOTIFICATIONS } from './mockData'

/**
 * In-memory / localStorage backed store for Member 4.
 *
 * Mirrors the subscribe + version pattern used elsewhere in the app so
 * pages re-render when records change. No backend is wired yet – data is
 * seeded from mock data and persisted to localStorage for the UI preview.
 */

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

function readAll() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    if (Array.isArray(parsed)) return parsed
  } catch {
    // fall through to mock seed
  }
  return null
}

function writeAll(records) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch {
    // storage unavailable – keep working in memory only
  }
}

function load() {
  const stored = readAll()
  if (stored) return stored
  writeAll(MOCK_NOTIFICATIONS)
  return MOCK_NOTIFICATIONS
}

export function getNotifications() {
  return load()
    .slice()
    .sort((a, b) => String(b.notice?.date || '').localeCompare(String(a.notice?.date || '')))
}

export function getNotification(id) {
  if (!id) return null
  return load().find((record) => record.id === id) || null
}

export function updateNotification(id, patch) {
  const records = load()
  const index = records.findIndex((record) => record.id === id)
  if (index === -1) return null

  const current = records[index]
  const updated = { ...current, ...patch }

  const historyEvent = patch.historyEvent
  const enriched = { ...updated }
  delete enriched.historyEvent

  if (historyEvent) {
    enriched.history = [...(current.history || []), historyEvent]
  }

  records[index] = enriched
  writeAll(records)
  emitChange()
  return enriched
}

export function sendNotification(id) {
  const record = getNotification(id)
  if (!record) return null

  const today = new Date().toISOString().slice(0, 10)
  return updateNotification(id, {
    status: ENFORCEMENT_STATUS.PENDING_RESPONSE,
    notice: {
      ...record.notice,
      reference: record.notice?.reference || `LM/PAC/2026/CN-${String(id).slice(-3)}`,
      date: today,
      dueDate: record.notice?.dueDate || today,
    },
    historyEvent: {
      status: ENFORCEMENT_STATUS.PENDING_RESPONSE,
      at: today,
      note: 'Notification issued / re-issued to the company.',
    },
  })
}

export function submitResponse(id, { type, message, date }) {
  const record = getNotification(id)
  if (!record) return null

  const today = new Date().toISOString().slice(0, 10)
  return updateNotification(id, {
    status: ENFORCEMENT_STATUS.RESPONSE_SUBMITTED,
    response: {
      type: type || null,
      message: message || '',
      date: date || today,
      submittedAt: today,
    },
    historyEvent: {
      status: ENFORCEMENT_STATUS.RESPONSE_SUBMITTED,
      at: today,
      note: 'Company submitted its response to the notification.',
    },
  })
}

export function scheduleReinspection(id, { date, officerName }) {
  const record = getNotification(id)
  if (!record) return null

  const today = new Date().toISOString().slice(0, 10)
  return updateNotification(id, {
    status: ENFORCEMENT_STATUS.REINSPECTION_SCHEDULED,
    reinspection: {
      ...(record.reinspection || {}),
      date: date || '',
      officerName: officerName || '',
      scheduledAt: today,
    },
    historyEvent: {
      status: ENFORCEMENT_STATUS.REINSPECTION_SCHEDULED,
      at: today,
      note: 'Re-inspection scheduled.',
    },
  })
}

export function submitReinspectionResult(id, { result, remarks }) {
  const record = getNotification(id)
  if (!record) return null

  const compliant = result === 'compliant'
  const status = compliant
    ? ENFORCEMENT_STATUS.COMPLIANT
    : ENFORCEMENT_STATUS.VIOLATION_CONFIRMED
  const today = new Date().toISOString().slice(0, 10)

  return updateNotification(id, {
    status,
    reinspection: {
      ...(record.reinspection || {}),
      result: result || '',
      remarks: remarks || '',
      completedAt: today,
    },
    historyEvent: {
      status,
      at: today,
      note: compliant
        ? 'Re-inspection confirmed compliance.'
        : 'Violation confirmed on re-inspection.',
    },
  })
}

export function closeCase(id) {
  const record = getNotification(id)
  if (!record) return null

  const today = new Date().toISOString().slice(0, 10)
  return updateNotification(id, {
    status: ENFORCEMENT_STATUS.CASE_CLOSED,
    historyEvent: {
      status: ENFORCEMENT_STATUS.CASE_CLOSED,
      at: today,
      note: 'Case closed after resolution.',
    },
  })
}

export function resetData() {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
  emitChange()
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === null || event.key === STORAGE_KEY) {
      emitChange()
    }
  })
}