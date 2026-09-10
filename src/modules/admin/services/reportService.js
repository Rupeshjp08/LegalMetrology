import { getInspectionRecords, getRecordById } from './scanHistoryStore.js'

export function getReportList() {
  return getInspectionRecords()
}

export function getReportById(id) {
  return getRecordById(id)
}

export function buildReport(record) {
  if (!record) return null

  const verdict = record.statutoryVerdict || {}
  const counts = verdict.summaryCounts || {}
  const report = {
    reportId: record.id,
    scanDate: record.scanDateTime,
    category: record.category,
    productName: record.productName,
    complianceScore: record.complianceScore,
    status: record.status,
    overallStatus: verdict.overallStatus || '',
    isCompliant: Boolean(verdict.isCompliant),
    actionRequired: verdict.actionRequired || 'NONE',
    compoundableUnderSection49: Boolean(verdict.compoundableUnderSection49),
    compoundingSectionReference: verdict.compoundingSectionReference || '',
    summaryCounts: counts,
    violations: record.violationsList,
    officerAuditTrail: record.officerAuditTrail,
  }

  return report
}