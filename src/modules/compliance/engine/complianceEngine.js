// src/modules/compliance/engine/complianceEngine.js
import { selectApplicableRules } from '../selector/ruleSelector.js';
import * as Evaluators from '../evaluators/declarationEvaluators.js';
import { COMPLIANCE_STATUS, ACTION_PRIORITY } from '../rules/generalRules.js';
import { adaptScanResult } from '../adapter/scanAdapter.js';

export function evaluateDeclarations(declarations, category = 'General', scanMetadata = {}, inspectionId = null, productName = null) {
  let decls = declarations;
  let cat = category;
  let meta = scanMetadata;
  let id = inspectionId;
  let name = productName;

  if (declarations && typeof declarations === 'object' && declarations.declarations) {
    decls = declarations.declarations;
    if (declarations.product?.category) cat = category !== 'General' ? category : declarations.product.category;
    if (declarations.scanMetadata) meta = declarations.scanMetadata;
    if (declarations.inspectionId) id = declarations.inspectionId;
    if (declarations.product?.name) name = declarations.product.name;
  }

  const applicableRules = selectApplicableRules(cat);

  const findings = [];
  const summary = {
    verified: 0,
    warnings: 0,
    verificationRequired: 0,
    potentialNonCompliance: 0
  };

  applicableRules.forEach((rule) => {
    const fieldData = decls ? decls[rule.field] : undefined;
    const evaluatorFn = Evaluators[rule.evaluator];

    let result;
    if (typeof evaluatorFn === 'function') {
      result = rule.field === 'unitSalePrice'
        ? evaluatorFn(decls, meta)
        : evaluatorFn(fieldData, meta);
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
    inspectionId: id || `INS-${Date.now()}`,
    productName: name || 'Unknown Packaged Commodity',
    category: cat || 'General',
    overallStatus,
    nextAction,
    summary,
    findings
  };
}

export function runComplianceAudit(rawScanPayload) {
  const normalizedPayload = adaptScanResult(rawScanPayload);
  return evaluateDeclarations(normalizedPayload);
}

export { generateInspectionSummary } from '../export/inspectionExporter.js';
