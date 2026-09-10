// src/modules/compliance/adapter/scanAdapter.js

const DECLARATION_KEYS_MAP = {
  mrp: ['mrp', 'maximum_retail_price', 'max_retail_price', 'price'],
  netQuantity: ['netQuantity', 'net_weight', 'net_quantity', 'quantity', 'netquantity', 'netweight'],
  manufacturerDetails: ['manufacturerDetails', 'manufacturer', 'manufacturerName', 'packer_details', 'mfg_address', 'mfg_details', 'manufactured_by', 'manufacturer_address', 'brand'],
  consumerCare: ['consumerCare', 'consumerCareDetails', 'customer_care', 'consumer_grievance', 'helpline', 'consumer_cell', 'customer_service'],
  countryOfOrigin: ['countryOfOrigin', 'origin', 'country_of_origin', 'countryoforigin', 'origin_country', 'made_in'],
  dateOfPackaging: ['dateOfPackaging', 'manufacturingDate', 'mfg_date', 'packaging_date', 'pkg_date', 'date_of_mfg', 'pack_date', 'month_year_of_packing'],
  unitSalePrice: ['unitSalePrice', 'usp', 'unit_price', 'unitsaleprice', 'price_per_unit'],
  fssaiLicense: ['fssaiLicense', 'fssai', 'fssai_no', 'fssai_lic_no', 'fssai_number'],
  expiryDate: ['expiryDate', 'best_before', 'exp_date', 'best_before_date', 'expiry_date', 'use_by'],
  bisRegistration: ['bisRegistration', 'bis', 'crs_registration', 'bis_no', 'bis_number']
};

function extractRawString(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === 'string' || typeof val === 'number') {
    const text = String(val).trim();
    return text.length > 0 && text.toLowerCase() !== 'null' && text.toLowerCase() !== 'undefined' ? text : null;
  }
  if (Array.isArray(val)) {
    const joined = val.map(extractRawString).filter(Boolean).join(' ');
    return joined.length > 0 ? joined : null;
  }
  if (typeof val === 'object') {
    const candidates = [
      val.rawText, val.raw_text, val.text, val.value, val.val,
      val.detectedText, val.detected_text, val.content, val.string
    ];
    for (const cand of candidates) {
      const result = extractRawString(cand);
      if (result) return result;
    }
  }
  return null;
}

export function adaptScanResult(rawScanData) {
  try {
    const input = rawScanData && typeof rawScanData === 'object' ? rawScanData : {};

    const inspectionId = input.inspectionId || input.inspection_id || input.id || `INS-${Date.now()}`;

    const productName = input.productName || input.metadata?.productName || input.product?.name || input.name || 'Packaged Commodity';
    const category = input.category || input.metadata?.category || input.product?.category || 'General';
    const product = { name: productName, category };

    const imageQuality = input.imageQuality || input.scanMetadata?.imageQuality || input.scan_metadata?.image_quality || 'medium';
    const allSidesCaptured = input.allSidesCaptured !== undefined 
      ? Boolean(input.allSidesCaptured) 
      : Boolean(input.scanMetadata?.allSidesCaptured || input.scan_metadata?.all_sides_captured);
    const scanMetadata = { imageQuality, allSidesCaptured };

    // Locate fields source dictionary or array
    let fieldsSource = input.declarations || input.extractedFields || input.fields || input.ocrResults || input.ocr_results || input.items || input;

    if (Array.isArray(fieldsSource)) {
      const mappedObj = {};
      fieldsSource.forEach((item) => {
        if (item && typeof item === 'object') {
          const k = item.key || item.field || item.label || item.name || item.type;
          if (k) mappedObj[k] = item;
        }
      });
      fieldsSource = mappedObj;
    } else if (!fieldsSource || typeof fieldsSource !== 'object') {
      fieldsSource = {};
    }

    // Normalized map for case-insensitive lookup
    const normalizedFields = {};
    Object.entries(fieldsSource).forEach(([rk, rv]) => {
      if (rk) normalizedFields[rk.toLowerCase().replace(/[^a-z0-9]/g, '')] = rv;
    });

    const declarations = {};

    Object.entries(DECLARATION_KEYS_MAP).forEach(([canonicalKey, aliases]) => {
      let matchedVal = undefined;

      for (const alias of aliases) {
        const normAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (normalizedFields[normAlias] !== undefined) {
          matchedVal = normalizedFields[normAlias];
          break;
        }
      }

      const rawText = extractRawString(matchedVal);

      let detected = false;
      if (matchedVal && typeof matchedVal === 'object' && !Array.isArray(matchedVal)) {
        if (typeof matchedVal.detected === 'boolean') detected = matchedVal.detected;
        else if (typeof matchedVal.is_detected === 'boolean') detected = matchedVal.is_detected;
        else detected = Boolean(rawText);
      } else {
        detected = Boolean(rawText);
      }

      let clarity = 'clear';
      if (matchedVal && typeof matchedVal === 'object' && !Array.isArray(matchedVal) && typeof matchedVal.clarity === 'string') {
        clarity = matchedVal.clarity;
      }

      let confidence = 1.0;
      if (matchedVal && typeof matchedVal === 'object' && !Array.isArray(matchedVal)) {
        const confNum = matchedVal.confidence ?? matchedVal.score;
        if (typeof confNum === 'number') confidence = confNum;
      }

      declarations[canonicalKey] = {
        detected,
        rawText,
        clarity,
        confidence
      };
    });

    return {
      inspectionId,
      product,
      scanMetadata,
      declarations
    };
  } catch (err) {
    console.error('Error adapting scan payload:', err);
    return {
      inspectionId: `INS-${Date.now()}`,
      product: { name: 'Packaged Commodity', category: 'General' },
      scanMetadata: { imageQuality: 'medium', allSidesCaptured: false },
      declarations: {
        mrp: { detected: false, rawText: null, clarity: 'clear', confidence: 1.0 },
        netQuantity: { detected: false, rawText: null, clarity: 'clear', confidence: 1.0 },
        manufacturerDetails: { detected: false, rawText: null, clarity: 'clear', confidence: 1.0 },
        consumerCare: { detected: false, rawText: null, clarity: 'clear', confidence: 1.0 },
        countryOfOrigin: { detected: false, rawText: null, clarity: 'clear', confidence: 1.0 },
        dateOfPackaging: { detected: false, rawText: null, clarity: 'clear', confidence: 1.0 },
        unitSalePrice: { detected: false, rawText: null, clarity: 'clear', confidence: 1.0 },
        fssaiLicense: { detected: false, rawText: null, clarity: 'clear', confidence: 1.0 },
        expiryDate: { detected: false, rawText: null, clarity: 'clear', confidence: 1.0 },
        bisRegistration: { detected: false, rawText: null, clarity: 'clear', confidence: 1.0 }
      }
    };
  }
}

export const adaptScanToCompliance = adaptScanResult;
