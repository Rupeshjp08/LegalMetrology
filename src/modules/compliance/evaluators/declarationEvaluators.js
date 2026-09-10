// src/modules/compliance/evaluators/declarationEvaluators.js
import { COMPLIANCE_STATUS, ACTION_PRIORITY } from '../rules/generalRules.js';

export function checkMissingOrUnclear(fieldData, scanMetadata, fieldDisplayName) {
  if (!fieldData || !fieldData.detected || typeof fieldData.rawText !== 'string' || !fieldData.rawText.trim()) {
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

  const text = (fieldData.rawText || '').toLowerCase();
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

  const validUnits = ['g', 'kg', 'ml', 'l', 'ltr', 'mg', 'n', 'u', 'pieces', 'units', 'pack', 'items'];
  const text = (fieldData.rawText || '').toLowerCase();
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

  const text = fieldData.rawText || '';
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

  const text = (fieldData.rawText || '').toLowerCase();
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

  const text = fieldData.rawText || '';
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

export function evaluateUnitSalePrice(declarations, scanMetadata) {
  const mrpData = declarations?.mrp;
  const netQtyData = declarations?.netQuantity;
  const uspData = declarations?.unitSalePrice;

  if (!mrpData?.detected || !netQtyData?.detected || typeof mrpData.rawText !== 'string' || typeof netQtyData.rawText !== 'string') {
    return {
      status: COMPLIANCE_STATUS.VERIFICATION_REQUIRED,
      priority: ACTION_PRIORITY.MANUAL_VERIFICATION,
      message: 'Unit Sale Price evaluation deferred: Base MRP or Net Quantity is unavailable.',
      recommendedAction: 'VERIFY_BASE_DECLARATIONS'
    };
  }

  const mrpMatch = mrpData.rawText.replace(/,/g, '').match(/\d+(\.\d+)?/);
  const qtyMatch = netQtyData.rawText.match(/(\d+(\.\d+)?)\s*(kg|g|l|ml|ltr|mg|n|u|pieces|units|pack|items)?/i);

  if (!mrpMatch || !qtyMatch) {
    return {
      status: COMPLIANCE_STATUS.WARNING,
      priority: ACTION_PRIORITY.REVIEW_RECOMMENDED,
      message: 'Could not extract numeric values from MRP or Net Quantity to verify USP calculation.',
      recommendedAction: 'OFFICER_REVIEW'
    };
  }

  const mrpValue = parseFloat(mrpMatch[0]);
  const qtyValue = parseFloat(qtyMatch[1]);
  const unit = (qtyMatch[3] || 'g').toLowerCase();

  let totalGramsOrMl = qtyValue;
  if (unit === 'kg' || unit === 'l' || unit === 'ltr') {
    totalGramsOrMl = qtyValue * 1000;
  } else if (unit === 'mg') {
    totalGramsOrMl = qtyValue / 1000;
  }

  const isCountUnit = ['n', 'u', 'pieces', 'units', 'pack', 'items'].includes(unit);
  const isMandatory = !isCountUnit && totalGramsOrMl >= 1000;

  if (isMandatory && (!uspData || !uspData.detected || typeof uspData.rawText !== 'string' || !uspData.rawText.trim())) {
    return {
      status: COMPLIANCE_STATUS.POTENTIAL_NON_COMPLIANCE,
      priority: ACTION_PRIORITY.HIGH_ATTENTION,
      message: `Package size is ${qtyValue}${unit} (≥ 1kg/1L). Mandatory Unit Sale Price (USP) declaration under Rule 6(1)(h) was not detected.`,
      recommendedAction: 'OFFICER_REVIEW'
    };
  }

  if (uspData?.detected && typeof uspData.rawText === 'string' && uspData.rawText.trim()) {
    const uspMatch = uspData.rawText.replace(/,/g, '').match(/\d+(\.\d+)?/);
    if (uspMatch) {
      const declaredUSP = parseFloat(uspMatch[0]);
      const expectedPerGram = mrpValue / (totalGramsOrMl || 1);
      const expectedPerKg = expectedPerGram * 1000;

      const isKgMatch = Math.abs(declaredUSP - expectedPerKg) < 0.5;
      const is100gMatch = Math.abs(declaredUSP - (expectedPerGram * 100)) < 0.5;
      const isDirectMatch = Math.abs(declaredUSP - (mrpValue / (qtyValue || 1))) < 0.5;

      if (!isKgMatch && !is100gMatch && !isDirectMatch) {
        return {
          status: COMPLIANCE_STATUS.WARNING,
          priority: ACTION_PRIORITY.REVIEW_RECOMMENDED,
          message: `Declared USP (${uspData.rawText}) deviates from arithmetic calculation (Expected ~₹${expectedPerKg.toFixed(2)}/kg).`,
          recommendedAction: 'VERIFY_ARITHMETIC'
        };
      }
    }
  }

  return {
    status: COMPLIANCE_STATUS.VERIFIED,
    priority: ACTION_PRIORITY.NO_ACTION,
    message: isMandatory
      ? 'Unit Sale Price (USP) is mandatory and matches arithmetic validation.'
      : 'Unit Sale Price requirement satisfied.',
    recommendedAction: 'NONE'
  };
}

export function evaluateFssaiLicense(fieldData, scanMetadata) {
  const missingCheck = checkMissingOrUnclear(fieldData, scanMetadata, 'FSSAI License Number');
  if (missingCheck) return missingCheck;

  const text = fieldData.rawText || '';
  const fssaiRegex = /\b\d{14}\b/;

  if (!fssaiRegex.test(text)) {
    return {
      status: COMPLIANCE_STATUS.WARNING,
      priority: ACTION_PRIORITY.REVIEW_RECOMMENDED,
      message: 'FSSAI declaration found, but a valid 14-digit registration/license number regex match was not detected.',
      recommendedAction: 'VERIFY_FSSAI_FORMAT'
    };
  }

  return {
    status: COMPLIANCE_STATUS.VERIFIED,
    priority: ACTION_PRIORITY.NO_ACTION,
    message: 'Valid 14-digit FSSAI license number verified on packaging.',
    recommendedAction: 'NONE'
  };
}

export function evaluateBestBefore(fieldData, scanMetadata) {
  const missingCheck = checkMissingOrUnclear(fieldData, scanMetadata, 'Best Before / Expiry Date');
  if (missingCheck) return missingCheck;

  const text = (fieldData.rawText || '').toLowerCase();
  const hasKeywords = text.includes('best before') || text.includes('use by') || text.includes('expiry') || text.includes('exp');
  const dateRegex = /(0[1-9]|1[0-2])[/-](20\d{2}|\d{2})|((jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*\d{4})/i;

  if (!hasKeywords && !dateRegex.test(text)) {
    return {
      status: COMPLIANCE_STATUS.WARNING,
      priority: ACTION_PRIORITY.REVIEW_RECOMMENDED,
      message: 'Date declaration detected, but mandatory "Best Before" or "Expiry" indicator phrase is absent.',
      recommendedAction: 'VERIFY_EXPIRY_DECLARATION'
    };
  }

  return {
    status: COMPLIANCE_STATUS.VERIFIED,
    priority: ACTION_PRIORITY.NO_ACTION,
    message: 'Mandatory Best Before / Expiry date declaration is verified.',
    recommendedAction: 'NONE'
  };
}

export function evaluateBatchNumber(fieldData, scanMetadata) {
  const missingCheck = checkMissingOrUnclear(fieldData, scanMetadata, 'Batch / Lot Number');
  if (missingCheck) return missingCheck;

  return {
    status: COMPLIANCE_STATUS.VERIFIED,
    priority: ACTION_PRIORITY.NO_ACTION,
    message: 'Batch / Lot number declaration is verified.',
    recommendedAction: 'NONE'
  };
}

export function evaluateManufacturingLicense(fieldData, scanMetadata) {
  const missingCheck = checkMissingOrUnclear(fieldData, scanMetadata, 'Manufacturing License');
  if (missingCheck) return missingCheck;

  return {
    status: COMPLIANCE_STATUS.VERIFIED,
    priority: ACTION_PRIORITY.NO_ACTION,
    message: 'Manufacturing License number declaration is verified.',
    recommendedAction: 'NONE'
  };
}

export function evaluateIngredientList(fieldData, scanMetadata) {
  const missingCheck = checkMissingOrUnclear(fieldData, scanMetadata, 'Ingredient Listing');
  if (missingCheck) return missingCheck;

  return {
    status: COMPLIANCE_STATUS.VERIFIED,
    priority: ACTION_PRIORITY.NO_ACTION,
    message: 'Ingredient list declaration is verified.',
    recommendedAction: 'NONE'
  };
}

export function evaluateFSSAI(fieldData, scanMetadata) {
  const missingCheck = checkMissingOrUnclear(fieldData, scanMetadata, 'FSSAI License Number');
  if (missingCheck) return missingCheck;

  const text = (fieldData.rawText || '').replace(/[\s-]/g, '');
  const fssaiRegex = /\b\d{14}\b/;

  if (!fssaiRegex.test(text)) {
    return {
      status: COMPLIANCE_STATUS.WARNING,
      priority: ACTION_PRIORITY.REVIEW_RECOMMENDED,
      message: 'FSSAI text detected, but fails to match the mandatory 14-digit numeric license format.',
      recommendedAction: 'OFFICER_REVIEW'
    };
  }

  return {
    status: COMPLIANCE_STATUS.VERIFIED,
    priority: ACTION_PRIORITY.NO_ACTION,
    message: 'Valid 14-digit FSSAI License Number verified.',
    recommendedAction: 'NONE'
  };
}

export function evaluateExpiryDate(fieldData, scanMetadata) {
  const missingCheck = checkMissingOrUnclear(fieldData, scanMetadata, 'Best Before / Expiry Date');
  if (missingCheck) return missingCheck;

  const text = (fieldData.rawText || '').toLowerCase();
  const hasExpiryIndicators =
    text.includes('best before') ||
    text.includes('use by') ||
    text.includes('exp') ||
    text.includes('expiry');

  if (!hasExpiryIndicators) {
    return {
      status: COMPLIANCE_STATUS.WARNING,
      priority: ACTION_PRIORITY.REVIEW_RECOMMENDED,
      message: 'Expiry date is ambiguous or lacks mandatory prefix ("Best Before", "Use by", or "Expiry").',
      recommendedAction: 'OFFICER_REVIEW'
    };
  }

  return {
    status: COMPLIANCE_STATUS.VERIFIED,
    priority: ACTION_PRIORITY.NO_ACTION,
    message: 'Best Before / Expiry declaration verified.',
    recommendedAction: 'NONE'
  };
}

export function evaluateBIS(fieldData, scanMetadata) {
  const missingCheck = checkMissingOrUnclear(fieldData, scanMetadata, 'BIS Registration');
  if (missingCheck) return missingCheck;

  const text = (fieldData.rawText || '').replace(/\s+/g, '');
  const bisRegex = /r-\d{8}/i;

  if (!bisRegex.test(text)) {
    return {
      status: COMPLIANCE_STATUS.WARNING,
      priority: ACTION_PRIORITY.REVIEW_RECOMMENDED,
      message: 'Electronic commodity lacks valid BIS Registration number format (R-XXXXXXXX).',
      recommendedAction: 'OFFICER_REVIEW'
    };
  }

  return {
    status: COMPLIANCE_STATUS.VERIFIED,
    priority: ACTION_PRIORITY.NO_ACTION,
    message: 'Compulsory BIS registration number verified.',
    recommendedAction: 'NONE'
  };
}