import { GoogleGenAI } from '@google/genai'

const GEMINI_API_STORAGE_KEY = 'pclmcs.gemini_api_key'
const DEFAULT_GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash']

/**
 * Retrieve Gemini API key from environment variable or session storage.
 * Never hardcodes keys or leaks credentials.
 */
export function getGeminiApiKey() {
  const envKey =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) ||
    (typeof process !== 'undefined' && process.env?.VITE_GEMINI_API_KEY)

  if (envKey && typeof envKey === 'string' && envKey.trim().length > 0) {
    return envKey.trim()
  }

  try {
    const sessionKey = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(GEMINI_API_STORAGE_KEY) : null
    if (sessionKey && typeof sessionKey === 'string' && sessionKey.trim().length > 0) {
      return sessionKey.trim()
    }

    const localKey = typeof localStorage !== 'undefined' ? localStorage.getItem(GEMINI_API_STORAGE_KEY) : null
    if (localKey && typeof localKey === 'string' && localKey.trim().length > 0) {
      return localKey.trim()
    }
  } catch {
    // Ignore storage errors in restricted contexts
  }

  return ''
}

/**
 * Persist Gemini API key for this session (or permanently in localStorage).
 */
export function setGeminiApiKey(key, persist = false) {
  const clean = (key || '').trim()
  try {
    if (clean) {
      sessionStorage.setItem(GEMINI_API_STORAGE_KEY, clean)
      if (persist) {
        localStorage.setItem(GEMINI_API_STORAGE_KEY, clean)
      }
    } else {
      sessionStorage.removeItem(GEMINI_API_STORAGE_KEY)
      localStorage.removeItem(GEMINI_API_STORAGE_KEY)
    }
  } catch {
    // Ignore storage write errors
  }
}

/**
 * Check if a Gemini API key is configured.
 */
export function hasGeminiApiKey() {
  return Boolean(getGeminiApiKey())
}

/**
 * Clean and parse JSON from Gemini's response, handling potential markdown wrappers.
 */
function parseGeminiJson(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Empty response received from AI service.')
  }

  let cleaned = rawText.trim()
  // Remove markdown code fence if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  }

  try {
    return JSON.parse(cleaned)
  } catch (err) {
    console.warn('[GeminiService] AI returned unparseable JSON, retrying next model:', err.message || err)
    throw new Error('AI returned an invalid JSON response structure.')
  }
}

/**
 * Normalize and validate the structured product data against the strict schema.
 */
function normalizeExtractedDetails(parsed) {
  const safeStr = (val) => (val && typeof val === 'string' ? val.trim() : '')
  const safeObj = (obj) => (obj && typeof obj === 'object' && !Array.isArray(obj) ? obj : {})

  const mfg = safeObj(parsed.manufacturer)
  const pkr = safeObj(parsed.packer)
  const imp = safeObj(parsed.importer)

  const normalized = {
    productName: safeStr(parsed.productName),
    genericName: safeStr(parsed.genericName),
    manufacturer: {
      name: safeStr(mfg.name),
      address: safeStr(mfg.address),
    },
    packer: {
      name: safeStr(pkr.name),
      address: safeStr(pkr.address),
    },
    importer: {
      name: safeStr(imp.name),
      address: safeStr(imp.address),
    },
    countryOfOrigin: safeStr(parsed.countryOfOrigin),
    netQuantity: safeStr(parsed.netQuantity),
    mrp: safeStr(parsed.mrp),
    unitSalePrice: safeStr(parsed.unitSalePrice),
    manufactureDate: safeStr(parsed.manufactureDate),
    bestBefore: safeStr(parsed.bestBefore),
    consumerCare: safeStr(parsed.consumerCare),
    category: safeStr(parsed.category),
    dimensions: safeStr(parsed.dimensions),
    confidence:
      typeof parsed.confidence === 'number' && !isNaN(parsed.confidence)
        ? Math.min(100, Math.max(0, Math.round(parsed.confidence)))
        : null,
    extractionSource: parsed.extractionSource || (parsed.imageBased ? 'image' : 'ocr'),
    usedMultimodalFallback: Boolean(parsed.usedMultimodalFallback || parsed.imageBased),
    missingFields: [],
  }

  // Calculate missing fields list dynamically based on standard Legal Metrology declarations
  const standardFields = [
    { key: 'productName', label: 'Product Name', value: normalized.productName },
    { key: 'genericName', label: 'Generic / Common Name', value: normalized.genericName },
    { key: 'manufacturerName', label: 'Manufacturer Name', value: normalized.manufacturer.name },
    { key: 'manufacturerAddress', label: 'Manufacturer Address', value: normalized.manufacturer.address },
    { key: 'countryOfOrigin', label: 'Country of Origin', value: normalized.countryOfOrigin },
    { key: 'netQuantity', label: 'Net Quantity', value: normalized.netQuantity },
    { key: 'mrp', label: 'MRP', value: normalized.mrp },
    { key: 'unitSalePrice', label: 'Unit Sale Price', value: normalized.unitSalePrice },
    { key: 'manufactureDate', label: 'Manufacture / Packing Date', value: normalized.manufactureDate },
    { key: 'bestBefore', label: 'Best Before / Use By', value: normalized.bestBefore },
    { key: 'consumerCare', label: 'Consumer Care Details', value: normalized.consumerCare },
  ]

  const calculatedMissing = standardFields
    .filter((f) => !f.value)
    .map((f) => f.label)

  normalized.missingFields = calculatedMissing
  return normalized
}

/**
 * Builds the strict, non-hallucinatory prompt for Legal Metrology package information extraction.
 */
function buildExtractionPrompt(rawOcrText, barcodeContext = null) {
  let contextBlock = ''
  if (barcodeContext && barcodeContext.value) {
    contextBlock = `\nPACKAGE IDENTIFIER / BARCODE DETECTED:\n- Barcode: ${barcodeContext.value}\n- Format: ${barcodeContext.type || 'Unknown'}\n(Note: The barcode identifies the product, but all Legal Metrology declarations must come from the package text.)\n`
  }

  return `You are an expert AI product information extraction assistant for the Legal Metrology Department inspection system.

YOUR SOLE RESPONSIBILITY:
Analyze the provided package OCR text and extract statutory packaged commodity declarations into a strict, structured JSON object.

STRICT INSTRUCTIONS:
1. Extract ONLY information that is explicitly stated or directly supported in the OCR text.
2. NEVER hallucinate, guess, invent, or assume missing values.
3. If a field or detail is not present in the OCR text, leave it as an empty string ("") or empty object.
4. AI MUST NOT DECIDE COMPLIANCE. You are ONLY extracting information. Do NOT evaluate legality, compliance, or violations. Do NOT include words such as "Compliant", "Non-compliant", "Violation", "Legal", "Illegal", "Pass", or "Fail" in any field.
5. Return ONLY a valid JSON object. Do NOT include any introductory or concluding text, explanations, or formatting outside the JSON object.

FIELDS TO EXTRACT:
- productName: Brand or trade name of the product.
- genericName: Common or generic name of the commodity (e.g., "Biscuits", "Washing Powder").
- manufacturer: { name: "", address: "" }
- packer: { name: "", address: "" }
- importer: { name: "", address: "" }
- countryOfOrigin: Country where manufactured / packed / imported from (e.g., "India", "Made in India").
- netQuantity: Declared net quantity including unit (e.g., "250 g", "1 kg", "500 ml", "10 Units").
- mrp: Maximum Retail Price as declared on the package, including currency symbol and tax statements if present (e.g., "₹120.00 (incl. of all taxes)").
- unitSalePrice: Declared unit sale price where present (e.g., "₹0.24 / g", "₹12.00 / 100g").
- manufactureDate: Declared date, month/year of manufacture or packing (e.g., "08/2026", "MFD: 15/06/2026").
- bestBefore: Declared best before period, expiry date, or use-by date (e.g., "Best before 12 months from packing", "EXP: 08/2027").
- consumerCare: Customer grievance / helpline details including phone number, email, or postal contact address.
- category: Suggested commodity category (choose from: "Food", "Electronics", "Cosmetics", "General").
- dimensions: Declared package dimensions where applicable.
- confidence: An integer between 0 and 100 representing your assessment of OCR clarity and extraction confidence.
- missingFields: Array of string labels for declarations that were NOT found in the OCR text.

OUTPUT SCHEMA (STRICT JSON ONLY):
{
  "productName": "",
  "genericName": "",
  "manufacturer": {
    "name": "",
    "address": ""
  },
  "packer": {
    "name": "",
    "address": ""
  },
  "importer": {
    "name": "",
    "address": ""
  },
  "countryOfOrigin": "",
  "netQuantity": "",
  "mrp": "",
  "unitSalePrice": "",
  "manufactureDate": "",
  "bestBefore": "",
  "consumerCare": "",
  "category": "",
  "dimensions": "",
  "confidence": 0,
  "missingFields": []
}

${contextBlock}
RAW PACKAGE OCR TEXT TO ANALYZE:
"""
${rawOcrText}
"""
`
}

/**
 * Builds a prompt variant that instructs Gemini to read the package image directly
 * (multimodal fallback used when OCR text extraction fails).
 */
function buildImageExtractionPrompt(barcodeContext = null) {
  let contextBlock = ''
  if (barcodeContext && barcodeContext.value) {
    contextBlock = `\nPACKAGE IDENTIFIER / BARCODE DETECTED:\n- Barcode: ${barcodeContext.value}\n- Format: ${barcodeContext.type || 'Unknown'}\n`
  }

  return `You are an expert AI product information extraction assistant for the Legal Metrology Department inspection system.

TASK:
Inspect the provided product package image and extract statutory packaged commodity declarations into a strict, structured JSON object.

IMPORTANT NOTES:
- Text OCR was unsuccessful on this image. Read the package text directly from the image pixels.
- Extract ONLY information that is explicitly visible in the package image.
- NEVER hallucinate, guess, invent, or assume missing values.
- If the image is too blurry or unreadable, return the schema with empty values.
- If a field is not visible in the image, leave it as an empty string ("") or empty object.
- AI MUST NOT DECIDE COMPLIANCE. You are ONLY extracting information. Do NOT include words such as "Compliant", "Non-compliant", "Violation", "Legal", "Illegal", "Pass", or "Fail" in any field.
- Return ONLY a valid JSON object. No surrounding text.
- Set "imageBased": true in the response and "extractionSource": "image".

${contextBlock}
OUTPUT SCHEMA (STRICT JSON ONLY):
{
  "productName": "",
  "genericName": "",
  "manufacturer": {
    "name": "",
    "address": ""
  },
  "packer": {
    "name": "",
    "address": ""
  },
  "importer": {
    "name": "",
    "address": ""
  },
  "countryOfOrigin": "",
  "netQuantity": "",
  "mrp": "",
  "unitSalePrice": "",
  "manufactureDate": "",
  "bestBefore": "",
  "consumerCare": "",
  "category": "",
  "dimensions": "",
  "confidence": 0,
  "missingFields": [],
  "imageBased": true,
  "extractionSource": "image"
}
`
}

function buildUnknownError() {
  const finalError = new Error('AI extraction could not be completed. Please try again.')
  finalError.code = 'AI_FAILED'
  finalError.userMessage = 'AI extraction could not be completed. Please try again.'
  return finalError
}

function makeError(code, userMessage) {
  const error = new Error(userMessage)
  error.code = code
  error.userMessage = userMessage
  return error
}

/**
 * Maps errors thrown by the @google/genai SDK (and network failures) to
 * clean, user-friendly, typed errors.
 */
function classifyGeminiError(err) {
  const status = err?.status || ''
  const message = err?.message || ''
  const cause = err?.cause?.message || ''
  const combined = `${status} ${message} ${cause}`

  if (
    /PERMISSION_DENIED|UNAUTHENTICATED/i.test(combined) ||
    /api key|invalid key|permission denied|unauthorized/i.test(`${message} ${cause}`)
  ) {
    return makeError(
      'INVALID_API_KEY',
      'Invalid Gemini API key. Please check VITE_GEMINI_API_KEY in your .env file or update the key.',
    )
  }
  if (/RESOURCE_EXHAUSTED|429/i.test(combined)) {
    return makeError('RATE_LIMIT', 'Gemini API rate limit reached. Please wait a moment and try again.')
  }
  if (/DEADLINE_EXCEEDED|timeout|timed out/i.test(combined)) {
    return makeError('TIMEOUT', 'AI extraction request timed out. Please try again.')
  }
  if (/INVALID_JSON|invalid JSON/.test(message)) {
    return makeError('INVALID_JSON', 'AI extraction could not be completed. Please try again.')
  }
  if (err instanceof TypeError && /fetch/i.test(message)) {
    return makeError(
      'NETWORK_ERROR',
      'Network error connecting to Gemini AI service. Please check your connection and try again.',
    )
  }
  return buildUnknownError()
}

/**
 * Shared Gemini generation call using the official @google/genai SDK.
 * Returns the normalized structured details.
 *
 * @param {string} prompt
 * @param {string} apiKey
 * @param {{ data: string, mimeType: string } | null} imagePart  optional image for multimodal (base64 data)
 */
async function callGemini(prompt, apiKey, imagePart = null) {
  const client = new GoogleGenAI({ apiKey })
  let lastError = null

  for (const model of DEFAULT_GEMINI_MODELS) {
    try {
      const parts = [{ text: prompt }]
      if (imagePart) {
        parts.push({
          inlineData: {
            mimeType: imagePart.mimeType,
            data: imagePart.data,
          },
        })
      }

      const response = await client.models.generateContent({
        model,
        contents: [{ role: 'user', parts }],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      })

      const textPart = response.text
      if (!textPart) {
        throw new Error('Empty response from AI model.')
      }

      const parsed = parseGeminiJson(textPart)
      return normalizeExtractedDetails(parsed)
    } catch (err) {
      lastError = err

      // Model not available / does not exist in this region - try next model in loop.
      if (err?.status === 'NOT_FOUND' || /(404|not found)/i.test(err?.message || '')) {
        console.warn('[GEMINI] Model', model, 'unavailable, attempting fallback model...')
        continue
      }

      const classified = classifyGeminiError(err)
      lastError = classified
      // Key / rate-limit / network errors won't be fixed by switching models - fail fast.
      if (classified.code !== 'AI_FAILED') break
      console.warn('[GEMINI] Model', model, 'failed, retrying next model...')
    }
  }

  console.error(
    '[GEMINI ERROR] All Gemini models failed:',
    lastError?.userMessage || lastError?.message || lastError,
  )
  throw lastError
}

/**
 * Unified, simple demo entry point.
 *
 * Sends either the real OCR text (preferred) or the package image directly to
 * Gemini using the official @google/genai SDK, and returns structured product
 * information.
 *
 * @param {Object} options
 * @param {string} options.ocrText   - Real OCR text extracted from the package image
 * @param {File|Blob} [options.imageFile] - Original package image (used when OCR text is empty)
 * @param {Object} [options.barcode] - Optional barcode object { value, type }
 * @param {string} [options.apiKey]  - Explicit API key (falls back to env/storage)
 * @returns {Promise<Object>} Structured extracted product information
 */
export async function extractProductInformation({
  ocrText,
  imageFile = null,
  barcode = null,
  apiKey = null,
} = {}) {
  const text = (ocrText || '').trim()
  const hasText = text.length > 0
  const hasImage = Boolean(imageFile)

  // 1. INPUT VALIDATION: never send fake/empty data to Gemini
  if (!hasText && !hasImage) {
    const error = new Error('Product image and OCR text are unavailable.')
    error.code = 'NO_INPUT'
    error.userMessage = 'Product image and OCR text are unavailable.'
    throw error
  }

  // 2. API KEY CHECK
  const activeKey = apiKey || getGeminiApiKey()
  if (!activeKey) {
    const error = new Error('Gemini API key is required.')
    error.code = 'MISSING_API_KEY'
    error.userMessage =
      'Gemini API key is required. Please set VITE_GEMINI_API_KEY in your .env file or enter your API key to continue.'
    throw error
  }

  // 3. TEXT-BASED EXTRACTION (preferred, no hallucinated data)
  if (hasText) {
    const prompt = buildExtractionPrompt(text, barcode)
    const result = await callGemini(prompt, activeKey)
    result.extractionSource = 'ocr'
    result.usedMultimodalFallback = false
    return result
  }

  // 4. MULTIMODAL FALLBACK: OCR text empty, send the image directly to Gemini
  const base64 = await blobToBase64(imageFile)
  const mimeType = imageFile.type || 'image/jpeg'
  const prompt = buildImageExtractionPrompt(barcode)
  const result = await callGemini(prompt, activeKey, { data: base64, mimeType })
  result.extractionSource = 'image'
  result.usedMultimodalFallback = true
  return result
}

/**
 * Text-only extraction. Kept for backward compatibility with existing
 * call sites and unit tests.
 */
export async function extractProductDetails({ rawOcrText, barcode = null, apiKey = null }) {
  // 1. INPUT VALIDATION: Never call Gemini with empty fake data
  if (!(rawOcrText || '').trim()) {
    const error = new Error('Unable to extract text from the image. Please run OCR again.')
    error.code = 'EMPTY_OCR'
    error.userMessage = 'Unable to extract text from the image. Please run OCR again.'
    throw error
  }

  return extractProductInformation({ ocrText: rawOcrText, imageFile: null, barcode, apiKey })
}

/**
 * Multimodal image-only extraction. Kept for backward compatibility.
 */
export async function extractProductDetailsFromImage({ image, barcode = null, apiKey = null }) {
  if (!image) {
    const error = new Error('No image was provided for AI extraction.')
    error.code = 'NO_IMAGE'
    error.userMessage = 'No image was provided for AI extraction.'
    throw error
  }

  return extractProductInformation({ ocrText: '', imageFile: image, barcode, apiKey })
}

/**
 * Converts a Blob/File into a base64 string (no data URL prefix).
 */
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    if (!blob) {
      reject(new Error('Invalid image blob for AI extraction.'))
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      const commaIndex = result.indexOf(',')
      resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result)
    }
    reader.onerror = () => {
      reject(new Error('Could not read image data for AI extraction.'))
    }
    reader.readAsDataURL(blob)
  })
}

export default {
  getGeminiApiKey,
  setGeminiApiKey,
  hasGeminiApiKey,
  extractProductInformation,
  extractProductDetails,
  extractProductDetailsFromImage,
}