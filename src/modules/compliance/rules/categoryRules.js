// src/modules/compliance/rules/categoryRules.js

export const FOOD_RULES = [
  {
    ruleId: 'LM-FOOD-01-FSSAI',
    ruleName: 'FSSAI License & Logo Declaration',
    field: 'fssaiLicense',
    mandatory: true,
    legalReference: 'FSS (Packaging and Labelling) Regulations, 2011 & Rule 6 LM PC Rules',
    penalSection: 'Section 58, FSS Act, 2006 / Section 36(1), Legal Metrology Act, 2009',
    statutoryDirective: 'Mandatory 14-digit FSSAI license number and FSSAI logo must be declared on food packages.',
    description: 'Check for mandatory FSSAI license number (14-digit numeric regex).',
    evaluator: 'evaluateFSSAI'
  },
  {
    ruleId: 'LM-FOOD-02-EXPIRY',
    ruleName: 'Best Before / Expiry Date Declaration',
    field: 'expiryDate',
    mandatory: true,
    legalReference: 'Rule 6(1)(d) LM PC Rules & FSS Packaging Regulations',
    penalSection: 'Section 36(1), Legal Metrology Act, 2009',
    statutoryDirective: '"Best Before" or "Use By" / Expiry date declaration must be clearly printed on all packaged food commodities.',
    description: 'Check for mandatory Best Before or Expiry date declaration prefix.',
    evaluator: 'evaluateExpiryDate'
  }
];

export const ELECTRONICS_RULES = [
  {
    ruleId: 'LM-ELEC-01-BIS',
    ruleName: 'Compulsory BIS / CRS Registration Mark',
    field: 'bisRegistration',
    mandatory: true,
    legalReference: 'Electronics & IT Goods Compulsory Registration Order & LM PC Rules',
    penalSection: 'Section 36(1), Legal Metrology Act, 2009',
    statutoryDirective: 'Electronic commodities must display mandatory BIS CRS Registration number (R-XXXXXXXX) and standard mark.',
    description: 'Compulsory BIS registration mark regex check for electronic commodities.',
    evaluator: 'evaluateBIS'
  }
];

export const COSMETICS_RULES = [
  {
    ruleId: 'LM-COSM-01-BATCH',
    ruleName: 'Batch / Lot Number Declaration',
    field: 'batchNumber',
    mandatory: true,
    legalReference: 'Cosmetics Rules, 2020 & Rule 6(1) LM PC Rules',
    penalSection: 'Section 36(1), Legal Metrology Act, 2009',
    statutoryDirective: 'Batch or lot number prefixed with "B.No." or "Batch No." must be declared on cosmetic packaging.',
    description: 'Check for mandatory batch number declaration.',
    evaluator: 'evaluateBatchNumber'
  },
  {
    ruleId: 'LM-COSM-02-MFG-LIC',
    ruleName: 'Manufacturing License Number',
    field: 'manufacturingLicense',
    mandatory: true,
    legalReference: 'Drugs and Cosmetics Rules, 1945 & LM PC Rules',
    penalSection: 'Section 27, Drugs & Cosmetics Act, 1940 / Section 36(1), LM Act',
    statutoryDirective: 'Manufacturing license number prefixed with "M.L. No." or "Mfg. Lic. No." must be declared.',
    description: 'Check for mandatory manufacturing license number declaration.',
    evaluator: 'evaluateManufacturingLicense'
  },
  {
    ruleId: 'LM-COSM-03-INGREDIENTS',
    ruleName: 'Ingredient Listing Declaration',
    field: 'ingredientList',
    mandatory: true,
    legalReference: 'Cosmetics Rules, 2020 & Rule 6 LM PC Rules',
    penalSection: 'Section 36(1), Legal Metrology Act, 2009',
    statutoryDirective: 'Complete list of ingredients in descending order of weight or volume at the time of manufacture.',
    description: 'Check for mandatory ingredient listing declaration.',
    evaluator: 'evaluateIngredientList'
  }
];

export const CATEGORY_RULES = {
  food: FOOD_RULES,
  beverage: FOOD_RULES,
  edible: FOOD_RULES,
  electronics: ELECTRONICS_RULES,
  appliances: ELECTRONICS_RULES,
  cosmetics: COSMETICS_RULES,
  cosmetic: COSMETICS_RULES
};
