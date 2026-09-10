// src/modules/compliance/index.js
export { runComplianceAudit, evaluateDeclarations } from './engine/complianceEngine.js';
export { generateInspectionSummary } from './export/inspectionExporter.js';
export { COMPLIANCE_STATUS, ACTION_PRIORITY, GENERAL_RULES } from './rules/generalRules.js';
export { CATEGORY_RULES, FOOD_RULES, ELECTRONICS_RULES, COSMETICS_RULES } from './rules/categoryRules.js';
export { selectApplicableRules } from './selector/ruleSelector.js';
export { adaptScanResult, adaptScanToCompliance } from './adapter/scanAdapter.js';



