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
    description: 'MRP must be stated inclusive of all taxes.',
    evaluator: 'evaluateMRP'
  },
  {
    ruleId: 'LM-R6-02-NET-QTY',
    ruleName: 'Net Quantity Declaration',
    field: 'netQuantity',
    mandatory: true,
    legalReference: 'Rule 6(1)(b) & Second Schedule',
    description: 'Net weight, measure, or count in standard metric units (g, kg, ml, l, piece).',
    evaluator: 'evaluateNetQuantity'
  },
  {
    ruleId: 'LM-R6-03-MANUFACTURER',
    ruleName: 'Manufacturer / Packer Details',
    field: 'manufacturerDetails',
    mandatory: true,
    legalReference: 'Rule 6(1)(a) — Identity and address of manufacturer or packer',
    description: 'Complete commercial name and operational address must be identifiable.',
    evaluator: 'evaluateManufacturer'
  },
  {
    ruleId: 'LM-R6-04-CONSUMER-CARE',
    ruleName: 'Consumer Care Cell Details',
    field: 'consumerCare',
    mandatory: true,
    legalReference: 'Rule 6(2) — Consumer complaint contact details',
    description: 'Must provide telephone/helpline number and email address for grievances.',
    evaluator: 'evaluateConsumerCare'
  },
  {
    ruleId: 'LM-R6-05-ORIGIN',
    ruleName: 'Country of Origin',
    field: 'countryOfOrigin',
    mandatory: true,
    legalReference: 'Rule 6(10) — Mandatory declaration of country of origin',
    description: 'Country of origin must be stated explicitly.',
    evaluator: 'evaluateCountryOfOrigin'
  },
  {
    ruleId: 'LM-R6-06-PACK-DATE',
    ruleName: 'Month and Year of Packaging / Manufacture',
    field: 'dateOfPackaging',
    mandatory: true,
    legalReference: 'Rule 6(1)(d) — Date of packaging/manufacturing',
    description: 'Month and year of manufacture or packaging must be declared (MM/YYYY).',
    evaluator: 'evaluatePackagingDate'
  }
];