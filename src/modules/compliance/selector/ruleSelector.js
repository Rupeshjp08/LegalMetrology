// src/modules/compliance/selector/ruleSelector.js
import { GENERAL_RULES } from '../rules/generalRules.js';

export function selectApplicableRules(productCategory = 'General') {
  // Base: All packaged goods must comply with Rule 6 general declarations
  const applicableRules = [...GENERAL_RULES];

  // Dynamically extensible for specific categories (e.g., Food, Electronics, Medical)
  const category = (productCategory || '').toLowerCase();
  if (category === 'food') {
    // Ready to attach food-specific clauses (e.g., best-before/use-by dates)
  }

  return applicableRules;
}