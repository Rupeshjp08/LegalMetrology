import apiClient from './api/apiClient'
import ApiEndpoints from './api/endpoints'

const OPEN_FOOD_FACTS_TIMEOUT_MS = 8000

/**
 * Classified error thrown by product lookup helpers so the UI can show a
 * clear, honest state without inventing product information.
 */
export class ProductLookupError extends Error {
  constructor(message, options = {}) {
    super(message)
    this.name = 'ProductLookupError'
    this.isNotFound = Boolean(options.isNotFound)
    this.cause = options.cause
  }
}

/**
 * Registers a new product in the Legal Metrology product catalog.
 *
 * Used when a scanned barcode is not found in the existing database.
 * The captured image is attached as a file upload alongside the product
 * metadata fields.
 *
 * @param {object} productData Product metadata fields.
 * @param {File} [imageFile] Optional captured product image.
 * @returns {Promise<object>} The created product record.
 * @throws {ProductLookupError} If registration fails.
 */
export async function registerProduct(productData, imageFile = null) {
  try {
    const formData = new FormData()
    Object.entries(productData).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        formData.append(key, value)
      }
    })
    if (imageFile) {
      formData.append('image', imageFile)
    }

    const { data } = await apiClient.post(ApiEndpoints.PRODUCTS.REGISTER, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  } catch (error) {
    throw new ProductLookupError('Failed to register the new product.', {
      cause: error,
    })
  }
}

/**
 * Looks up a product from the Legal Metrology product catalog using a
 * QR/barcode identifier.
 *
 * Uses the existing central API client + endpoint map. The code value is
 * only an identifier — no product data is generated or mocked here.
 *
 * @param {string} code Detected QR/barcode value.
 * @returns {Promise<object>} Product record from the data source.
 * @throws {ProductLookupError} Classified lookup failure.
 */
export async function lookupProductByCode(code) {
  const normalizedCode = String(code || '').trim()
  if (!normalizedCode) {
    throw new ProductLookupError('A barcode is required for product lookup.', { isNotFound: true })
  }

  try {
    const { data } = await apiClient.get(ApiEndpoints.PRODUCTS.LOOKUP_BY_CODE(normalizedCode))
    return data
  } catch (error) {
    const status = error?.response?.status

    if (status === 400 || status === 404 || status === 422) {
      const externalProduct = await lookupOpenFoodFacts(normalizedCode)
      if (externalProduct) return externalProduct
      throw new ProductLookupError('Product not found for the given code.', { isNotFound: true, cause: error })
    }

    const externalProduct = await lookupOpenFoodFacts(normalizedCode)
    if (externalProduct) return externalProduct
    throw new ProductLookupError('The product service is currently unavailable.', {
      cause: error,
    })
  }
}

/**
 * Use the public Open Food Facts catalog as a read-only fallback when the
 * application's Legal Metrology API is unavailable or has no matching record.
 * Only numeric retail barcodes are sent to the external catalog.
 */
async function lookupOpenFoodFacts(code) {
  if (!/^\d{8,14}$/.test(code)) return null

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), OPEN_FOOD_FACTS_TIMEOUT_MS)

  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json`,
      { headers: { Accept: 'application/json' }, signal: controller.signal },
    )
    if (!response.ok) return null

    const payload = await response.json()
    if (payload?.status !== 1 || !payload.product) return null

    const product = payload.product
    return {
      productName: product.product_name || product.product_name_en || '',
      brand: product.brands || '',
      barcode: code,
      category: product.categories || '',
      netQuantity: product.quantity || '',
      countryOfOrigin: product.countries || '',
      dataSource: 'Open Food Facts',
    }
  } catch {
    return null
  } finally {
    clearTimeout(timeoutId)
  }
}