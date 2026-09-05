// src/modules/compliance/rules/generalRules.js

export const COMPLIANCE_STATUS = {
  VERIFIED: 'VERIFIED',
  VERIFICATION_REQUIRED: 'VERIFICATION_REQUIRED',
  WARNING: 'WARNING',
  POTENTIAL_NON_COMPLIANCE: 'POTENTIAL_NON_COMPLIANCE'
};

export const ACTION_PRIORITY = {
  NO_ACTION: 'NO_ACTION',
  MANUAL_VERIFICATION: 'MANUAL_VERIFICATION',
  REVIEW_RECOMMENDED: 'REVIEW_RECOMMENDED',
  HIGH_ATTENTION: 'HIGH_ATTENTION'
};

export const GENERAL_RULES = [
  {
    ruleId: 'LM-R6-01-MRP',
    ruleName: 'Maximum Retail Price (MRP) Declaration',
    field: 'mrp',
    mandatory: true,
    legalReference: 'Rule 6(1)(e) — Legal Metrology (PC) Rules, 2011',
    penalSection: 'Section 36(1), Legal Metrology Act, 2009 (Penalty up to ₹25,000)',
    statutoryDirective: 'MRP must be stated explicitly inclusive of all taxes (e.g., "MRP ₹xx.xx incl. of all taxes"). Rounding off must conform to standard currency rules.',
    description: 'MRP must be stated inclusive of all taxes.',
    evaluator: 'evaluateMRP'
  },
  {
    ruleId: 'LM-R6-02-NET-QTY',
    ruleName: 'Net Quantity Declaration',
    field: 'netQuantity',
    mandatory: true,
    legalReference: 'Rule 6(1)(b) & Second Schedule',
    penalSection: 'Section 36(1) & Section 39, Legal Metrology Act, 2009',
    statutoryDirective: 'Net quantity must be declared using standard metric units (g, kg, ml, l, or number). Non-standard units (such as lbs, oz, or ambiguous counts) are prohibited.',
    description: 'Net weight, measure, or count in standard metric units.',
    evaluator: 'evaluateNetQuantity'
  },
  {
    ruleId: 'LM-R6-03-MANUFACTURER',
    ruleName: 'Manufacturer / Packer Details',
    field: 'manufacturerDetails',
    mandatory: true,
    legalReference: 'Rule 6(1)(a) — Identity of Manufacturer/Packer',
    penalSection: 'Section 36(1), Legal Metrology Act, 2009',
    statutoryDirective: 'Complete commercial name and operational premises address must be clearly legible. Post office box alone without premises is non-compliant.',
    description: 'Complete commercial name and operational address must be identifiable.',
    evaluator: 'evaluateManufacturer'
  },
  {
    ruleId: 'LM-R6-04-CONSUMER-CARE',
    ruleName: 'Consumer Care Cell Details',
    field: 'consumerCare',
    mandatory: true,
    legalReference: 'Rule 6(2) — Consumer Grievance Contact',
    penalSection: 'Section 36(1), Legal Metrology Act, 2009',
    statutoryDirective: 'Mandatory declaration of name, address, telephone number, and email of the grievance officer or consumer cell.',
    description: 'Consumer contact telephone and email must be provided.',
    evaluator: 'evaluateConsumerCare'
  },
  {
    ruleId: 'LM-R6-05-ORIGIN',
    ruleName: 'Country of Origin',
    field: 'countryOfOrigin',
    mandatory: true,
    legalReference: 'Rule 6(10) — Declaration of Country of Origin',
    penalSection: 'Section 36(1), Legal Metrology Act, 2009',
    statutoryDirective: 'The country of origin or manufacture must be explicitly declared for domestic and imported packaged goods.',
    description: 'Country of origin must be stated explicitly.',
    evaluator: 'evaluateCountryOfOrigin'
  },
  {
    ruleId: 'LM-R6-06-PACK-DATE',
    ruleName: 'Month and Year of Packaging / Manufacture',
    field: 'dateOfPackaging',
    mandatory: true,
    legalReference: 'Rule 6(1)(d) — Packaging Date',
    penalSection: 'Section 36(1), Legal Metrology Act, 2009',
    statutoryDirective: 'Month and year of manufacture or pre-packing must be declared in clear numerical or standard month name format.',
    description: 'Month and year of packaging must be declared (MM/YYYY).',
    evaluator: 'evaluatePackagingDate'
  },
  {
    ruleId: 'LM-R6-07-USP',
    ruleName: 'Unit Sale Price (USP) Declaration & Calculation',
    field: 'unitSalePrice',
    mandatory: false,
    legalReference: 'Rule 6(1)(h) — Mandatory USP for packages > 1kg / 1L',
    penalSection: 'Section 36(1), Legal Metrology Act, 2009',
    statutoryDirective: 'For packages exceeding 1 kg or 1 L, the price per gram/kg/ml/liter must be prominently declared alongside MRP.',
    description: 'Unit sale price must be declared and correctly calculated for packages ≥ 1kg or 1L.',
    evaluator: 'evaluateUnitSalePrice'
  }
];