import { ENFORCEMENT_STATUS } from './constants'
import { MOCK_NOTIFICATIONS } from './mockData'

/**
 * Member 4 data store (frontend sample data).
 *
 * Serves the Company Notifications / Response / Re-inspection pages from the
 * frontend sample register in `mockData.js`. Keeps the original
 * `subscribe + version` pub/sub contract used by `useEnforcementData` so every
 * mutation re-fetches the updated records.
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

const freshStart = () => MOCK_NOTIFICATIONS.map((record) => structuredClone(record))

let records = freshStart()

function findRecord(id) {
  const record = records.find((item) => item.id === id)
  if (!record) {
    throw new Error(`Notification ${id} not found.`)
  }
  return record
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function nowISO() {
  return new Date().toISOString()
}

function pushHistory(record, status, note) {
  record.history = record.history || []
  record.history.push({ status, at: todayISO(), note })
}

export async function getNotifications() {
  return records.map((record) => ({ ...record }))
}

export async function getNotification(id) {
  if (!id) return null
  const record = records.find((item) => item.id === id)
  return record ? { ...record } : null
}

export async function sendNotification(id) {
  const record = findRecord(id)
  record.status = ENFORCEMENT_STATUS.PENDING_RESPONSE
  pushHistory(record, ENFORCEMENT_STATUS.PENDING_RESPONSE, 'Show-cause notice issued / re-issued to the company.')
  emitChange()
}

export async function submitResponse(id, { type, message, date }) {
  const record = findRecord(id)
  record.response = {
    type,
    message,
    date,
    submittedAt: nowISO(),
  }
  record.status = ENFORCEMENT_STATUS.RESPONSE_SUBMITTED
  pushHistory(record, ENFORCEMENT_STATUS.RESPONSE_SUBMITTED, 'Company submitted its response to the notification.')
  emitChange()
}

export async function scheduleReinspection(id, { date, officerName }) {
  const record = findRecord(id)
  record.reinspection = {
    ...record.reinspection,
    date,
    officerName,
    result: null,
    remarks: '',
    scheduledAt: nowISO(),
    completedAt: null,
  }
  record.status = ENFORCEMENT_STATUS.REINSPECTION_SCHEDULED
  pushHistory(record, ENFORCEMENT_STATUS.REINSPECTION_SCHEDULED, `Re-inspection scheduled for ${date}.`)
  emitChange()
}

export async function submitReinspectionResult(id, { result, remarks }) {
  const record = findRecord(id)
  const compliant = result === 'compliant'
  record.reinspection = {
    ...record.reinspection,
    date: record.reinspection?.date || todayISO(),
    officerName: record.reinspection?.officerName || record.inspection?.officer?.name || '',
    result,
    remarks,
    completedAt: nowISO(),
  }
  record.status = compliant ? ENFORCEMENT_STATUS.COMPLIANT : ENFORCEMENT_STATUS.VIOLATION_CONFIRMED
  pushHistory(
    record,
    record.status,
    compliant ? 'Re-inspection confirmed compliance with the rules.' : 'Re-inspection confirmed the violation persists.',
  )
  emitChange()
}

export async function closeCase(id) {
  const record = findRecord(id)
  record.status = ENFORCEMENT_STATUS.CASE_CLOSED
  pushHistory(record, ENFORCEMENT_STATUS.CASE_CLOSED, 'Case closed after review.')
  emitChange()
}

export function resetData() {
  records = freshStart()
  emitChange()
}