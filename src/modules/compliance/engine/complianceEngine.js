// src/modules/compliance/engine/complianceEngine.js
import { selectApplicableRules } from '../selector/ruleSelector.js';
import * as Evaluators from '../evaluators/declarationEvaluators.js';
import { COMPLIANCE_STATUS, ACTION_PRIORITY } from '../rules/generalRules.js';

export function runComplianceAudit(scanPayload) {
  const { inspectionId, product = {}, scanMetadata = {}, declarations = {} } = scanPayload || {};
  const applicableRules = selectApplicableRules(product.category);

  const findings = [];
  const summary = {
    verified: 0,
    warnings: 0,
    verificationRequired: 0,
    potentialNonCompliance: 0
  };

  applicableRules.forEach((rule) => {
    const fieldData = declarations[rule.field];
    const evaluatorFn = Evaluators[rule.evaluator];

    let result;
    if (typeof evaluatorFn === 'function') {
      result = rule.field === 'unitSalePrice'
        ? evaluatorFn(declarations, scanMetadata)
        : evaluatorFn(fieldData, scanMetadata);
    } else {
      result = {
        status: COMPLIANCE_STATUS.VERIFICATION_REQUIRED,
        priority: ACTION_PRIORITY.MANUAL_VERIFICATION,
        message: 'No evaluator configured for this declaration check.',
        recommendedAction: 'OFFICER_REVIEW'
      };
    }

    if (result.status === COMPLIANCE_STATUS.VERIFIED) summary.verified++;
    else if (result.status === COMPLIANCE_STATUS.WARNING) summary.warnings++;
    else if (result.status === COMPLIANCE_STATUS.VERIFICATION_REQUIRED) summary.verificationRequired++;
    else if (result.status === COMPLIANCE_STATUS.POTENTIAL_NON_COMPLIANCE) summary.potentialNonCompliance++;

    findings.push({
      ruleId: rule.ruleId,
      ruleName: rule.ruleName,
      field: rule.field,
      legalReference: rule.legalReference,
      penalSection: rule.penalSection,
      statutoryDirective: rule.statutoryDirective,
      status: result.status,
      priority: result.priority,
      message: result.message,
      recommendedAction: result.recommendedAction,
      extractedValue: fieldData?.rawText || null
    });
  });

  let overallStatus = COMPLIANCE_STATUS.VERIFIED;
  let nextAction = 'FINALIZE_COMPLIANCE';

  if (summary.potentialNonCompliance > 0) {
    overallStatus = COMPLIANCE_STATUS.POTENTIAL_NON_COMPLIANCE;
    nextAction = 'OFFICER_REVIEW_REQUIRED';
  } else if (summary.verificationRequired > 0) {
    overallStatus = COMPLIANCE_STATUS.VERIFICATION_REQUIRED;
    nextAction = 'OFFICER_MANUAL_VERIFICATION';
  } else if (summary.warnings > 0) {
    overallStatus = COMPLIANCE_STATUS.WARNING;
    nextAction = 'OFFICER_WARNING_REVIEW';
  }

  return {
    inspectionId: inspectionId || `INS-${Date.now()}`,
    productName: product.name || 'Unknown Packaged Commodity',
    category: product.category || 'General',
    overallStatus,
    nextAction,
    summary,
    findings
  };
}

/**
 * Formats compliance findings into a clean, serializable summary payload 
 * ready for PDF generation and notice serving by the reports module.
 * 
 * @param {Object} auditResult - The compliance audit result returned by `runComplianceAudit` (or officer modified).
 * @returns {Object} Clean, serializable inspection summary payload.
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

  const totalRulesChecked = findings.length;
  const verifiedCount = summary.verified || 0;
  const warningsCount = summary.warnings || 0;
  const verificationRequiredCount = summary.verificationRequired || 0;
  const violationsCount = summary.potentialNonCompliance || 0;

  const complianceScore = totalRulesChecked > 0 
    ? Math.round((verifiedCount / totalRulesChecked) * 100) 
    : 0;

  const overallStatus = result.overallStatus || COMPLIANCE_STATUS.VERIFICATION_REQUIRED;
  const isCompliant = overallStatus === COMPLIANCE_STATUS.VERIFIED;
  const noticeRequired = violationsCount > 0 || warningsCount > 0;

  // Filter specific findings for notices and reports
  const violations = findings
    .filter((f) => f.status === COMPLIANCE_STATUS.POTENTIAL_NON_COMPLIANCE || f.status === COMPLIANCE_STATUS.WARNING)
    .map((f) => ({
      ruleId: f.ruleId,
      ruleName: f.ruleName,
      field: f.field,
      legalReference: f.legalReference,
      penalSection: f.penalSection,
      statutoryDirective: f.statutoryDirective,
      status: f.status,
      severity: f.status === COMPLIANCE_STATUS.POTENTIAL_NON_COMPLIANCE ? 'HIGH' : 'MEDIUM',
      message: f.message,
      capturedValue: f.extractedValue || null,
      officerNote: f.officerNote || null
    }));

  const officerOverrides = findings
    .filter((f) => Boolean(f.officerOverride))
    .map((f) => ({
      ruleId: f.ruleId,
      ruleName: f.ruleName,
      status: f.status,
      officerNote: f.officerNote || null
    }));

  // Notice details for reports module
  let noticeType = 'CERTIFICATE_OF_COMPLIANCE';
  if (violationsCount > 0) {
    noticeType = 'NOTICE_OF_VIOLATION_SECTION_36';
  } else if (warningsCount > 0) {
    noticeType = 'STATUTORY_ADVISORY_NOTICE';
  } else if (verificationRequiredCount > 0) {
    noticeType = 'PHYSICAL_INSPECTION_ORDER';
  }

  return {
    metadata: {
      inspectionId: result.inspectionId || `INS-${Date.now()}`,
      productName: result.productName || 'Unknown Packaged Commodity',
      category: result.category || 'General',
      generatedAt: new Date().toISOString(),
      overallStatus,
      nextAction: result.nextAction || 'PENDING',
      complianceScore,
      isCompliant,
      noticeRequired
    },
    statutorySummary: {
      totalRulesChecked,
      verifiedCount,
      warningsCount,
      verificationRequiredCount,
      violationsCount
    },
    violations,
    officerOverrides,
    fullFindings: findings.map((f) => ({
      ruleId: f.ruleId,
      ruleName: f.ruleName,
      field: f.field,
      legalReference: f.legalReference,
      status: f.status,
      priority: f.priority,
      message: f.message,
      extractedValue: f.extractedValue || null,
      officerOverride: Boolean(f.officerOverride),
      officerNote: f.officerNote || null
    })),
    noticeMetadata: {
      noticeType,
      issuingAuthority: 'Department of Consumer Affairs — Legal Metrology Inspectorate',
      applicableAct: 'Legal Metrology Act, 2009 & Legal Metrology (Packaged Commodities) Rules, 2011',
      legalValidity: 'Official Inspection Summary for PDF Generation & Statutory Notice Serving'
    }
  };
}