// src/modules/compliance/export/inspectionExporter.js
import { COMPLIANCE_STATUS } from '../rules/generalRules.js';

/**
 * Formats compliance findings into a standardized inspection handoff payload 
 * ready for Member 4 (PDF Reports) and Member 5 (Legal Notices & Compounding).
 * 
 * @param {Object} auditResult - The compliance audit result object returned by `runComplianceAudit` or updated by officer review.
 * @returns {Object} Consolidated inspection handoff payload.
 */
export function generateInspectionSummary(auditResult) {
  const result = auditResult && typeof auditResult === 'object' ? auditResult : {};
  const findings = Array.isArray(result.findings) ? result.findings : [];
  const summary = result.summary || {
    verified: 0,
    warnings: 0,
    verificationRequired: 0,
    potentialNonCompliance: 0
  };

  const potentialNonCompliance = summary.potentialNonCompliance || 0;
  const verificationRequired = summary.verificationRequired || 0;
  const warnings = summary.warnings || 0;

  // 1. Inspection Metadata
  const inspectionMetadata = {
    inspectionId: result.inspectionId || `INS-${Date.now()}`,
    productName: result.productName || 'Unknown Packaged Commodity',
    category: result.category || 'General',
    timestamp: new Date().toISOString()
  };

  // 2. Statutory Verdict
  const isCompliant = potentialNonCompliance === 0 && verificationRequired === 0;

  let actionRequired = 'NONE';
  if (potentialNonCompliance > 0 || warnings > 0) {
    actionRequired = 'NOTICE_ISSUANCE';
  } else if (verificationRequired > 0) {
    actionRequired = 'FIELD_RE_INSPECTION';
  }

  const compoundableUnderSection49 = potentialNonCompliance > 0 || warnings > 0;
  const compoundingSectionReference = 'Section 49 read with Section 36(1), Legal Metrology Act, 2009';

  const statutoryVerdict = {
    isCompliant,
    actionRequired,
    compoundableUnderSection49,
    compoundingSectionReference,
    overallStatus: result.overallStatus || (isCompliant ? COMPLIANCE_STATUS.VERIFIED : COMPLIANCE_STATUS.POTENTIAL_NON_COMPLIANCE),
    summaryCounts: {
      verified: summary.verified || 0,
      warnings: summary.warnings || 0,
      verificationRequired: summary.verificationRequired || 0,
      potentialNonCompliance: summary.potentialNonCompliance || 0
    }
  };

  // 3. Violations Ground Mapping
  const violations = findings
    .filter((f) => f.status === COMPLIANCE_STATUS.POTENTIAL_NON_COMPLIANCE || f.status === COMPLIANCE_STATUS.WARNING)
    .map((f) => ({
      rule: f.ruleName,
      actSection: f.penalSection,
      statutoryClause: f.legalReference,
      legalGrounds: f.message,
      capturedEvidence: f.extractedValue || null
    }));

  // 4. Officer Audit Trail
  const officerAuditTrail = findings
    .filter((f) => Boolean(f.officerOverride))
    .map((f) => ({
      ruleId: f.ruleId,
      finalStatus: f.status,
      officerNotes: f.officerNote || 'No explanation recorded',
      timestamp: new Date().toISOString()
    }));

  return {
    inspectionMetadata,
    statutoryVerdict,
    violations,
    officerAuditTrail
  };
}
