import { useCallback, useEffect, useRef, useState } from 'react'
import EmptyState from '../../components/feedback/EmptyState/EmptyState'
import FileValidationMessage from '../../components/upload/FileValidationMessage/FileValidationMessage'
import Alert from '../../components/feedback/Alert/Alert'
import LoadingSpinner from '../../components/feedback/LoadingSpinner/LoadingSpinner'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'
import ActionCard from '../../components/upload/ActionCard/ActionCard'
import ImagePreviewCard from '../../components/upload/ImagePreviewCard/ImagePreviewCard'
import Button from '../../components/ui/Button/Button'
import Card from '../../components/ui/Card/Card'
import Icon from '../../components/ui/Icon/Icon'
import PageHeader from '../../components/ui/PageHeader/PageHeader'
import StatusBadge from '../../components/ui/StatusBadge/StatusBadge'
import { ROUTES } from '../../constants'
import {
  IMAGE_LABELS,
  UPLOAD_ACCEPT_ATTR,
  validateImageFile,
} from '../../utils/fileValidation'
import CameraCaptureModal from './CameraCaptureModal'
import QRBarcodeScannerModal from './QRBarcodeScannerModal'
import {
  lookupProductByCode,
  registerProduct,
  ProductLookupError,
} from '../../services/productCatalogService'
import './ScanProduct.css'

const SCAN_METHODS = [
  {
    key: 'upload',
    icon: 'upload',
    title: 'Upload Product Image',
    description: 'Upload clear images of the packaged commodity label.',
    ctaLabel: 'Upload Image',
  },
  {
    key: 'camera',
    icon: 'camera',
    title: 'Capture Image',
    description: 'Capture the product package using your device camera.',
    ctaLabel: 'Open Camera',
    usesVideoCapture: true,
  },
  {
    key: 'scan',
    icon: 'barcode',
    title: 'Scan QR / Barcode',
    description: 'Scan the QR code or barcode available on the package.',
    ctaLabel: 'Start Scanner',
    usesScanner: true,
  },
]

const PRODUCT_FIELD_DEFINITIONS = [
  { label: 'Product Name', keys: ['productName', 'name', 'title'] },
  { label: 'Brand / Manufacturer', keys: ['brand', 'manufacturer', 'brandName', 'manufacturerName'] },
  { label: 'Barcode', keys: ['barcode', 'barCode', 'ean', 'gtin', 'code'] },
  { label: 'Category', keys: ['category'] },
  { label: 'Net Quantity', keys: ['netQuantity', 'netWeight', 'quantity', 'packSize'] },
  { label: 'MRP', keys: ['mrp', 'maxRetailPrice', 'maximumRetailPrice', 'unitPrice'] },
  { label: 'Country of Origin', keys: ['countryOfOrigin', 'origin', 'country'] },
  { label: 'Batch / Lot Number', keys: ['batchNumber', 'batchNo', 'lotNumber', 'lotNo'] },
  { label: 'Manufacturing Date', keys: ['manufacturingDate', 'mfgDate', 'dateOfManufacture', 'dateOfPackaging'] },
  { label: 'Expiry / Best Before', keys: ['expiryDate', 'bestBefore', 'expDate', 'useByDate'] },
]

function pickScalarValue(value) {
  if (value === null || value === undefined) return null
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed || null
  }
  if (typeof value === 'number') {
    const string = String(value).trim()
    return string || null
  }
  if (Array.isArray(value)) {
    const joined = value.map(pickScalarValue).filter(Boolean).join(', ')
    return joined || null
  }
  if (typeof value === 'object') {
    for (const key of ['value', 'label', 'text', 'rawText', 'string']) {
      const nested = pickScalarValue(value[key])
      if (nested) return nested
    }
  }
  return null
}

function extractProductFields(product) {
  if (!product || typeof product !== 'object') return []

  const normalized = new Map(
    Object.entries(product).map(([key, value]) => [
      key.toLowerCase().replace(/[^a-z0-9]/g, ''),
      value,
    ]),
  )

  return PRODUCT_FIELD_DEFINITIONS.map(({ label, keys }) => {
    let found = null
    for (const key of keys) {
      found = pickScalarValue(product[key])
      if (found) break
      const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '')
      if (normalized.has(normalizedKey)) {
        found = pickScalarValue(normalized.get(normalizedKey))
        if (found) break
      }
    }
    return found ? { label, value: found } : null
  }).filter(Boolean)
}

export default function ScanProduct() {
  const pickerRef = useRef(null)
  const previewUrlsRef = useRef([])

  const [images, setImages] = useState([])
  const [uploadErrors, setUploadErrors] = useState([])
  const [cameraOpen, setCameraOpen] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [productCode, setProductCode] = useState(null)
  const [productLookup, setProductLookup] = useState({ status: 'idle' })
  const [continueNotice, setContinueNotice] = useState(false)
  const [registrationMode, setRegistrationMode] = useState(false)
  const [registrationImage, setRegistrationImage] = useState(null)
  const [registrationForm, setRegistrationForm] = useState({
    productName: '',
    brand: '',
    category: '',
    mrp: '',
    netQuantity: '',
    countryOfOrigin: '',
    batchNumber: '',
    manufacturingDate: '',
    expiryDate: '',
  })
  const [registrationStatus, setRegistrationStatus] = useState({ status: 'idle' })
  const [registrationPreviewUrl, setRegistrationPreviewUrl] = useState(null)
  const registrationPreviewUrlRef = useRef(null)
  const lookupIdRef = useRef(0)

  const openPicker = () => pickerRef.current?.click()

  const handleCameraCapture = (file) => {
    if (registrationMode) {
      setRegistrationImage(file)
      const url = URL.createObjectURL(file)
      setRegistrationPreviewUrl(url)
      registrationPreviewUrlRef.current = url
      setCameraOpen(false)
    } else {
      addImages([file])
    }
  }

  const performProductLookup = useCallback((code) => {
    const lookupId = ++lookupIdRef.current
    setProductLookup({ status: 'loading', code })

    lookupProductByCode(code)
      .then((data) => {
        if (lookupIdRef.current !== lookupId) return
        setProductLookup({ status: 'success', data, code })
      })
      .catch((error) => {
        if (lookupIdRef.current !== lookupId) return
        console.error('[ProductLookup] Failed for code', code, error)
        const isNotFound = error instanceof ProductLookupError && error.isNotFound
        setProductLookup({ status: isNotFound ? 'notfound' : 'unavailable', code })
        if (isNotFound) {
          setRegistrationMode(true)
          setCameraOpen(true)
        }
      })
  }, [])

  const handleScanResult = (code) => {
    setScannerOpen(false)
    const frame = code.frame ? { dataUrl: code.frame.dataUrl, region: code.frame.region } : null
    setProductCode({ type: code.format, value: code.text, frame })
    performProductLookup(code.text)
  }

  const handleRetryLookup = () => {
    if (!productCode) return
    performProductLookup(productCode.value)
  }

  const clearScanResult = () => {
    lookupIdRef.current += 1
    setProductCode(null)
    setProductLookup({ status: 'idle' })
  }

  const handleScanAgain = () => {
    clearScanResult()
    setRegistrationMode(false)
    setRegistrationImage(null)
    setRegistrationStatus({ status: 'idle' })
    setScannerOpen(true)
  }

  const handleRemove = () => {
    clearScanResult()
    setRegistrationMode(false)
    setRegistrationImage(null)
    setRegistrationStatus({ status: 'idle' })
  }

  const handleRequestUpload = () => {
    setScannerOpen(false)
    openPicker()
  }

  const addImages = useCallback((incoming) => {
    if (!incoming || incoming.length === 0) return

    const errors = []
    const accepted = []

    incoming.forEach((file) => {
      const error = validateImageFile(file)
      if (error) {
        errors.push(`${file.name}: ${error}`)
        return
      }

      const previewUrl = URL.createObjectURL(file)
      previewUrlsRef.current.push(previewUrl)
      accepted.push({
        id: `${file.name}-${file.lastModified}-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
        file,
        previewUrl,
        label: IMAGE_LABELS[0].value,
      })
    })

    setUploadErrors(errors)
    setImages((previous) => [...previous, ...accepted])
  }, [])

  const handleFilesSelected = (event) => {
    addImages(Array.from(event.target.files || []))
    event.target.value = ''
  }

  const releasePreviewUrl = useCallback((previewUrl) => {
    URL.revokeObjectURL(previewUrl)
    previewUrlsRef.current = previewUrlsRef.current.filter((url) => url !== previewUrl)
  }, [])

  const handleRemoveImage = (id) => {
    setImages((previous) => {
      const target = previous.find((image) => image.id === id)
      if (target?.previewUrl) releasePreviewUrl(target.previewUrl)
      return previous.filter((image) => image.id !== id)
    })
    setContinueNotice(false)
  }

  const handleReplaceImage = (id, file) => {
    const error = validateImageFile(file)
    if (error) {
      setUploadErrors([`${file.name}: ${error}`])
      return
    }

    const newPreviewUrl = URL.createObjectURL(file)
    previewUrlsRef.current.push(newPreviewUrl)

    setUploadErrors([])
    setImages((previous) =>
      previous.map((image) => {
        if (image.id !== id) return image
        releasePreviewUrl(image.previewUrl)
        return { ...image, file, previewUrl: newPreviewUrl }
      }),
    )
  }

  const handleLabelChange = (id, label) => {
    setImages((previous) =>
      previous.map((image) => (image.id === id ? { ...image, label } : image)),
    )
  }

  const handleContinue = () => {
    setContinueNotice(true)
  }

  const handleRegistrationFormChange = (field, value) => {
    setRegistrationForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleRegisterSubmit = async (event) => {
    event.preventDefault()
    setRegistrationStatus({ status: 'loading' })
    try {
      const payload = { ...registrationForm }
      if (productCode) {
        payload.barcode = productCode.value
      }
      await registerProduct(payload, registrationImage)
      setRegistrationStatus({ status: 'success' })
    } catch (error) {
      console.error('[RegisterProduct] Failed', error)
      setRegistrationStatus({ status: 'error', message: error.message || 'Registration failed.' })
    }
  }

  const handleRegisterReset = () => {
    setRegistrationMode(false)
    setRegistrationImage(null)
    if (registrationPreviewUrlRef.current) URL.revokeObjectURL(registrationPreviewUrlRef.current)
    registrationPreviewUrlRef.current = null
    setRegistrationPreviewUrl(null)
    setRegistrationForm({
      productName: '',
      brand: '',
      category: '',
      mrp: '',
      netQuantity: '',
      countryOfOrigin: '',
      batchNumber: '',
      manufacturingDate: '',
      expiryDate: '',
    })
    setRegistrationStatus({ status: 'idle' })
    clearScanResult()
  }

  const handleRegisterRetry = () => {
    setRegistrationImage(null)
    if (registrationPreviewUrlRef.current) URL.revokeObjectURL(registrationPreviewUrlRef.current)
    registrationPreviewUrlRef.current = null
    setRegistrationPreviewUrl(null)
    setRegistrationStatus({ status: 'idle' })
    setCameraOpen(true)
  }

  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
      if (registrationPreviewUrlRef.current) URL.revokeObjectURL(registrationPreviewUrlRef.current)
    }
  }, [])

  return (
    <div className="container">
      <Breadcrumb
        items={[
          { to: ROUTES.DASHBOARD, label: 'Dashboard' },
          { label: 'Product Inspection' },
        ]}
      />

      <PageHeader
        overline="Legal Metrology · Product Scanning"
        title="Product Inspection"
        description="Scan or upload packaged commodity information for Legal Metrology compliance inspection."
      />

      <input
        ref={pickerRef}
        type="file"
        accept={UPLOAD_ACCEPT_ATTR}
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={handleFilesSelected}
      />

      <section className="scan-section" aria-labelledby="scan-methods-title">
        <h2 id="scan-methods-title" className="scan-section__title">
          Scan Methods
        </h2>
        <div className="scan-actions">
          {SCAN_METHODS.map((method) => (
            <ActionCard
              key={method.key}
              icon={method.icon}
              title={method.title}
              description={method.description}
            >
              {method.key === 'upload' ? (
                <Button icon="upload" onClick={openPicker}>
                  {method.ctaLabel}
                </Button>
              ) : method.usesVideoCapture ? (
                <Button variant="outline" icon={method.icon} onClick={() => setCameraOpen(true)}>
                  {method.ctaLabel}
                </Button>
              ) : method.usesScanner ? (
                <Button
                  variant="outline"
                  icon={method.icon}
                  onClick={() => setScannerOpen(true)}
                >
                  {method.ctaLabel}
                </Button>
              ) : (
                <Button variant="outline" icon={method.icon}>
                  {method.ctaLabel}
                </Button>
              )}
            </ActionCard>
          ))}
        </div>
      </section>

      <section className="scan-section" aria-labelledby="scan-images-title">
        <h2 id="scan-images-title" className="scan-section__title">
          Inspection Images
        </h2>
        <Card>
          {uploadErrors.length > 0 && (
            <div className="scan-upload-messages">
              <FileValidationMessage
                tone="error"
                title="Some images could not be added"
                messages={uploadErrors}
              />
            </div>
          )}

          {images.length === 0 ? (
            <EmptyState
              icon="image"
              title="No product images added yet."
              description="Upload or capture a product package image to begin the inspection."
              action={
                <Button icon="upload" onClick={openPicker}>
                  Upload Image
                </Button>
              }
            />
          ) : (
            <div className="scan-preview-grid">
              {images.map((image) => (
                <ImagePreviewCard
                  key={image.id}
                  image={image}
                  onRemove={handleRemoveImage}
                  onLabelChange={handleLabelChange}
                  onReplace={handleReplaceImage}
                />
              ))}
            </div>
          )}
        </Card>
      </section>

      <section className="scan-section scan-continue" aria-label="Continue inspection">
        <Button
          variant="primary"
          size="lg"
          icon="arrowRight"
          iconPosition="right"
          disabled={images.length === 0}
          onClick={handleContinue}
        >
          Continue
        </Button>
        {continueNotice && (
          <div className="scan-continue__notice" role="status">
            <Icon name="info" size={18} className="scan-continue__notice-icon" />
            <span>
              Product images are ready. Further inspection steps will be added next.
            </span>
          </div>
        )}
      </section>

      {productCode && (
        <section className="scan-section" aria-labelledby="scan-product-code-title">
          <Card
            title="Product Identified"
            subtitle="Detected from the package QR code or barcode."
            meta={<StatusBadge status="verified" label="Barcode identified" />}
          >
            <div className="scan-product-code">
              {productCode.frame?.dataUrl && (
                <div className="scan-product-code__capture">
                  <img
                    src={productCode.frame.dataUrl}
                    alt="Captured barcode or QR code region"
                  />
                </div>
              )}
              <dl className="scan-product-code__details">
                <div className="scan-product-code__row">
                  <dt>Barcode</dt>
                  <dd className="scan-product-code__value" title={productCode.value}>
                    {productCode.value}
                  </dd>
                </div>
                <div className="scan-product-code__row">
                  <dt>Format</dt>
                  <dd>{productCode.type}</dd>
                </div>
              </dl>

              <div className="scan-product-code__actions">
                <Button variant="outline" size="sm" icon="barcode" onClick={handleScanAgain}>
                  Scan Again
                </Button>
                <Button variant="danger" size="sm" icon="trash" onClick={handleRemove}>
                  Remove
                </Button>
              </div>
            </div>
          </Card>
        </section>
      )}

      {productCode && productLookup.status !== 'idle' && (
        <section className="scan-section" aria-labelledby="scan-product-details-title">
          <h2 id="scan-product-details-title" className="scan-section__title">
            Product Details
          </h2>

          {productLookup.status === 'loading' && (
            <Card>
              <div className="scan-lookup-loading" role="status">
                <LoadingSpinner />
                <span>Looking up product details…</span>
              </div>
            </Card>
          )}

          {productLookup.status === 'success' && (() => {
            const fields = extractProductFields(productLookup.data)
            return (
              <Card
                title="Product Identified"
                subtitle="Values retrieved from the Legal Metrology product catalog."
                meta={<StatusBadge status="verified" label="Product identified" />}
              >
                <div className="scan-details-note" role="status">
                  <Icon name="check-circle" size={16} className="scan-details-note__icon" />
                  <span>Barcode successfully identified</span>
                </div>

                {fields.length > 0 ? (
                  <dl className="scan-product-details">
                    {fields.map((field) => (
                      <div className="scan-product-details__row" key={field.label}>
                        <dt>{field.label}</dt>
                        <dd>{field.value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="scan-details-empty">
                    No product details were returned for this code.
                  </p>
                )}

                <p className="scan-details-source">
                  Data source: {productLookup.data?.dataSource || 'Legal Metrology product database'}
                </p>

                <div className="scan-continue-inspection">
                  <Button
                    variant="outline"
                    icon="barcode"
                    onClick={handleScanAgain}
                  >
                    Scan Again
                  </Button>
                  <Button variant="primary" icon="arrowRight" iconPosition="right" onClick={handleContinue}>
                    Continue Inspection
                  </Button>
                </div>
              </Card>
            )
          })()}

          {(productLookup.status === 'notfound' || productLookup.status === 'unavailable') && (
            <Card title="Product Details">
              <Alert
                tone={productLookup.status === 'notfound' ? 'warning' : 'error'}
                title={
                  productLookup.status === 'notfound'
                    ? 'Barcode detected, but product information was not found.'
                    : 'Product details are currently unavailable.'
                }
              >
                <p className="scan-lookup-code">
                  Barcode: <strong>{productCode.value}</strong> · Format:{' '}
                  <strong>{productCode.type}</strong>
                </p>
                {registrationMode && !registrationImage && (
                  <p className="scan-lookup-hint">
                    Capture the product image to register it as a new product in the catalog.
                  </p>
                )}
                {registrationMode && registrationImage && (
                  <p className="scan-lookup-hint">
                    Fill in the product details below to register this new product.
                  </p>
                )}
                {!registrationMode && (
                  <p className="scan-lookup-hint">
                    Product information will be retrieved from the product database when available.
                  </p>
                )}
              </Alert>

              {registrationMode && registrationStatus.status !== 'success' && (
                <div className="scan-registration">
                  {registrationImage ? (
                    <div className="scan-registration__capture">
                      <img
                        src={registrationPreviewUrl}
                        alt="Captured product"
                        className="scan-registration__image"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        icon="camera"
                        onClick={handleRegisterRetry}
                      >
                        Retake Photo
                      </Button>
                    </div>
                  ) : (
                    <div className="scan-registration__pending">
                      <Button
                        variant="primary"
                        icon="camera"
                        onClick={() => setCameraOpen(true)}
                        disabled={registrationStatus.status === 'loading'}
                      >
                        Capture Product Image
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRegisterReset}
                        disabled={registrationStatus.status === 'loading'}
                      >
                        Cancel Registration
                      </Button>
                    </div>
                  )}

                  {registrationImage && registrationStatus.status !== 'loading' && (
                    <form className="scan-registration__form" onSubmit={handleRegisterSubmit}>
                      <h3 className="scan-registration__title">New Product Registration</h3>
                      <div className="scan-registration__fields">
                        <label className="scan-registration__field">
                          <span>Product Name *</span>
                          <input
                            type="text"
                            required
                            value={registrationForm.productName}
                            onChange={(e) => handleRegistrationFormChange('productName', e.target.value)}
                          />
                        </label>
                        <label className="scan-registration__field">
                          <span>Brand / Manufacturer *</span>
                          <input
                            type="text"
                            required
                            value={registrationForm.brand}
                            onChange={(e) => handleRegistrationFormChange('brand', e.target.value)}
                          />
                        </label>
                        <label className="scan-registration__field">
                          <span>Barcode</span>
                          <input
                            type="text"
                            value={productCode?.value || ''}
                            readOnly
                            className="scan-registration__readonly"
                          />
                        </label>
                        <label className="scan-registration__field">
                          <span>Category *</span>
                          <select
                            required
                            value={registrationForm.category}
                            onChange={(e) => handleRegistrationFormChange('category', e.target.value)}
                          >
                            <option value="">Select category</option>
                            <option value="Food">Food</option>
                            <option value="Electronics">Electronics</option>
                            <option value="Cosmetics">Cosmetics</option>
                            <option value="General">General</option>
                          </select>
                        </label>
                        <label className="scan-registration__field">
                          <span>MRP *</span>
                          <input
                            type="text"
                            required
                            placeholder="e.g. ₹299"
                            value={registrationForm.mrp}
                            onChange={(e) => handleRegistrationFormChange('mrp', e.target.value)}
                          />
                        </label>
                        <label className="scan-registration__field">
                          <span>Net Quantity *</span>
                          <input
                            type="text"
                            required
                            placeholder="e.g. 500 g"
                            value={registrationForm.netQuantity}
                            onChange={(e) => handleRegistrationFormChange('netQuantity', e.target.value)}
                          />
                        </label>
                        <label className="scan-registration__field">
                          <span>Country of Origin</span>
                          <input
                            type="text"
                            value={registrationForm.countryOfOrigin}
                            onChange={(e) => handleRegistrationFormChange('countryOfOrigin', e.target.value)}
                          />
                        </label>
                        <label className="scan-registration__field">
                          <span>Batch / Lot Number</span>
                          <input
                            type="text"
                            value={registrationForm.batchNumber}
                            onChange={(e) => handleRegistrationFormChange('batchNumber', e.target.value)}
                          />
                        </label>
                        <label className="scan-registration__field">
                          <span>Manufacturing Date</span>
                          <input
                            type="date"
                            value={registrationForm.manufacturingDate}
                            onChange={(e) => handleRegistrationFormChange('manufacturingDate', e.target.value)}
                          />
                        </label>
                        <label className="scan-registration__field">
                          <span>Expiry / Best Before</span>
                          <input
                            type="date"
                            value={registrationForm.expiryDate}
                            onChange={(e) => handleRegistrationFormChange('expiryDate', e.target.value)}
                          />
                        </label>
                      </div>
                      <div className="scan-registration__actions">
                        <Button
                          type="submit"
                          variant="primary"
                          icon="check"
                          disabled={registrationStatus.status === 'loading'}
                        >
                          {registrationStatus.status === 'loading' ? 'Registering…' : 'Register Product'}
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={handleRegisterReset}
                          disabled={registrationStatus.status === 'loading'}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  )}

                  {registrationStatus.status === 'loading' && (
                    <div className="scan-registration__loading" role="status">
                      <LoadingSpinner />
                      <span>Registering product…</span>
                    </div>
                  )}
                </div>
              )}

              {registrationStatus.status === 'success' && (
                <Alert tone="success" title="Product registered successfully!">
                  <p>
                    <strong>{registrationForm.productName}</strong> has been added to the product catalog.
                  </p>
                  <div className="scan-registration__post-actions">
                    <Button variant="primary" icon="barcode" onClick={handleRegisterReset}>
                      Scan Another Product
                    </Button>
                  </div>
                </Alert>
              )}

              {registrationStatus.status === 'error' && (
                <Alert tone="error" title="Registration failed">
                  <p>{registrationStatus.message}</p>
                  <div className="scan-registration__post-actions">
                    <Button variant="primary" onClick={handleRegisterSubmit}>
                      Retry
                    </Button>
                    <Button variant="ghost" onClick={handleRegisterReset}>
                      Cancel
                    </Button>
                  </div>
                </Alert>
              )}

              {!registrationMode && (
                <div className="scan-lookup-actions">
                  <Button variant="primary" onClick={handleRetryLookup}>
                    Try Again
                  </Button>
                  <Button variant="outline" icon="barcode" onClick={handleScanAgain}>
                    Scan Another Code
                  </Button>
                  <Button variant="ghost" icon="arrowRight" iconPosition="right" onClick={handleContinue}>
                    Continue with Manual / Product Image Inspection
                  </Button>
                </div>
              )}
            </Card>
          )}
        </section>
      )}

      <CameraCaptureModal
        open={cameraOpen}
        onClose={() => {
          setCameraOpen(false)
          if (registrationMode && !registrationImage) {
            setRegistrationMode(false)
          }
        }}
        onCapture={handleCameraCapture}
      />

      <QRBarcodeScannerModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onResult={handleScanResult}
        onRequestUpload={handleRequestUpload}
      />
    </div>
  )
}
