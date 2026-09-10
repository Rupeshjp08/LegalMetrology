// ============================================================================
// Member 5 - PDF Compliance Report Service
// ----------------------------------------------------------------------------
// This service is the SINGLE data-access layer for the Compliance Report page.
// All sample report data lives here so the UI components never hardcode values.
//
// CURRENT STATE: Uses temporary SAMPLE DATA purely for UI testing.
// LATER: Replace the implementations below with real MongoDB / Express API
// calls. The exported shapes follow the future backend contract so the UI
// components do NOT need to change.
//
// Expected Future API (Node.js/Express + MongoDB):
//   GET /api/reports/:id -> report data
//   (shape shown in `SAMPLE_REPORT` below)
// ============================================================================

export const API_BASE_URL = '/api/reports'

// ----------------------------------------------------------------------------
// SAMPLE REPORT DATA (UI testing only - replace with backend fetch)
// ----------------------------------------------------------------------------

const SAMPLE_REPORT = {
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
    score: 41,
    status: 'Major Violation',
    violations: [
      'MRP printed on label does not match the declared maximum retail price.',
      'Net quantity declaration is missing the "e" mark (FSSAI standard).',
      'Manufacturing and best-before dates are not printed legibly.',
    ],
    findings: [
      'Product label was scanned and OCR analysis completed successfully.',
      'MRP, net quantity and consumer care contact details were extracted for verification.',
      'Declared MRP exceeds the permitted maximum retail price for similar category.',
      'The label does not comply with Rule 6 (Declarations) of the Legal Metrology (Packaged Commodities) Rules, 2011.',
    ],
    recommendations: [
      'Manufacturer should reprint the label with corrected MRP as per the declared price list.',
      'Ensure the "e" mark and net quantity are printed as per standards of weights and measures.',
      'Print manufacturing and best-before dates clearly on the primary label.',
      'Re-scan the product after corrective action to verify compliance.',
    ],
  },
}

// ----------------------------------------------------------------------------
// Data-access functions
// ----------------------------------------------------------------------------

export function getReport() {
  return SAMPLE_REPORT
}

export function getReportById(_reportId) {
  // UI testing: return the same sample report regardless of id.
  return SAMPLE_REPORT
}

// ----------------------------------------------------------------------------
// Async wrappers (future-proofing): when the backend is ready these become
// real fetch() calls returning the same shape.
// ----------------------------------------------------------------------------

export async function getReportAsync() {
  return Promise.resolve(SAMPLE_REPORT)
}

export async function getReportByIdAsync(_reportId) {
  return Promise.resolve(getReportById(_reportId))
}