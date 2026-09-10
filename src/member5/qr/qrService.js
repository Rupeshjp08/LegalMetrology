// ============================================================================
// Member 5 - QR Verification Service
// ----------------------------------------------------------------------------
// Handles encoding, decoding and verifying the compliance report QR payload.
// The reportId is the main verification identifier (matches the PDF Report's
// reportId).
//
// CURRENT STATE: Uses temporary SAMPLE DATA purely for UI testing.
// LATER: Replace the implementations below with real MongoDB / Express API
// calls. The exported function signatures and return shapes are designed to
// match the future backend contract so the UI components do NOT need to change.
//
// Expected Future API (Node.js/Express + MongoDB):
//   POST /api/qr/verify   { reportId } -> verification result + report details
//   GET  /api/reports/:id -> report details (for cross-checking)
// ============================================================================

export const API_BASE_URL = '/api/qr'

// ----------------------------------------------------------------------------
// TEMPORARY SAMPLE DATA (UI testing only - replace with backend lookup)
// ----------------------------------------------------------------------------

// Registry of genuine compliance reports. reportId is the verification key.
const SAMPLE_REPORT_REGISTRY = {
  'RPT-2026-0857': {
    reportId: 'RPT-2026-0857',
    scanDate: '2026-09-08 09:42 AM',
    officer: 'Insp. Rajesh Kumar',
    product: {
      name: 'Amul Taaza Toned Milk',
      brand: 'Amul',
      netQuantity: '500 ml',
      mrp: 'Rs. 27.00',
      countryOfOrigin: 'India',
    },
    compliance: {
      score: 92,
      status: 'Compliant',
    },
  },
  'RPT-2026-0856': {
    reportId: 'RPT-2026-0856',
    scanDate: '2026-09-07 04:20 PM',
    officer: 'Insp. Rajesh Kumar',
    product: {
      name: 'Britannia Good Day',
      brand: 'Britannia',
      netQuantity: '200 g',
      mrp: 'Rs. 30.00',
      countryOfOrigin: 'India',
    },
    compliance: {
      score: 68,
      status: 'Minor Issue',
    },
  },
  'RPT-2026-0855': {
    reportId: 'RPT-2026-0855',
    scanDate: '2026-09-06 11:05 AM',
    officer: 'Insp. Meera Nair',
    product: {
      name: 'Fortune Sunflower Oil',
      brand: 'Fortune',
      netQuantity: '1 L',
      mrp: 'Rs. 155.00',
      countryOfOrigin: 'India',
    },
    compliance: {
      score: 95,
      status: 'Compliant',
    },
  },
}

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
// Verification (UI-side lookup on sample data; later runs on the backend)
// ----------------------------------------------------------------------------

export function verifyReportId(reportId) {
  const report = SAMPLE_REPORT_REGISTRY[reportId]

  if (!report) {
    return {
      valid: false,
      message: 'Invalid or unverified report.',
      report: null,
    }
  }

  return {
    valid: true,
    message: 'This report is genuine and verified from the official system.',
    report,
  }
}

export function verifyQrData(rawText) {
  const payload = decodeQrPayload(rawText)

  if (!payload || !payload.reportId) {
    return {
      valid: false,
      message: 'Invalid or unverified report.',
      report: null,
    }
  }

  return verifyReportId(payload.reportId)
}

// ----------------------------------------------------------------------------
// Data-access helpers (future backend contract)
// ----------------------------------------------------------------------------

export function getKnownReportIds() {
  return Object.keys(SAMPLE_REPORT_REGISTRY)
}

export function getSampleQrString() {
  // UI testing helper: the exact QR payload for a genuine report.
  const reportId = getKnownReportIds()[0]
  return encodeQrPayload(reportId)
}

// Async wrappers: future-proofing for when verification is a backend call.
export async function verifyQrDataAsync(rawText) {
  return Promise.resolve(verifyQrData(rawText))
}

export async function fetchReportDetailsAsync(_reportId) {
  // Later: GET /api/reports/:id from the backend.
  return Promise.resolve(SAMPLE_REPORT_REGISTRY)
}