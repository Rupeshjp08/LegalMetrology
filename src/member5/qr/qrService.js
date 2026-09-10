// ============================================================================
// Member 5 - QR Verification Service
// ----------------------------------------------------------------------------
// Handles encoding, decoding and verifying the compliance report QR payload.
// The reportId is the main verification identifier (matches the PDF Report's
// reportId).
//
// Reads from the shared scan data store (scanDataService.js) — no hardcoded
// sample data. When the store is empty verification will return "invalid";
// once real scans exist they are verified automatically.
//
// LATER: when the backend is ready, replace with real fetch() calls.
// The exported function signatures and return shapes are designed to
// match the future backend contract so the UI components do NOT change.
//
// Expected Future API (Node.js/Express + MongoDB):
//   POST /api/qr/verify   { reportId } -> verification result + report details
//   GET  /api/reports/:id -> report details (for cross-checking)
// ============================================================================

import { getScanRecords } from '../shared/scanDataService.js'

export const API_BASE_URL = '/api/qr'

// ----------------------------------------------------------------------------
// QR payload encode / decode
// ----------------------------------------------------------------------------

// Builds the JSON payload embedded in the QR code for a report.
export function buildQrPayload(reportId) {
  return { reportId }
}

// Encodes the payload into the string stored in the QR code.
export function encodeQrPayload(reportId) {
  return JSON.stringify(buildQrPayload(reportId))
}

// Parses raw QR text into a payload object. Returns null if not parseable.
export function decodeQrPayload(rawText) {
  if (!rawText || typeof rawText !== 'string') return null

  try {
    const parsed = JSON.parse(rawText)
    if (parsed && typeof parsed.reportId === 'string') {
      return parsed
    }
  } catch {
    // Not valid JSON; fall through to plain-reportId handling.
  }

  if (rawText.trim().length > 0) {
    return { reportId: rawText.trim() }
  }

  return null
}

// ----------------------------------------------------------------------------
// Verification — looks up scan records from the shared data store
// ----------------------------------------------------------------------------

export function verifyReportId(reportId) {
  if (!reportId) {
    return {
      valid: false,
      message: 'No report ID provided.',
      report: null,
    }
  }

  const records = getScanRecords()
  const match = records.find((record) => record.id === reportId)

  if (!match) {
    return {
      valid: false,
      message: 'The report ID could not be verified against the compliance records.',
      report: null,
    }
  }

  return {
    valid: true,
    message: 'This report is genuine and verified from the official system.',
    report: {
      reportId: match.id,
      scanDate: match.scanDateTime,
      officer: match.officer || '',
      product: {
        name: match.productName || '',
        brand: '',
        netQuantity: '',
        mrp: '',
        countryOfOrigin: 'India',
      },
      compliance: {
        score: match.complianceScore ?? 0,
        status: match.status || 'Pending',
      },
    },
  }
}

export function verifyQrData(rawText) {
  const payload = decodeQrPayload(rawText)

  if (!payload || !payload.reportId) {
    return {
      valid: false,
      message: 'The scanned code is not a valid compliance report QR code.',
      report: null,
    }
  }

  return verifyReportId(payload.reportId)
}

// ----------------------------------------------------------------------------
// Data-access helpers
// ----------------------------------------------------------------------------

/** Returns all known report IDs (for UI hints / test helpers). */
export function getKnownReportIds() {
  return getScanRecords().map((record) => record.id)
}

/** Builds a sample QR string from the latest scan record (UI testing helper). */
export function getSampleQrString() {
  const records = getScanRecords()
  if (records.length === 0) return ''
  return encodeQrPayload(records[0].id)
}

// ----------------------------------------------------------------------------
// Async wrappers (future-proofing)
// ----------------------------------------------------------------------------

export async function verifyQrDataAsync(rawText) {
  return Promise.resolve(verifyQrData(rawText))
}

export async function fetchReportDetailsAsync(reportId) {
  const records = getScanRecords()
  const match = records.find((record) => record.id === reportId)
  return match || null
}
