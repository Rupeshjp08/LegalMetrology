/**
 * Local OCR-text product information extractor (SIH DEMO).
 *
 * Parses the ACTUAL OCR text produced by the app's OCR pipeline and maps
 * statutory package declarations into structured fields using keyword/pattern
 * matching. This module never calls any external API and NEVER invents values:
 * every field that cannot be matched against the OCR text is "Not available".
 */

const NA = 'Not available'

const CATEGORY_RULES = [
  { keywords: ['biscuit', 'cookies'], category: 'Food / Packaged Food' },
  { keywords: ['shampoo'], category: 'Personal Care' },
  { keywords: ['soap'], category: 'Personal Care' },
  { keywords: ['toothpaste', 'tooth brush', 'toothbrush'], category: 'Personal Care' },
  { keywords: ['detergent'], category: 'Household Product' },
  { keywords: ['noodle'], category: 'Food / Packaged Food' },
  { keywords: ['rice', 'atta', 'flour', 'oil', 'milk', 'chips', 'namkeen', 'snack', 'tea', 'coffee'],
    category: 'Food / Packaged Food' },
  { keywords: ['instant mix', 'masala'], category: 'Food / Packaged Food' },
]

const GENERIC_NAME_RULES = [
  { keyword: 'biscuit', generic: 'Biscuits' },
  { keyword: 'shampoo', generic: 'Shampoo' },
  { keyword: 'soap', generic: 'Soap' },
  { keyword: 'toothpaste', generic: 'Toothpaste' },
  { keyword: 'detergent', generic: 'Detergent' },
  { keyword: 'noodles', generic: 'Instant Noodles' },
  { keyword: 'chips', generic: 'Potato Chips / Snacks' },
  { keyword: 'rice', generic: 'Rice' },
  { keyword: 'oil', generic: 'Edible Oil' },
]

const SKIP_LINE_RE =
  /\b(MRP|M\.R\.P|MAX(IMUM)? RETAIL (PRICE|PRICE)|NET WEIGHT|NET QTY|NET WT|MF[DG]|MFG|MANUFACTUR(E|ED|ER)|DATE OF MANUFACTURE|PACK(ED|ER)?\s*BY|PACKER|IMPORT(ED)?\s*BY|IMPORTER|BEST BEFORE|USE BY|EXPIR|CONSUMER CARE|CUSTOMER CARE|HELPLINE|CONTACT|COUNTRY OF ORIGIN|MADE IN|UNIT (SALE )?PRICE|INCL(\.|UDING)? OF ALL TAXES|REGISTERED OFFICE|CORPORATE OFFICE|FSSAI|LIC\.? NO|CUSTOMER|WEBSITE|E-?MAIL|PHONE|TEL|FAX|CARE|TOLL)\b/i

function cleanInline(value) {
  return value
    .replace(/\s+/g, ' ')
    .replace(/[|•→>,;:/\\]+$/g, '')
    .trim()
}

function findValueAfterLabel(text, labels, maxLength = 140) {
  const label = labels.join('|')
  const regex = new RegExp(
    `(?:^|[\\n\\s/])(?:${label})\\s*[:\\-–\\.]?\\s*([^\\n]{1,${maxLength}})` +
      `(?:\\n|\\s+(?:N\\s?ET\\s|G\\s?ROSS\\s|B\\s?EST\\s|U\\s?SE\\s|M\\s?FD\\s|M\\s?FG\\s|E\\s?XP\\s|R\\s?EG\\s|A\\s?PPR\\s)\\s*(?=\\n))?`,
    'i',
  )
  const match = text.match(regex)
  if (!match) return null
  const value = cleanInline(match[1])
  return value.length > 0 ? value : null
}

function splitNameAddress(captured) {
  if (!captured) return { name: NA, address: NA }
  const parts = captured
    .split(',')
    .map((part) => cleanInline(part))
    .filter(Boolean)
  if (parts.length === 0) return { name: NA, address: NA }
  if (parts.length === 1) return { name: parts[0], address: NA }
  return { name: parts[0], address: parts.slice(1).join(', ') }
}

function extractManufacturer(text) {
  const captured = findValueAfterLabel(text, [
    'MANUFACTURED BY',
    'MANUFACTURER(?!\\s*(?:NAME\\s*:?|ADDRESS\\s*:?))',
    'MFD\\.?\\s?BY',
    'MFG\\.?\\s?BY',
  ])
  if (captured) return splitNameAddress(captured)
  const address = findValueAfterLabel(text, ['MANUFACTURING ADDRESS', 'MFG ADDRESS', 'MFD ADDRESS'])
  return { name: NA, address: address || NA }
}

function extractPacker(text) {
  const captured = findValueAfterLabel(text, [
    'PACKED BY',
    'PACKER',
    'PACKED & MARKETED BY',
    'PACKED AND MARKETED BY',
  ])
  return splitNameAddress(captured)
}

function extractImporter(text) {
  const captured = findValueAfterLabel(text, ['IMPORTED BY', 'IMPORTER', 'IMPORTED & MARKETED BY'])
  return splitNameAddress(captured)
}

function extractConsumerCare(text) {
  const captured = findValueAfterLabel(text, [
    'CONSUMER CARE',
    'CUSTOMER CARE',
    'TOLL\\s?-?FREE',
    'HELPLINE',
    'CONTACT(?!.*:(?:CONSUMER|CUSTOMER))',
  ])
  if (captured) return captured
  const emailMatch = text.match(/(?:mail|copyright)?\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i)
  if (emailMatch) return emailMatch[1]
  const phoneMatch = text.match(/(?<!\d)(?:\+?91[\s.-]?)?0?[6-9]\d{4}[\s.-]?\d{5}(?!\d)/)
  if (phoneMatch) return phoneMatch[0].replace(/\s/g, '')
  return NA
}

function extractDate(text, labels) {
  const captured = findValueAfterLabel(text, labels, 80)
  return captured || NA
}

function extractProductName(text) {
  const lines = text.split('\n')
  for (const rawLine of lines) {
    const line = cleanInline(rawLine)
    if (line.length < 2) continue
    if (!/[A-Za-z]/.test(line)) continue
    if (/^\d[\d\s,/.-]*$/.test(line)) continue
    if (SKIP_LINE_RE.test(line)) continue
    const letters = line.replace(/[^A-Za-z]/g, '')
    if (letters.length < 2) continue
    if (line.length > 48) continue
    const name = cleanInline(line)
    return name.length >= 2 ? name : NA
  }
  return NA
}

function determineCategory(text) {
  const lower = text.toLowerCase()
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((keyword) => lower.includes(keyword))) {
      return rule.category
    }
  }
  return NA
}

function determineGenericName(text, category) {
  const lower = text.toLowerCase()
  for (const rule of GENERIC_NAME_RULES) {
    if (lower.includes(rule.keyword)) return rule.generic
  }
  const labelled = findValueAfterLabel(text, ['GENERIC NAME', 'COMMON NAME'])
  if (labelled) return labelled
  if (category !== NA) return category
  return NA
}

/**
 * Extract structured product information from the actual OCR text.
 *
 * @param {string} ocrText Raw OCR text extracted from the uploaded image.
 * @returns {object} Product information. Every undetected field is "Not available".
 */
export function extractProductInformationFromOCR(ocrText) {
  const text = (ocrText || '').replace(/\r/g, '').trim()
  const hasValidText = text.length > 0 && /[A-Za-z0-9]/.test(text)

  if (!hasValidText) {
    return {
      productName: NA,
      genericName: NA,
      manufacturer: { name: NA, address: NA },
      packer: { name: NA, address: NA },
      importer: { name: NA, address: NA },
      countryOfOrigin: NA,
      netQuantity: NA,
      mrp: NA,
      unitSalePrice: NA,
      manufactureDate: NA,
      bestBefore: NA,
      consumerCare: NA,
      category: NA,
      dimensions: NA,
      confidence: null,
      isDemo: true,
      extractionSource: 'demo',
      missingFields: [],
    }
  }

  const category = determineCategory(text)
  const manufacturer = extractManufacturer(text)
  const packer = extractPacker(text)
  const importer = extractImporter(text)

  const data = {
    productName: extractProductName(text),
    genericName: determineGenericName(text, category),
    manufacturer,
    packer,
    importer,
    countryOfOrigin:
      findValueAfterLabel(text, ['COUNTRY OF ORIGIN', 'COUNTRY OF ORIGIN :'], 60) ||
      findValueAfterLabel(text, ['MADE IN', 'MADE IN :'], 60) ||
      NA,
    netQuantity:
      findValueAfterLabel(text, ['NET QUANTITY', 'NET WEIGHT', 'NET QTY', 'NET WT', 'NET WT\\.', 'NET W\\.'], 40) ||
      NA,
    mrp:
      findValueAfterLabel(text, ['M\\.R\\.P', 'MRP', 'MAXIMUM RETAIL PRICE', 'MAX RETAIL PRICE'], 60) ||
      NA,
    unitSalePrice: findValueAfterLabel(text, ['UNIT SALE PRICE', 'UNIT PRICE'], 60) || NA,
    manufactureDate: extractDate(text, ['MFG[\\s.]*DATE', 'MFD[\\s.]*DATE', 'DATE OF MANUFACTURE', 'MANUFACTURING DATE', 'MFD\\.?\\s?', 'MFG\\.?\\s?']),
    bestBefore:
      findValueAfterLabel(text, ['BEST BEFORE', 'BEST BEFORE USE', 'USE BY', 'EXPIRY DATE', 'EXP / BEST BEFORE', 'EXP'], 60) ||
      NA,
    consumerCare: extractConsumerCare(text),
    category,
    dimensions:
      findValueAfterLabel(text, ['DIMENSIONS', 'PACK DIMENSIONS', 'PRODUCT DIMENSIONS', 'DIM'], 50) || NA,
    confidence: null,
    isDemo: true,
    extractionSource: 'demo',
    missingFields: [],
  }

  const FIELD_LABELS = {
    productName: 'Product Name',
    genericName: 'Generic / Common Name',
    manufacturerName: 'Manufacturer Name',
    manufacturerAddress: 'Manufacturer Address',
    packerName: 'Packer Name',
    packerAddress: 'Packer Address',
    importerName: 'Importer Name',
    importerAddress: 'Importer Address',
    countryOfOrigin: 'Country of Origin',
    netQuantity: 'Net Quantity',
    mrp: 'MRP',
    unitSalePrice: 'Unit Sale Price',
    manufactureDate: 'Manufacture / Packing Date',
    bestBefore: 'Best Before / Use By',
    consumerCare: 'Consumer Care Details',
    category: 'Product Category',
    dimensions: 'Dimensions',
  }

  const isEmpty = (value) => !value || value === NA || value.trim() === ''

  const values = {
    productName: data.productName,
    genericName: data.genericName,
    manufacturerName: data.manufacturer.name,
    manufacturerAddress: data.manufacturer.address,
    packerName: data.packer.name,
    packerAddress: data.packer.address,
    importerName: data.importer.name,
    importerAddress: data.importer.address,
    countryOfOrigin: data.countryOfOrigin,
    netQuantity: data.netQuantity,
    mrp: data.mrp,
    unitSalePrice: data.unitSalePrice,
    manufactureDate: data.manufactureDate,
    bestBefore: data.bestBefore,
    consumerCare: data.consumerCare,
    category: data.category,
    dimensions: data.dimensions,
  }

  Object.keys(FIELD_LABELS).forEach((key) => {
    if (isEmpty(values[key])) data.missingFields.push(FIELD_LABELS[key])
  })

  return data
}

export default extractProductInformationFromOCR