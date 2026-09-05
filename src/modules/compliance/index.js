// src/modules/compliance/index.js
export { runComplianceAudit, generateInspectionSummary } from './engine/complianceEngine.js';
export { COMPLIANCE_STATUS, ACTION_PRIORITY, GENERAL_RULES } from './rules/generalRules.js';
export { CATEGORY_RULES, FOOD_RULES, COSMETICS_RULES } from './rules/categoryRules.js';
export { selectApplicableRules } from './selector/ruleSelector.js';
export { adaptScanResult } from './adapter/scanAdapter.js';

