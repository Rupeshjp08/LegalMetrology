// src/modules/compliance/adapter/scanAdapter.js

/**
 * Canonical compliance field keys expected by rule evaluators.
 */
const CANONICAL_FIELD_MAP = {
  mrp: ['mrp', 'maximum_retail_price', 'max_retail_price', 'price', 'mrp_declaration', 'retail_price', 'mrp_price'],
  netQuantity: ['netquantity', 'net_quantity', 'net_qty', 'netweight', 'net_weight', 'quantity', 'net_volume', 'net_vol', 'net_measure', 'net_count'],
  manufacturerDetails: ['manufacturerdetails', 'manufacturer_details', 'manufacturer', 'packer_details', 'packer', 'mfg_details', 'manufactured_by', 'manufacturer_address'],
  consumerCare: ['consumercare', 'consumer_care', 'customer_care', 'consumer_cell', 'grievance_contact', 'customer_service', 'helpline', 'consumer_grievance'],
  countryOfOrigin: ['countryoforigin', 'country_of_origin', 'origin_country', 'origin', 'made_in', 'country_origin'],
  dateOfPackaging: ['dateofpackaging', 'date_of_packaging', 'packaging_date', 'mfg_date', 'date_of_mfg', 'pack_date', 'month_year_of_packing', 'date_of_manufacture'],
  unitSalePrice: ['unitsaleprice', 'unit_sale_price', 'usp', 'unit_price', 'price_per_unit'],
  fssaiLicense: ['fssailicense', 'fssai_license', 'fssai', 'fssai_no', 'fssai_lic_no', 'fssai_number', 'fssai_reg', 'fssailicense number'],
  bestBeforeDate: ['bestbeforedate', 'best_before_date', 'best_before', 'expiry_date', 'expiry', 'exp_date', 'use_by', 'use_by_date'],
  batchNumber: ['batchnumber', 'batch_number', 'batch_no', 'batch', 'lot_number', 'lot_no', 'b_no'],
  manufacturingLicense: ['manufacturinglicense', 'manufacturing_license', 'mfg_license', 'mfg_lic_no', 'mfg_lic', 'lic_no'],
  ingredientList: ['ingredientlist', 'ingredient_list', 'ingredients', 'ingredients_list', 'ingredient_details']
};

/**
 * Normalizes a key string for lookup (lowercased, stripped of non-alphanumeric chars).
 */
function normalizeKey(key) {
  if (typeof key !== 'string') return '';
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Extracts string content from various OCR output structures (strings, objects, bounding box tuples).
 */
function extractRawText(fieldVal) {
  if (fieldVal === null || fieldVal === undefined) return null;

  if (typeof fieldVal === 'string' || typeof fieldVal === 'number') {
    const text = String(fieldVal).trim();
    if (!text || /^n\/?a$/i.test(text) || text.toLowerCase() === 'null' || text.toLowerCase() === 'undefined') {
      return null;
    }
    return text;
  }

  if (Array.isArray(fieldVal)) {
    const extracted = fieldVal
      .map((item) => extractRawText(item))
      .filter(Boolean)
      .join(' ');
    return extracted.length > 0 ? extracted : null;
  }

  if (typeof fieldVal === 'object') {
    // Check known OCR text keys
    const textCandidates = [
      fieldVal.rawText,
      fieldVal.raw_text,
      fieldVal.text,
      fieldVal.value,
      fieldVal.val,
      fieldVal.detectedText,
      fieldVal.detected_text,
      fieldVal.ocrText,
      fieldVal.ocr_text,
      fieldVal.content,
      fieldVal.string,
      fieldVal.string_value,
      fieldVal.extractedText,
      fieldVal.extracted_text,
      fieldVal.displayText,
      fieldVal.display_text
    ];

    for (const candidate of textCandidates) {
      const result = extractRawText(candidate);
      if (result) return result;
    }
  }

  return null;
}

/**
 * Extracts bounding box data if available.
 */
function extractBBox(fieldVal) {
  if (!fieldVal || typeof fieldVal !== 'object' || Array.isArray(fieldVal)) return null;
  return fieldVal.bbox || fieldVal.bounding_box || fieldVal.box || fieldVal.bounds || null;
}

/**
 * Extracts detection confidence if available.
 */
function extractConfidence(fieldVal) {
  if (!fieldVal || typeof fieldVal !== 'object') return null;
  const conf = fieldVal.confidence ?? fieldVal.score ?? fieldVal.accuracy ?? null;
  if (typeof conf === 'number') return conf;
  return null;
}

/**
 * Extracts clarity rating ('clear' | 'blurry').
 */
function extractClarity(fieldVal) {
  if (fieldVal && typeof fieldVal === 'object') {
    if (typeof fieldVal.clarity === 'string') return fieldVal.clarity.toLowerCase();
    const conf = extractConfidence(fieldVal);
    if (conf !== null) {
      // Normalize 0-100 or 0-1 confidence
      const normalizedConf = conf > 1 ? conf / 100 : conf;
      return normalizedConf >= 0.7 ? 'clear' : 'blurry';
    }
  }
  return 'clear';
}

/**
 * Determines whether a field is considered detected.
 */
function extractDetectedFlag(fieldVal, rawText) {
  if (fieldVal && typeof fieldVal === 'object' && !Array.isArray(fieldVal)) {
    if (typeof fieldVal.detected === 'boolean') return fieldVal.detected;
    if (typeof fieldVal.is_detected === 'boolean') return fieldVal.is_detected;
    if (typeof fieldVal.found === 'boolean') return fieldVal.found;
    if (typeof fieldVal.present === 'boolean') return fieldVal.present;
  }
  return Boolean(rawText && rawText.trim().length > 0);
}

/**
 * Main adapter function to normalize raw OCR scanner output into standard audit declarations.
 * 
 * @param {Object} rawOcrData - Raw output from scanner/OCR engine (may contain nested objects, arrays, bounding boxes, or mixed key casing).
 * @returns {Object} Standardized audit payload object consumable by `runComplianceAudit`.
 */
export function adaptScanResult(rawOcrData) {
  try {
    const input = rawOcrData && typeof rawOcrData === 'object' ? rawOcrData : {};

    // 1. Identify raw fields dictionary from possible top-level wrappers
    let rawFieldsSource = input.declarations || input.fields || input.ocrResults || input.ocr_results || input.extractedFields || input.items || input;

    if (Array.isArray(rawFieldsSource)) {
      // If scanner outputs array of field items e.g., [{ key: 'mrp', text: '₹40' }, { label: 'NET_QTY', val: '250g' }]
      const mappedObject = {};
      rawFieldsSource.forEach((item) => {
        if (item && typeof item === 'object') {
          const keyName = item.key || item.field || item.label || item.name || item.type;
          if (keyName) mappedObject[keyName] = item;
        }
      });
      rawFieldsSource = mappedObject;
    } else if (typeof rawFieldsSource !== 'object' || rawFieldsSource === null) {
      rawFieldsSource = {};
    }

    // Index raw fields by normalized key string
    const normalizedRawFields = {};
    Object.entries(rawFieldsSource).forEach(([rawKey, val]) => {
      const normKey = normalizeKey(rawKey);
      if (normKey) {
        normalizedRawFields[normKey] = val;
      }
    });

    // 2. Build standard declarations contract
    const declarations = {};

    Object.entries(CANONICAL_FIELD_MAP).forEach(([canonicalKey, aliases]) => {
      let matchedVal = undefined;

      // Find value matching canonical key or any of its known aliases
      for (const alias of aliases) {
        const normAlias = normalizeKey(alias);
        if (normalizedRawFields[normAlias] !== undefined) {
          matchedVal = normalizedRawFields[normAlias];
          break;
        }
      }

      const rawText = extractRawText(matchedVal);
      const detected = extractDetectedFlag(matchedVal, rawText);
      const clarity = extractClarity(matchedVal);
      const bbox = extractBBox(matchedVal);
      const confidence = extractConfidence(matchedVal);

      declarations[canonicalKey] = {
        detected,
        rawText,
        clarity,
        ...(confidence !== null ? { confidence } : {}),
        ...(bbox !== null ? { bbox } : {})
      };
    });

    // 3. Extract top-level metadata safely
    const inspectionId = 
      input.inspectionId || 
      input.inspection_id || 
      input.id || 
      input.sessionId || 
      `INS-${Date.now()}`;

    const productName = 
      input.product?.name || 
      input.product_name || 
      input.productName || 
      input.name || 
      'Unknown Packaged Commodity';

    const productCategory = 
      input.product?.category || 
      input.productCategory || 
      input.category || 
      input.product_category || 
      'General';

    const imageQuality = 
      input.scanMetadata?.imageQuality || 
      input.scan_metadata?.image_quality || 
      input.imageQuality || 
      input.image_quality || 
      'high';

    const allSidesCaptured = 
      typeof input.scanMetadata?.allSidesCaptured === 'boolean' 
        ? input.scanMetadata.allSidesCaptured 
        : typeof input.all_sides_captured === 'boolean' 
        ? input.all_sides_captured 
        : true;

    return {
      inspectionId,
      product: {
        name: productName,
        category: productCategory
      },
      scanMetadata: {
        imageQuality,
        allSidesCaptured
      },
      declarations
    };
  } catch (err) {
    // Ultimate defensive fallback so runComplianceAudit never crashes
    console.error('Error adapting OCR scan result:', err);
    return {
      inspectionId: `INS-ERR-${Date.now()}`,
      product: { name: 'Unknown Packaged Commodity', category: 'General' },
      scanMetadata: { imageQuality: 'low', allSidesCaptured: false },
      declarations: {
        mrp: { detected: false, rawText: null, clarity: 'blurry' },
        netQuantity: { detected: false, rawText: null, clarity: 'blurry' },
        manufacturerDetails: { detected: false, rawText: null, clarity: 'blurry' },
        consumerCare: { detected: false, rawText: null, clarity: 'blurry' },
        countryOfOrigin: { detected: false, rawText: null, clarity: 'blurry' },
        dateOfPackaging: { detected: false, rawText: null, clarity: 'blurry' },
        unitSalePrice: { detected: false, rawText: null, clarity: 'blurry' },
        fssaiLicense: { detected: false, rawText: null, clarity: 'blurry' },
        bestBeforeDate: { detected: false, rawText: null, clarity: 'blurry' },
        batchNumber: { detected: false, rawText: null, clarity: 'blurry' },
        manufacturingLicense: { detected: false, rawText: null, clarity: 'blurry' },
        ingredientList: { detected: false, rawText: null, clarity: 'blurry' }
      }
    };
  }
}
