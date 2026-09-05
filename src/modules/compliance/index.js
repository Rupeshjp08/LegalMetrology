// src/modules/compliance/index.js
export { runComplianceAudit } from './engine/complianceEngine.js';
export { COMPLIANCE_STATUS, ACTION_PRIORITY, GENERAL_RULES } from './rules/generalRules.js';
export { selectApplicableRules } from './selector/ruleSelector.js';