// src/modules/compliance/evaluators/declarationEvaluators.js
import { COMPLIANCE_STATUS, ACTION_PRIORITY } from '../rules/generalRules.js';

/**
 * Three-Way Missing Information Logic:
 * 1. Present -> run syntax & format checks.
 * 2. Missing + unclear/partial capture -> VERIFICATION_REQUIRED (Officer must manually review).
 * 3. Missing + high clarity + all panels captured -> POTENTIAL_NON_COMPLIANCE (Flagged).
 */
export function checkMissingOrUnclear(fieldData, scanMetadata, fieldDisplayName) {
  if (!fieldData || !fieldData.detected || !fieldData.rawText?.trim()) {
    const isImageHighConfidence = 
      scanMetadata?.allSidesCaptured === true && 
      (scanMetadata?.imageQuality === 'high' || fieldData?.clarity === 'clear');

    if (isImageHighConfidence) {
      return {
        status: COMPLIANCE_STATUS.POTENTIAL_NON_COMPLIANCE,
        priority: ACTION_PRIORITY.HIGH_ATTENTION,
        message: `${fieldDisplayName} was not found on the package despite clear captures of all required panels.`,
        recommendedAction: 'OFFICER_REVIEW'
      };
    }

    return {
      status: COMPLIANCE_STATUS.VERIFICATION_REQUIRED,
      priority: ACTION_PRIORITY.MANUAL_VERIFICATION,
      message: `${fieldDisplayName} could not be verified due to incomplete or unclear image capture.`,
      recommendedAction: 'MANUAL_INSPECTION'
    };
  }
  return null;
}

export function evaluateMRP(fieldData, scanMetadata) {
  const missingCheck = checkMissingOrUnclear(fieldData, scanMetadata, 'Maximum Retail Price (MRP)');
  if (missingCheck) return missingCheck;

  const text = fieldData.rawText.toLowerCase();
  const hasTaxClause = text.includes('inclusive') || text.includes('incl') || text.includes('tax');
  const hasCurrency = text.includes('₹') || text.includes('rs') || text.includes('inr');

  if (!hasTaxClause) {
    return {
      status: COMPLIANCE_STATUS.WARNING,
      priority: ACTION_PRIORITY.REVIEW_RECOMMENDED,
      message: 'MRP detected, but mandatory phrase "incl. of all taxes" is not detected.',
      recommendedAction: 'VERIFY_TAX_STATEMENT'
    };
  }

  if (!hasCurrency) {
    return {
      status: COMPLIANCE_STATUS.WARNING,
      priority: ACTION_PRIORITY.REVIEW_RECOMMENDED,
      message: 'Price found, but standard currency symbol (₹ / Rs.) is missing or obscured.',
      recommendedAction: 'VERIFY_CURRENCY_SYMBOL'
    };
  }

  return {
    status: COMPLIANCE_STATUS.VERIFIED,
    priority: ACTION_PRIORITY.NO_ACTION,
    message: 'MRP is declared with valid currency symbol and tax inclusion statement.',
    recommendedAction: 'NONE'
  };
}

export function evaluateNetQuantity(fieldData, scanMetadata) {
  const missingCheck = checkMissingOrUnclear(fieldData, scanMetadata, 'Net Quantity');
  if (missingCheck) return missingCheck;

  const validUnits = ['g', 'kg', 'ml', 'l', 'ltr', 'mg', 'n', 'u', 'pieces', 'units'];
  const text = fieldData.rawText.toLowerCase();
  const matchesMetricUnit = validUnits.some(unit => new RegExp(`\\b\\d+(\\.\\d+)?\\s*${unit}\\b`, 'i').test(text));

  if (!matchesMetricUnit) {
    return {
      status: COMPLIANCE_STATUS.WARNING,
      priority: ACTION_PRIORITY.REVIEW_RECOMMENDED,
      message: 'Net quantity detected, but standard metric unit format could not be verified.',
      recommendedAction: 'OFFICER_REVIEW'
    };
  }

  return {
    status: COMPLIANCE_STATUS.VERIFIED,
    priority: ACTION_PRIORITY.NO_ACTION,
    message: 'Net quantity declared in compliant standard metric units.',
    recommendedAction: 'NONE'
  };
}

export function evaluateManufacturer(fieldData, scanMetadata) {
  const missingCheck = checkMissingOrUnclear(fieldData, scanMetadata, 'Manufacturer / Packer');
  if (missingCheck) return missingCheck;

  const text = fieldData.rawText;
  if (text.length < 10) {
    return {
      status: COMPLIANCE_STATUS.WARNING,
      priority: ACTION_PRIORITY.REVIEW_RECOMMENDED,
      message: 'Manufacturer text is unusually brief. Complete address premises may be missing.',
      recommendedAction: 'VERIFY_FULL_ADDRESS'
    };
  }

  return {
    status: COMPLIANCE_STATUS.VERIFIED,
    priority: ACTION_PRIORITY.NO_ACTION,
    message: 'Manufacturer/Packer name and address details are present.',
    recommendedAction: 'NONE'
  };
}

export function evaluateConsumerCare(fieldData, scanMetadata) {
  const missingCheck = checkMissingOrUnclear(fieldData, scanMetadata, 'Consumer Care Details');
  if (missingCheck) return missingCheck;

  const text = fieldData.rawText.toLowerCase();
  const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text);
  const hasPhone = /(?:(?:\+|0{0,2})91(\s*[-]\s*)?|[0]?)?[6789]\d{9}|1800\d{6,7}/.test(text.replace(/[\s-]/g, ''));

  if (!hasEmail && !hasPhone) {
    return {
      status: COMPLIANCE_STATUS.WARNING,
      priority: ACTION_PRIORITY.REVIEW_RECOMMENDED,
      message: 'Consumer care declaration lacks both a phone/toll-free helpline and an email address.',
      recommendedAction: 'OFFICER_REVIEW'
    };
  }

  return {
    status: COMPLIANCE_STATUS.VERIFIED,
    priority: ACTION_PRIORITY.NO_ACTION,
    message: 'Consumer grievance contact details (helpline or email) are present.',
    recommendedAction: 'NONE'
  };
}

export function evaluateCountryOfOrigin(fieldData, scanMetadata) {
  const missingCheck = checkMissingOrUnclear(fieldData, scanMetadata, 'Country of Origin');
  if (missingCheck) return missingCheck;

  return {
    status: COMPLIANCE_STATUS.VERIFIED,
    priority: ACTION_PRIORITY.NO_ACTION,
    message: 'Country of Origin declaration is verified.',
    recommendedAction: 'NONE'
  };
}

export function evaluatePackagingDate(fieldData, scanMetadata) {
  const missingCheck = checkMissingOrUnclear(fieldData, scanMetadata, 'Date of Packaging');
  if (missingCheck) return missingCheck;

  const text = fieldData.rawText;
  const dateRegex = /(0[1-9]|1[0-2])[\/\-](20\d{2}|\d{2})|((jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*\d{4})/i;

  if (!dateRegex.test(text)) {
    return {
      status: COMPLIANCE_STATUS.WARNING,
      priority: ACTION_PRIORITY.REVIEW_RECOMMENDED,
      message: 'Date of packaging does not conform to standard Month/Year (MM/YYYY) format.',
      recommendedAction: 'VERIFY_EXPIRY_FORMAT'
    };
  }

  return {
    status: COMPLIANCE_STATUS.VERIFIED,
    priority: ACTION_PRIORITY.NO_ACTION,
    message: 'Date of packaging/manufacturing verified in standard format.',
    recommendedAction: 'NONE'
  };
}