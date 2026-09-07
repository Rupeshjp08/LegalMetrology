// src/modules/compliance/selector/ruleSelector.js
import { GENERAL_RULES } from '../rules/generalRules.js';
import { FOOD_RULES, ELECTRONICS_RULES, COSMETICS_RULES } from '../rules/categoryRules.js';

export function selectApplicableRules(productCategory = 'General') {
  const applicableRules = [...GENERAL_RULES];
  const category = (productCategory || '').trim().toLowerCase();

  if (
    category === 'food' ||
    category === 'beverage' ||
    category === 'edible' ||
    category.includes('food') ||
    category.includes('beverage')
  ) {
    applicableRules.push(...FOOD_RULES);
  } else if (
    category === 'electronics' ||
    category === 'appliances' ||
    category.includes('electronic') ||
    category.includes('appliance')
  ) {
    applicableRules.push(...ELECTRONICS_RULES);
  } else if (
    category === 'cosmetics' ||
    category === 'cosmetic' ||
    category.includes('cosmetic')
  ) {
    applicableRules.push(...COSMETICS_RULES);
  }

  return applicableRules;
}