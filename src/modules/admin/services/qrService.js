import { getInspectionRecords } from './scanHistoryStore.js'

export function encodeQrPayload(reportId) {
  return JSON.stringify({ reportId })
}

export function decodeQrPayload(rawText) {
  if (!rawText || typeof rawText !== 'string') return null

  try {
    const parsed = JSON.parse(rawText)
    if (parsed && typeof parsed.reportId === 'string' && parsed.reportId.trim()) {
      return { reportId: parsed.reportId.trim() }
    }
  } catch {
    // Not valid JSON; fall through to plain-reportId handling.
  }

  if (rawText.trim().length > 0) {
    return { reportId: rawText.trim() }
  }

  return null
}

export function verifyReportId(reportId) {
  const hit = getInspectionRecords().find((record) => record.id === reportId)

  if (!hit) {
    return {
      valid: false,
      message: 'The report ID could not be verified against the compliance records.',
      report: null,
    }
  }

  return {
    valid: true,
    message: 'Report verified: this record is present in the official compliance system.',
    report: {
      reportId: hit.id,
      productName: hit.productName,
      category: hit.category,
      scanDate: hit.scanDateTime,
      complianceScore: hit.complianceScore,
      status: hit.status,
      violations: hit.violations,
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