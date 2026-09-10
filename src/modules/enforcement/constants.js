/**
 * Member 4 – Company Notification / Response / Re-inspection
 * Status model, response types and shared lookup metadata.
 */

export const ENFORCEMENT_STATUS = {
  PENDING_RESPONSE: 'pending-response',
  RESPONSE_SUBMITTED: 'response-submitted',
  REINSPECTION_SCHEDULED: 're-inspection-scheduled',
  COMPLIANT: 'compliant',
  VIOLATION_CONFIRMED: 'violation-confirmed',
  CASE_CLOSED: 'case-closed',
}

export const STATUS_META = {
  [ENFORCEMENT_STATUS.PENDING_RESPONSE]: {
    label: 'Pending Response',
    tone: 'warning',
    description: 'Notification issued, awaiting the company response.',
  },
  [ENFORCEMENT_STATUS.RESPONSE_SUBMITTED]: {
    label: 'Response Submitted',
    tone: 'info',
    description: 'Company submitted its response to the notification.',
  },
  [ENFORCEMENT_STATUS.REINSPECTION_SCHEDULED]: {
    label: 'Re-inspection Scheduled',
    tone: 'info',
    description: 'A re-inspection date has been scheduled.',
  },
  [ENFORCEMENT_STATUS.COMPLIANT]: {
    label: 'Compliant',
    tone: 'success',
    description: 'Re-inspection confirmed compliance with the rules.',
  },
  [ENFORCEMENT_STATUS.VIOLATION_CONFIRMED]: {
    label: 'Violation Confirmed',
    tone: 'danger',
    description: 'Re-inspection confirmed the earlier violation persists.',
  },
  [ENFORCEMENT_STATUS.CASE_CLOSED]: {
    label: 'Case Closed',
    tone: 'neutral',
    description: 'Matter resolved and case closed.',
  },
}

export const RESPONSE_TYPES = {
  ACCEPT: 'accept',
  DISPUTE: 'dispute',
  CORRECTIVE_ACTION: 'corrective-action',
}

export const RESPONSE_TYPE_OPTIONS = [
  {
    value: RESPONSE_TYPES.ACCEPT,
    label: 'Accept Violation',
    description: 'Company admits the violation and will comply.',
  },
  {
    value: RESPONSE_TYPES.DISPUTE,
    label: 'Dispute Violation',
    description: 'Company contests the findings of the inspection.',
  },
  {
    value: RESPONSE_TYPES.CORRECTIVE_ACTION,
    label: 'Corrective Action Taken',
    description: 'Company states corrective action has been completed.',
  },
]

export const RESPONSE_TYPE_LABELS = RESPONSE_TYPE_OPTIONS.reduce(
  (acc, option) => {
    acc[option.value] = option.label
    return acc
  },
  {},
)

export const INSPECTION_RESULT_OPTIONS = [
  {
    value: 'compliant',
    label: 'Compliant',
    description: 'The commodity now meets the legal metrology requirements.',
  },
  {
    value: 'still-violated',
    label: 'Still Violated',
    description: 'The earlier violation persists after re-inspection.',
  },
]

export const STORAGE_KEY = 'pclmcs.enforcement.notifications'