import { ENFORCEMENT_STATUS } from './constants'

/**
 * Backend <-> frontend mapping for Member 4.
 *
 * The backend persists flat records with human-readable status / type /
 * result strings, while the frontend pages consume nested records keyed by
 * the kebab-case enforcement tokens. This adapter bridges both worlds so the
 * existing Member 4 UI can be fed directly from the API.
 */

const BACKEND_STATUS_TO_TOKEN = {
  'Pending Response': ENFORCEMENT_STATUS.PENDING_RESPONSE,
  'Response Submitted': ENFORCEMENT_STATUS.RESPONSE_SUBMITTED,
  'Re-inspection Scheduled': ENFORCEMENT_STATUS.REINSPECTION_SCHEDULED,
  Compliant: ENFORCEMENT_STATUS.COMPLIANT,
  'Violation Confirmed': ENFORCEMENT_STATUS.VIOLATION_CONFIRMED,
  'Case Closed': ENFORCEMENT_STATUS.CASE_CLOSED,
}

const TOKEN_TO_BACKEND_STATUS = Object.fromEntries(
  Object.entries(BACKEND_STATUS_TO_TOKEN).map(([k, v]) => [v, k]),
)

const BACKEND_TYPE_TO_TOKEN = {
  'Accept Violation': 'accept',
  'Dispute Violation': 'dispute',
  'Corrective Action Taken': 'corrective-action',
}

const TOKEN_TO_BACKEND_TYPE = Object.fromEntries(
  Object.entries(BACKEND_TYPE_TO_TOKEN).map(([k, v]) => [v, k]),
)

const BACKEND_RESULT_TO_TOKEN = {
  Compliant: 'compliant',
  'Still Violated': 'still-violated',
}

const TOKEN_TO_BACKEND_RESULT = Object.fromEntries(
  Object.entries(BACKEND_RESULT_TO_TOKEN).map(([k, v]) => [v, k]),
)

export const statusToToken = (status) => BACKEND_STATUS_TO_TOKEN[status] || status
export const tokenToStatus = (token) => TOKEN_TO_BACKEND_STATUS[token] || token
export const responseTypeToToken = (type) => BACKEND_TYPE_TO_TOKEN[type] || type
export const tokenToResponseType = (token) => TOKEN_TO_BACKEND_TYPE[token] || token
export const resultToToken = (result) => BACKEND_RESULT_TO_TOKEN[result] || result
export const tokenToResult = (token) => TOKEN_TO_BACKEND_RESULT[token] || token

/**
 * Builds the nested record shape the Member 4 pages render, from a flat
 * notification document returned by the backend.
 */
export function adaptNotification(doc) {
  if (!doc) return null

  const status = statusToToken(doc.status)

  return {
    _id: doc._id,
    id: doc._id,
    status,
    company: {
      name: doc.companyName,
      registrationNo: '',
      address: '',
      contactPerson: '',
      phone: '',
      email: '',
    },
    product: {
      name: doc.productName,
      category: '',
      productId: doc.productId,
      batchNumber: doc.batchNumber,
      mrp: '',
      netQuantity: '',
    },
    violation: {
      title: doc.violation,
      description: doc.violation,
      type: '',
      severity: '',
      penaltyProvision: '',
    },
    rule: {
      reference: doc.rule,
      actSection: '',
      category: '',
    },
    inspection: {
      id: '',
      date: doc.inspectionDate,
      place: '',
      officer: {
        name: doc.officerName,
        designation: '',
        department: '',
        badgeNo: '',
      },
    },
    notice: {
      reference: '',
      date: doc.noticeDate,
      dueDate: '',
    },
    response: null,
    reinspection: null,
    history: [],
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

/** Maps a company-response document into the nested `record.response` shape. */
export function adaptResponse(doc) {
  if (!doc) return null

  return {
    _id: doc._id,
    type: responseTypeToToken(doc.responseType),
    message: doc.responseMessage,
    date: doc.responseDate,
    submittedAt: doc.createdAt || doc.responseDate,
    status: doc.status,
  }
}

/** Maps a re-inspection document into the nested `record.reinspection` shape. */
export function adaptReinspection(doc) {
  if (!doc) return null

  return {
    _id: doc._id,
    date: doc.reInspectionDate,
    officerName: doc.officerName,
    result: resultToToken(doc.inspectionResult),
    remarks: doc.remarks,
    scheduledAt: doc.createdAt,
    completedAt: doc.updatedAt,
    status: statusToToken(doc.status),
  }
}

/**
 * Merges a notification with its latest related records (response +
 * re-inspection) into the full record shape the pages consume.
 */
export function mergeCase(notification, responses = [], reinspection = null) {
  if (!notification) return null

  const record = adaptNotification(notification)

  if (Array.isArray(responses) && responses.length > 0) {
    const latest = responses[0]
    record.response = adaptResponse(latest)
  }

  if (reinspection) {
    record.reinspection = adaptReinspection(reinspection)
  }

  record.history = [
    { status: record.status, at: record.createdAt, note: 'Notification recorded.' },
    ...(record.updatedAt && record.updatedAt !== record.createdAt
      ? [{ status: record.status, at: record.updatedAt, note: 'Record updated.' }]
      : []),
  ]

  return record
}