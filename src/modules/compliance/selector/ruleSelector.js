// src/modules/compliance/selector/ruleSelector.js
import { GENERAL_RULES } from '../rules/generalRules.js';
import { CATEGORY_RULES } from '../rules/categoryRules.js';

export function selectApplicableRules(productCategory = 'General') {
  // Base: All packaged goods must comply with Rule 6 general declarations
  const applicableRules = [...GENERAL_RULES];

  const category = (productCategory || '').trim().toLowerCase();

  if (CATEGORY_RULES[category]) {
    applicableRules.push(...CATEGORY_RULES[category]);
  } else {
    // Check for partial/alias match (e.g. "Food & Beverages" or "Cosmetic Products")
    for (const [catKey, rules] of Object.entries(CATEGORY_RULES)) {
      if (category.includes(catKey)) {
        applicableRules.push(...rules);
        break;
      }
    }
  }

  return applicableRules;
}