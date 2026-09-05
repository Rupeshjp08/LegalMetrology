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
      // Pass declarations directly for multi-field cross verification
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