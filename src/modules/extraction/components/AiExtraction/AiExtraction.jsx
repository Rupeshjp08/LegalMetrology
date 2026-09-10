import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Button from '../../../../components/ui/Button/Button'
import Card from '../../../../components/ui/Card/Card'
import Alert from '../../../../components/feedback/Alert/Alert'
import LoadingSpinner from '../../../../components/feedback/LoadingSpinner/LoadingSpinner'
import StatusBadge from '../../../../components/ui/StatusBadge/StatusBadge'
import Icon from '../../../../components/ui/Icon/Icon'
import Modal from '../../../../components/ui/Modal/Modal'
import {
  extractProductInformation,
  getGeminiApiKey,
  setGeminiApiKey,
} from '../../services/geminiExtractionService'
import { extractProductInformationFromOCR } from '../../../../services/productInfoExtractor'
import './AiExtraction.css'

// DEMO MODE (SIH demonstration only): when enabled, NO Gemini API is called and
// no API key is required. Product information is derived LOCALLY from the actual
// OCR text of the uploaded image using keyword/pattern matching. Nothing is
// invented - any field not detected in the OCR text is "Not available".
const DEMO_AI_MODE = true
const DEMO_EXTRACTION_DELAY_MS = 1000

/**
 * STEP 8: GEMINI AI PRODUCT INFORMATION EXTRACTION
 *
 * Takes actual OCR text from STEP 7 and invokes Gemini AI to extract
 * and structure statutory package declarations into official fields.
 *
 * Adheres to Legal Metrology Department inspection principles:
 * 1. AI only extracts and structures; it NEVER decides compliance, violations, or legality.
 * 2. Real OCR text is used; zero hardcoded/mock AI data.
 * 3. Strict JSON schema; absent fields remain empty (no hallucination).
 * 4. Officer-review interface with manual editing and audit marking.
 * 5. Full source traceability separating Original Image, Processed Image, Raw OCR Text, and AI Data.
 */
export default function AiExtraction({
  items = [],
  productCode = null,
  onBackToOcr,
  onContinueToCompliance,
  onStartNewInspection,
  onRetake,
  onExtractionSuccess,
}) {
  const [status, setStatus] = useState('idle') // 'idle' | 'loading' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState(null)
  const [extractedData, setExtractedData] = useState(null)
  const [extractionMethod, setExtractionMethod] = useState(null) // 'ocr' | 'image'
  const [accepted, setAccepted] = useState(false)
  const [manuallyEdited, setManuallyEdited] = useState(false)
  const [editedFields, setEditedFields] = useState({})
  const [activeTab, setActiveTab] = useState('details') // 'details' | 'ocr' | 'images'
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editForm, setEditForm] = useState(null)
  const [keyInput, setKeyInput] = useState('')
  const [showKeyInput, setShowKeyInput] = useState(false)
  const [saveKeyToSession, setSaveKeyToSession] = useState(true)
  const [ocrTextModalOpen, setOcrTextModalOpen] = useState(false)

  const runCountRef = useRef(0)

  // Combine actual OCR text from all processed images
  const combinedOcrText = useMemo(() => {
    if (!items || items.length === 0) return ''
    return items
      .map((item) => (item.rawOcrText || '').trim())
      .filter(Boolean)
      .join('\n\n')
  }, [items])

  const hasOcrText = combinedOcrText.trim().length > 0

  // Human-readable heading for the error card, derived from the message.
  const errorTitle = (() => {
    if (!errorMessage) return 'AI extraction could not be completed. Please try again.'
    if (/api key/i.test(errorMessage)) return 'INVALID API KEY'
    if (/network/i.test(errorMessage)) return 'NETWORK ERROR'
    if (/timed out/i.test(errorMessage) || /timeout/i.test(errorMessage)) return 'REQUEST TIMEOUT'
    if (/rate limit/i.test(errorMessage)) return 'RATE LIMIT REACHED'
    if (/no image|no textual|ocr|readable text/i.test(errorMessage)) return 'OCR_TEXT_EMPTY'
    return 'GEMINI_EXTRACTION_FAILED'
  })()

  // The primary image for preview
  const primaryItem = items && items.length > 0 ? items[0] : null

  // Fetch an actual Blob from the original/processed image URL for multimodal fallback.
  const getFallbackImageBlob = useCallback(async () => {
    if (!items || items.length === 0) return null
    for (const item of items) {
      const url = item.originalImage || item.processedImage
      if (!url) continue
      try {
        const response = await fetch(url)
        if (!response.ok) continue
        const blob = await response.blob()
        if (blob && blob.size > 0) {
          return blob
        }
      } catch (err) {
        console.warn('[AiExtraction] Could not fetch fallback image URL:', url, err.message)
      }
    }
    return null
  }, [items])

  const handleExtractionError = useCallback((error) => {
    if (error.code === 'MISSING_API_KEY') {
      setShowKeyInput(true)
    }
    setStatus('error')
    setErrorMessage(
      error.userMessage || 'AI extraction could not be completed. Please try again.',
    )
  }, [])

  // Core extraction runner. mode: 'auto' | 'ocr' | 'image'
  const runExtraction = useCallback(
    async (mode = 'auto', explicitKey = null) => {
      // DEMO MODE: derive product information from the ACTUAL OCR text stored in
      // this component's state. No Gemini API call, no API key, no fixed data.
      if (DEMO_AI_MODE) {
        if (!combinedOcrText.trim()) {
          setStatus('error')
          setErrorMessage(
            'No readable text was detected in the uploaded image. Please go back and retry OCR or upload another image.',
          )
          setShowKeyInput(false)
          return
        }
        const demoToken = ++runCountRef.current
        setStatus('loading')
        setErrorMessage(null)
        setShowKeyInput(false)
        await new Promise((resolve) => setTimeout(resolve, DEMO_EXTRACTION_DELAY_MS))
        if (runCountRef.current !== demoToken) return
        setExtractedData(extractProductInformationFromOCR(combinedOcrText))
        setExtractionMethod('demo')
        setAccepted(false)
        setManuallyEdited(false)
        setEditForm(null)
        setStatus('success')
        if (onExtractionSuccess) onExtractionSuccess()
        return
      }

      const activeKey = explicitKey || getGeminiApiKey()
      if (!activeKey) {
        setStatus('error')
        setErrorMessage('Gemini API key is required. Please provide your API key to continue.')
        setShowKeyInput(true)
        return
      }

      const runToken = ++runCountRef.current
      setStatus('loading')
      setErrorMessage(null)

      // 1) OCR-text-based extraction (only when real OCR text is available)
      if (hasOcrText && mode !== 'image') {
        try {
          const result = await extractProductInformation({
            ocrText: combinedOcrText,
            imageFile: null,
            barcode: productCode,
            apiKey: activeKey,
          })
          if (runCountRef.current !== runToken) return
          setExtractedData(result)
          setExtractionMethod('ocr')
          setStatus('success')
          setAccepted(false)
          setShowKeyInput(false)
          return
        } catch (error) {
          if (runCountRef.current !== runToken) return
          console.warn('[AiExtraction] OCR-text extraction failed, trying image fallback:', error.code || '', error.userMessage || error.message || error)
          if (mode === 'ocr') {
            // User explicitly requested OCR-only extraction; surface the error.
            handleExtractionError(error)
            return
          }
          if (error.code === 'MISSING_API_KEY') {
            handleExtractionError(error)
            return
          }
          console.warn('[AiExtraction] Falling back to image-based AI extraction...')
          // Fall through to image-based extraction
        }
      }

      // 2) Multimodal image fallback (original image sent directly to Gemini)
      if (mode !== 'ocr') {
        try {
          const fallbackBlob = await getFallbackImageBlob()
          if (!fallbackBlob) {
            const err = new Error(
              hasOcrText
                ? 'OCR succeeded, but AI product extraction could not be completed. Try the image-based extraction with a valid image.'
                : 'No package image is available for image-based AI extraction. Please go back and upload or capture a product image.',
            )
            err.code = 'NO_FALLBACK_IMAGE'
            err.userMessage = err.message
            throw err
          }
          const result = await extractProductInformation({
            ocrText: '',
            imageFile: fallbackBlob,
            barcode: productCode,
            apiKey: activeKey,
          })
          if (runCountRef.current !== runToken) return
          setExtractedData(result)
          setExtractionMethod('image')
          setStatus('success')
          setAccepted(false)
          setShowKeyInput(false)
        } catch (error) {
          if (runCountRef.current !== runToken) return
          console.warn('[AiExtraction] Image-based AI extraction failed:', error.code || '', error.userMessage || error.message || error)
          handleExtractionError(error)
        }
      }
    },
    [combinedOcrText, hasOcrText, productCode, getFallbackImageBlob, handleExtractionError, onExtractionSuccess],
  )

  // Automatically start extraction when entering step 4 (real mode only).
  // In demo mode the officer clicks "Extract Product Information" explicitly.
  useEffect(() => {
    if (DEMO_AI_MODE) return
    let timer = null
    if (status === 'idle' && hasOcrText) {
      timer = setTimeout(() => {
        runExtraction('ocr')
      }, 0)
    }
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [hasOcrText, status, runExtraction])

  // Handle API key submission from UI
  const handleSaveKeyAndRetry = (e) => {
    e.preventDefault()
    const clean = keyInput.trim()
    if (!clean) return
    setGeminiApiKey(clean, saveKeyToSession)
    runExtraction(hasOcrText ? 'auto' : 'image', clean)
  }

  // Handle Officer Manual Editing
  const handleOpenEditModal = () => {
    if (!extractedData) return
    setEditForm({
      productName: extractedData.productName || '',
      genericName: extractedData.genericName || '',
      category: extractedData.category || 'General',
      manufacturerName: extractedData.manufacturer?.name || '',
      manufacturerAddress: extractedData.manufacturer?.address || '',
      packerName: extractedData.packer?.name || '',
      packerAddress: extractedData.packer?.address || '',
      importerName: extractedData.importer?.name || '',
      importerAddress: extractedData.importer?.address || '',
      netQuantity: extractedData.netQuantity || '',
      mrp: extractedData.mrp || '',
      unitSalePrice: extractedData.unitSalePrice || '',
      countryOfOrigin: extractedData.countryOfOrigin || '',
      manufactureDate: extractedData.manufactureDate || '',
      bestBefore: extractedData.bestBefore || '',
      consumerCare: extractedData.consumerCare || '',
      dimensions: extractedData.dimensions || '',
    })
    setEditModalOpen(true)
  }

  const handleEditFormChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSaveEdit = (e) => {
    e.preventDefault()
    if (!editForm) return

    const newEditedFields = { ...editedFields }

    // Check which fields changed
    const checkEdited = (key, newVal, oldVal) => {
      if ((newVal || '').trim() !== (oldVal || '').trim()) {
        newEditedFields[key] = true
      }
    }

    checkEdited('productName', editForm.productName, extractedData.productName)
    checkEdited('genericName', editForm.genericName, extractedData.genericName)
    checkEdited('category', editForm.category, extractedData.category)
    checkEdited('manufacturerName', editForm.manufacturerName, extractedData.manufacturer?.name)
    checkEdited('manufacturerAddress', editForm.manufacturerAddress, extractedData.manufacturer?.address)
    checkEdited('packerName', editForm.packerName, extractedData.packer?.name)
    checkEdited('packerAddress', editForm.packerAddress, extractedData.packer?.address)
    checkEdited('importerName', editForm.importerName, extractedData.importer?.name)
    checkEdited('importerAddress', editForm.importerAddress, extractedData.importer?.address)
    checkEdited('netQuantity', editForm.netQuantity, extractedData.netQuantity)
    checkEdited('mrp', editForm.mrp, extractedData.mrp)
    checkEdited('unitSalePrice', editForm.unitSalePrice, extractedData.unitSalePrice)
    checkEdited('countryOfOrigin', editForm.countryOfOrigin, extractedData.countryOfOrigin)
    checkEdited('manufactureDate', editForm.manufactureDate, extractedData.manufactureDate)
    checkEdited('bestBefore', editForm.bestBefore, extractedData.bestBefore)
    checkEdited('consumerCare', editForm.consumerCare, extractedData.consumerCare)
    checkEdited('dimensions', editForm.dimensions, extractedData.dimensions)

    const updatedData = {
      ...extractedData,
      productName: editForm.productName.trim(),
      genericName: editForm.genericName.trim(),
      category: editForm.category.trim(),
      manufacturer: {
        name: editForm.manufacturerName.trim(),
        address: editForm.manufacturerAddress.trim(),
      },
      packer: {
        name: editForm.packerName.trim(),
        address: editForm.packerAddress.trim(),
      },
      importer: {
        name: editForm.importerName.trim(),
        address: editForm.importerAddress.trim(),
      },
      netQuantity: editForm.netQuantity.trim(),
      mrp: editForm.mrp.trim(),
      unitSalePrice: editForm.unitSalePrice.trim(),
      countryOfOrigin: editForm.countryOfOrigin.trim(),
      manufactureDate: editForm.manufactureDate.trim(),
      bestBefore: editForm.bestBefore.trim(),
      consumerCare: editForm.consumerCare.trim(),
      dimensions: editForm.dimensions.trim(),
    }

    // Recalculate missing fields based on updated values
    const standardChecks = [
      { label: 'Product Name', val: updatedData.productName },
      { label: 'Generic / Common Name', val: updatedData.genericName },
      { label: 'Manufacturer Name', val: updatedData.manufacturer?.name },
      { label: 'Manufacturer Address', val: updatedData.manufacturer?.address },
      { label: 'Country of Origin', val: updatedData.countryOfOrigin },
      { label: 'Net Quantity', val: updatedData.netQuantity },
      { label: 'MRP', val: updatedData.mrp },
      { label: 'Unit Sale Price', val: updatedData.unitSalePrice },
      { label: 'Manufacture / Packing Date', val: updatedData.manufactureDate },
      { label: 'Best Before / Use By', val: updatedData.bestBefore },
      { label: 'Consumer Care Details', val: updatedData.consumerCare },
    ]

    updatedData.missingFields = standardChecks.filter((c) => !c.val).map((c) => c.label)

    setExtractedData(updatedData)
    setEditedFields(newEditedFields)
    setManuallyEdited(true)
    setEditModalOpen(false)
  }

  // Officer accepts extraction
  const handleAcceptExtraction = () => {
    setAccepted(true)
  }

  // Construct final data object for next compliance module
  const handleContinue = () => {
    if (!extractedData) return

    const finalDataObject = {
      barcode: productCode?.value || '',
      barcodeFormat: productCode?.type || '',
      originalImage: primaryItem?.originalImage || '',
      processedImage: primaryItem?.processedImage || '',
      ocrText: combinedOcrText,
      ocrConfidence: primaryItem?.ocrConfidence ?? null,
      extractedProductDetails: extractedData,
      extractionMethod,
      manuallyEdited,
      // Seamless bridge for Compliance Module evaluation engine:
      productName: extractedData.productName || extractedData.genericName || 'Packaged Commodity',
      category: extractedData.category || 'General',
      declarations: {
        mrp: {
          detected: Boolean(extractedData.mrp),
          rawText: extractedData.mrp || null,
          clarity: 'clear',
        },
        netQuantity: {
          detected: Boolean(extractedData.netQuantity),
          rawText: extractedData.netQuantity || null,
          clarity: 'clear',
        },
        manufacturerDetails: {
          detected: Boolean(
            extractedData.manufacturer?.name || extractedData.manufacturer?.address,
          ),
          rawText:
            [extractedData.manufacturer?.name, extractedData.manufacturer?.address]
              .filter(Boolean)
              .join(', ') || null,
          clarity: 'clear',
        },
        consumerCare: {
          detected: Boolean(extractedData.consumerCare),
          rawText: extractedData.consumerCare || null,
          clarity: 'clear',
        },
        countryOfOrigin: {
          detected: Boolean(extractedData.countryOfOrigin),
          rawText: extractedData.countryOfOrigin || null,
          clarity: 'clear',
        },
        dateOfPackaging: {
          detected: Boolean(extractedData.manufactureDate),
          rawText: extractedData.manufactureDate || null,
          clarity: 'clear',
        },
        unitSalePrice: {
          detected: Boolean(extractedData.unitSalePrice),
          rawText: extractedData.unitSalePrice || null,
          clarity: 'clear',
        },
        expiryDate: {
          detected: Boolean(extractedData.bestBefore),
          rawText: extractedData.bestBefore || null,
          clarity: 'clear',
        },
      },
    }

    if (onContinueToCompliance) {
      onContinueToCompliance(finalDataObject)
    }
  }

  // Format field display rows
  const detailRows = useMemo(() => {
    if (!extractedData) return []
    return [
      {
        key: 'productName',
        label: 'Product Name',
        value: extractedData.productName,
        required: true,
      },
      {
        key: 'genericName',
        label: 'Generic / Common Name',
        value: extractedData.genericName,
        required: true,
      },
      {
        key: 'manufacturerName',
        label: 'Manufacturer',
        value: extractedData.manufacturer?.name,
        required: true,
      },
      {
        key: 'manufacturerAddress',
        label: 'Manufacturer Address',
        value: extractedData.manufacturer?.address,
        required: true,
      },
      {
        key: 'packerName',
        label: 'Packer Name',
        value: extractedData.packer?.name,
        optional: true,
      },
      {
        key: 'packerAddress',
        label: 'Packer Address',
        value: extractedData.packer?.address,
        optional: true,
      },
      {
        key: 'importerName',
        label: 'Importer Name',
        value: extractedData.importer?.name,
        optional: true,
      },
      {
        key: 'importerAddress',
        label: 'Importer Address',
        value: extractedData.importer?.address,
        optional: true,
      },
      {
        key: 'netQuantity',
        label: 'Net Quantity',
        value: extractedData.netQuantity,
        required: true,
      },
      {
        key: 'mrp',
        label: 'MRP',
        value: extractedData.mrp,
        required: true,
      },
      {
        key: 'unitSalePrice',
        label: 'Unit Sale Price',
        value: extractedData.unitSalePrice,
        optional: true,
      },
      {
        key: 'countryOfOrigin',
        label: 'Country of Origin',
        value: extractedData.countryOfOrigin,
        required: true,
      },
      {
        key: 'manufactureDate',
        label: 'Manufacture / Packing Date',
        value: extractedData.manufactureDate,
        required: true,
      },
      {
        key: 'bestBefore',
        label: 'Best Before / Use By',
        value: extractedData.bestBefore,
        required: true,
      },
      {
        key: 'consumerCare',
        label: 'Consumer Care Details',
        value: extractedData.consumerCare,
        required: true,
      },
      {
        key: 'category',
        label: 'Product Category',
        value: extractedData.category,
        optional: true,
      },
      {
        key: 'dimensions',
        label: 'Dimensions',
        value: extractedData.dimensions,
        optional: true,
      },
    ].filter((row) => row.value || row.required)
  }, [extractedData])

  // In real mode, when OCR yielded no text: show OCR_TEXT_EMPTY with retry + image fallback options.
  // In demo mode we skip this panel entirely - the demo ready card is shown instead.
  if (!hasOcrText && status === 'idle' && !DEMO_AI_MODE) {
    return (
      <div className="ai-extraction-section" aria-label="Empty OCR text">
        <div className="ai-extraction-header">
          <div className="ai-extraction-header__titles">
            <h2 className="ai-extraction-header__title">AI Product Information Extraction</h2>
            <p className="ai-extraction-header__subtitle">
              Statutory declaration extraction powered by Gemini AI for Legal Metrology inspection.
            </p>
          </div>
          <StatusBadge status="error" label="OCR text missing" />
        </div>
        <Card title="AI Product Information Extraction">
          <Alert tone="error" title="OCR_TEXT_EMPTY">
            <p>Failed to extract any readable text from the image.</p>
            <p>
              No textual declarations were detected from the processed package images. You can
              re-run OCR, retake the image, or attempt image-based AI extraction directly from the
              original package image.
            </p>
          </Alert>
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Button
              variant="primary"
              icon="image"
              onClick={() => runExtraction('image')}
            >
              Try Image-Based AI Extraction
            </Button>
            <Button variant="outline" icon="refresh" onClick={onBackToOcr}>
              Re-run OCR
            </Button>
            {onRetake ? (
              <Button variant="outline" icon="camera" onClick={onRetake}>
                Retake Image
              </Button>
            ) : (
              <Button variant="outline" onClick={onStartNewInspection}>
                Start New Inspection
              </Button>
            )}
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="ai-extraction-section" aria-label="AI extraction step">
      {/* Header */}
      <div className="ai-extraction-header">
        <div className="ai-extraction-header__titles">
          <h2 className="ai-extraction-header__title">AI Product Information Extraction</h2>
          <p className="ai-extraction-header__subtitle">
            Statutory declaration extraction powered by Gemini AI for Legal Metrology inspection.
          </p>
        </div>
        {status === 'loading' && (
          <StatusBadge status="processing" label="Analyzing package…" />
        )}
        {status === 'success' && !accepted && (
          <StatusBadge
            status="success"
            label={DEMO_AI_MODE ? '✓ PRODUCT INFORMATION EXTRACTED' : '✓ AI extraction completed'}
          />
        )}
        {status === 'success' && accepted && (
          <StatusBadge status="verified" label="Accepted by Officer" />
        )}
        {status === 'error' && <StatusBadge status="error" label="Extraction failed" />}
      </div>

      {/* Ready state - officer starts extraction explicitly */}
      {DEMO_AI_MODE && status === 'idle' && (
        <Card title="AI PRODUCT INFORMATION EXTRACTION">
          <div className="ai-demo-notice">
            <span className="ai-demo-notice__text">
              Information extracted from the uploaded product image using OCR.
            </span>
          </div>
          {!hasOcrText ? (
            <Alert tone="warning" title="No readable text was detected">
              <p>No readable text was detected in the uploaded image.</p>
              <div className="ai-demo-actions">
                <Button variant="primary" icon="refresh" onClick={onBackToOcr}>
                  Retry OCR
                </Button>
                <Button variant="outline" icon="camera" onClick={onStartNewInspection}>
                  Upload Another Image
                </Button>
              </div>
            </Alert>
          ) : (
            <div className="ai-demo-actions">
              <Button variant="primary" icon="shield" onClick={() => runExtraction()}>
                Extract Product Information
              </Button>
              <Button variant="outline" icon="file" onClick={() => setOcrTextModalOpen(true)}>
                View OCR Text
              </Button>
            </div>
          )}
        </Card>
      )}

      {status === 'success' && extractionMethod === 'image' && (
        <Alert tone="info" title="Image-based AI extraction used">
          <p>
            Text OCR was unsuccessful. Image-based AI extraction was attempted using the original
            package image. Only declarations visible in the image were extracted.
          </p>
        </Alert>
      )}

      {/* Barcode Connection Notice (if detected earlier) */}
      {productCode && (
        <div className="ai-barcode-card" role="region" aria-label="Barcode identification">
          <div className="ai-barcode-card__left">
            <Icon name="barcode" size={20} />
            <div>
              <span className="ai-barcode-card__code">Barcode: {productCode.value}</span>{' '}
              <span className="ai-barcode-card__format">{productCode.type}</span>
            </div>
          </div>
          <p className="ai-barcode-card__note">
            Note: Barcode identifies the commodity but does not prove Legal Metrology compliance.
          </p>
        </div>
      )}

      {/* API Key Configuration Form (if key is missing) */}
      {showKeyInput && (
        <Card title="Gemini AI API Key Configuration">
          <Alert tone="info" title="API Key Required for AI Extraction">
            <p>
              Please provide your Google Gemini API key to proceed with AI statutory declaration
              extraction. You can also define <code>VITE_GEMINI_API_KEY</code> in your project{' '}
              <code>.env</code> file.
            </p>
          </Alert>
          <form className="ai-key-setup" onSubmit={handleSaveKeyAndRetry}>
            <label className="ai-edit-field">
              <span>Google Gemini API Key *</span>
              <div className="ai-key-setup__input-group">
                <input
                  type="password"
                  required
                  placeholder="AIza... or AQ... (from Google AI Studio)"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  autoComplete="off"
                />
                <Button type="submit" variant="primary" icon="check">
                  Save & Extract
                </Button>
              </div>
            </label>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.85rem',
                color: '#475569',
              }}
            >
              <input
                type="checkbox"
                checked={saveKeyToSession}
                onChange={(e) => setSaveKeyToSession(e.target.checked)}
              />
              Save key for this inspection session
            </label>
          </form>
        </Card>
      )}

      {/* STATE 1: LOADING */}
      {status === 'loading' && (
        <div className="ai-loading-card" role="status" aria-live="polite">
          <LoadingSpinner size="lg" />
          <div className="ai-loading-card__status">
            {DEMO_AI_MODE ? (
              <span>Analyzing uploaded product information...</span>
            ) : hasOcrText ? (
              <span>⟳ Gemini AI is analyzing the extracted text.</span>
            ) : (
              <span>⟳ Text OCR was unsuccessful. Gemini AI is analyzing the package image directly.</span>
            )}
          </div>
          <p className="ai-loading-card__message">
            {DEMO_AI_MODE
              ? 'Information is being extracted from the uploaded product image using local pattern matching on its OCR text. No Gemini API request is made.'
              : hasOcrText
                ? 'Analyzing package text... Statutory declarations such as Product Name, Manufacturer, Net Quantity, MRP, and Dates are being structured.'
                : 'Image-based AI extraction is running on the original package image. Only visible declarations will be extracted - nothing will be invented.'}
          </p>

          {primaryItem && (
            <div className="ai-loading-card__preview">
              <img
                className="ai-loading-card__thumb"
                src={primaryItem.processedImage || primaryItem.originalImage}
                alt="Package being analyzed"
              />
              <div className="ai-loading-card__info">
                <span className="ai-loading-card__name">
                  {primaryItem.name || 'Processed Label'}
                </span>
                {DEMO_AI_MODE ? (
                  <span className="ai-loading-card__ocr-stat">
                    OCR Text Length: {combinedOcrText.length} characters
                  </span>
                ) : hasOcrText ? (
                  <span className="ai-loading-card__ocr-stat">
                    OCR Text Length: {combinedOcrText.length} characters
                  </span>
                ) : (
                  <span className="ai-loading-card__ocr-stat">
                    Mode: Image-based extraction
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* STATE 2: ERROR */}
      {status === 'error' && (
        <Card title="AI Extraction Issue">
          <Alert tone="error" title={errorTitle}>
            <p>{errorMessage}</p>
          </Alert>
          <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Button
              variant="primary"
              icon="refresh"
              onClick={() => runExtraction(hasOcrText ? 'ocr' : 'image')}
            >
              Try Again
            </Button>
            {hasOcrText && (
              <Button
                variant="outline"
                icon="file"
                onClick={() => setOcrTextModalOpen(true)}
              >
                View OCR Text
              </Button>
            )}
            {!hasOcrText && (
              <Button
                variant="outline"
                icon="image"
                onClick={() => runExtraction('image')}
              >
                Retry Image-Based Extraction
              </Button>
            )}
            <Button variant="ghost" onClick={onBackToOcr}>
              Back to OCR
            </Button>
          </div>
        </Card>
      )}

      {/* STATE 3: SUCCESS (OFFICER REVIEW INTERFACE) */}
      {status === 'success' && extractedData && (
        <div className="ai-details-grid">
          {/* Officer Action Bar */}
          <div className="ai-review-bar">
            <div className="ai-review-bar__status">
              <Icon name="shield" size={18} />
              <span>AI Extracted Product Details (Officer Review)</span>
              {manuallyEdited && (
                <span className="ai-source-badge ai-source-badge--edited">
                  Manually Edited by Officer
                </span>
              )}
            </div>
            <div className="ai-review-bar__actions">
              <Button variant="outline" size="sm" icon="edit" onClick={handleOpenEditModal}>
                Edit Details
              </Button>
              <Button
                variant={accepted ? 'success' : 'primary'}
                size="sm"
                icon="check"
                onClick={handleAcceptExtraction}
              >
                {accepted ? 'Extraction Accepted' : 'Accept Extraction'}
              </Button>
              <Button variant="ghost" size="sm" icon="refresh" onClick={() => runExtraction()}>
                Re-run AI
              </Button>
              {DEMO_AI_MODE && (
                <Button
                  variant="outline"
                  size="sm"
                  icon="file"
                  onClick={() => setActiveTab('details')}
                >
                  View Product Details
                </Button>
              )}
            </div>
          </div>

          {/* Traceability Tabs */}
          <nav className="ai-tabs" aria-label="Extraction Traceability Tabs">
            <button
              type="button"
              className={`ai-tabs__tab${activeTab === 'details' ? ' is-active' : ''}`}
              onClick={() => setActiveTab('details')}
            >
              <Icon name="file" size={16} />
              <span>Product Information</span>
            </button>
            <button
              type="button"
              className={`ai-tabs__tab${activeTab === 'ocr' ? ' is-active' : ''}`}
              onClick={() => setActiveTab('ocr')}
            >
              <Icon name="search" size={16} />
              <span>Raw OCR Text ({combinedOcrText.length} chars)</span>
            </button>
            <button
              type="button"
              className={`ai-tabs__tab${activeTab === 'images' ? ' is-active' : ''}`}
              onClick={() => setActiveTab('images')}
            >
              <Icon name="image" size={16} />
              <span>Package Images ({items.length})</span>
            </button>
          </nav>

          {/* TAB 1: PRODUCT INFORMATION */}
          {activeTab === 'details' && (
            <Card
              title="PRODUCT INFORMATION"
              subtitle="Statutory declarations structured from package text"
              meta={
                typeof extractedData.confidence === 'number' ? (
                  <StatusBadge
                    status="neutral"
                    label={`AI Extraction Confidence: ${extractedData.confidence}%`}
                  />
                ) : null
              }
            >
              <table className="ai-fields-table">
                <thead>
                  <tr>
                    <th>Statutory Field</th>
                    <th>Extracted Declaration</th>
                    <th className="ai-fields-table__source-col">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {detailRows.map((row) => {
                    const isEdited = editedFields[row.key]
                    return (
                      <tr key={row.key}>
                        <th>{row.label}</th>
                        <td>
                          {row.value ? (
                            <span className="ai-field-value">{row.value}</span>
                          ) : (
                            <span className="ai-field-value--empty">Not detected</span>
                          )}
                        </td>
                        <td className="ai-fields-table__source-col">
                          {isEdited ? (
                            <span className="ai-source-badge ai-source-badge--edited">
                              Manual Edit
                            </span>
                          ) : row.value ? (
                            <span className="ai-source-badge">Source: OCR text</span>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {/* Missing Information Warning Box (NOT marked as violation here) */}
              {extractedData.missingFields && extractedData.missingFields.length > 0 && (
                <div className="ai-missing-card" role="region" aria-label="Missing information warning">
                  <div className="ai-missing-card__header">
                    <Icon name="alert-triangle" size={18} />
                    <span>⚠ Missing Information</span>
                  </div>
                  <p className="ai-missing-card__note">
                    The following statutory declarations were not detected in the OCR text. They
                    will be evaluated by the Compliance Module according to Legal Metrology rules.
                    (AI does not make violation judgements).
                  </p>
                  <ul className="ai-missing-card__list">
                    {extractedData.missingFields.map((field) => (
                      <li key={field} className="ai-missing-pill">
                        {field}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          )}

          {/* TAB 2: RAW OCR TEXT TRACEABILITY */}
          {activeTab === 'ocr' && (
            <Card
              title="Raw OCR Text Source"
              subtitle="Direct output from the optical character recognition engine"
              meta={<StatusBadge status="neutral" label="Unmodified OCR" />}
            >
              <div className="ai-ocr-traceability">
                <Alert tone="info" title="Traceability Guarantee">
                  <p>
                    Original OCR text is preserved verbatim and is not overwritten or modified by
                    the AI engine.
                  </p>
                </Alert>
                <div className="ai-ocr-text-box" tabIndex={0}>
                  {combinedOcrText}
                </div>
              </div>
            </Card>
          )}

          {/* TAB 3: PACKAGE IMAGES */}
          {activeTab === 'images' && (
            <Card
              title="Inspection Package Images"
              subtitle="Original capture and preprocessed enhancement"
            >
              <div className="ai-images-traceability">
                {items.map((item, idx) => (
                  <div key={item.id || idx} className="ai-trace-image-frame">
                    <h4 className="ai-trace-image-frame__title">
                      {item.name || `Package Image ${idx + 1}`}
                    </h4>
                    <img
                      src={item.processedImage}
                      alt={`Processed image for ${item.name || 'package'}`}
                    />
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      OCR Confidence: {Math.round(item.ocrConfidence || 0)}%
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Step Footer with Continue to Compliance Check */}
          <div className="ai-footer-bar">
            <p className="ai-footer-bar__hint">
              Review completed. Click “Continue to Compliance Check” to evaluate these declarations
              against statutory Legal Metrology rules.
            </p>
            <div className="ai-footer-bar__actions">
              <Button variant="outline" icon="arrowLeft" onClick={onBackToOcr}>
                Back to OCR
              </Button>
              <Button
                variant="primary"
                size="lg"
                icon="arrowRight"
                iconPosition="right"
                onClick={handleContinue}
              >
                Continue to Compliance Check
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Officer Manual Edit Modal */}
      <Modal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Officer Edit — Product Declarations"
        size="lg"
        footer={
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" icon="check" onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </div>
        }
      >
        {editForm && (
          <form className="ai-edit-form" onSubmit={handleSaveEdit}>
            <Alert tone="info" title="Audit Tracking Notice">
              <p>
                Any values edited manually will be flagged as officer-verified in the inspection
                audit record.
              </p>
            </Alert>
            <div className="ai-edit-grid">
              <label className="ai-edit-field ai-edit-grid--full">
                <span>Product Name</span>
                <input
                  type="text"
                  value={editForm.productName}
                  onChange={(e) => handleEditFormChange('productName', e.target.value)}
                />
              </label>
              <label className="ai-edit-field">
                <span>Generic / Common Name</span>
                <input
                  type="text"
                  value={editForm.genericName}
                  onChange={(e) => handleEditFormChange('genericName', e.target.value)}
                />
              </label>
              <label className="ai-edit-field">
                <span>Commodity Category</span>
                <select
                  value={editForm.category}
                  onChange={(e) => handleEditFormChange('category', e.target.value)}
                >
                  <option value="Food">Food</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Cosmetics">Cosmetics</option>
                  <option value="General">General</option>
                </select>
              </label>
              <label className="ai-edit-field ai-edit-grid--full">
                <span>Manufacturer Name</span>
                <input
                  type="text"
                  value={editForm.manufacturerName}
                  onChange={(e) => handleEditFormChange('manufacturerName', e.target.value)}
                />
              </label>
              <label className="ai-edit-field ai-edit-grid--full">
                <span>Manufacturer Address</span>
                <textarea
                  rows={2}
                  value={editForm.manufacturerAddress}
                  onChange={(e) => handleEditFormChange('manufacturerAddress', e.target.value)}
                />
              </label>
              <label className="ai-edit-field">
                <span>Net Quantity</span>
                <input
                  type="text"
                  placeholder="e.g. 500 g, 1 L"
                  value={editForm.netQuantity}
                  onChange={(e) => handleEditFormChange('netQuantity', e.target.value)}
                />
              </label>
              <label className="ai-edit-field">
                <span>MRP (Maximum Retail Price)</span>
                <input
                  type="text"
                  placeholder="e.g. ₹120.00"
                  value={editForm.mrp}
                  onChange={(e) => handleEditFormChange('mrp', e.target.value)}
                />
              </label>
              <label className="ai-edit-field">
                <span>Unit Sale Price (USP)</span>
                <input
                  type="text"
                  placeholder="e.g. ₹0.24 / g"
                  value={editForm.unitSalePrice}
                  onChange={(e) => handleEditFormChange('unitSalePrice', e.target.value)}
                />
              </label>
              <label className="ai-edit-field">
                <span>Country of Origin</span>
                <input
                  type="text"
                  value={editForm.countryOfOrigin}
                  onChange={(e) => handleEditFormChange('countryOfOrigin', e.target.value)}
                />
              </label>
              <label className="ai-edit-field">
                <span>Date of Manufacture / Packing</span>
                <input
                  type="text"
                  placeholder="e.g. 08/2026"
                  value={editForm.manufactureDate}
                  onChange={(e) => handleEditFormChange('manufactureDate', e.target.value)}
                />
              </label>
              <label className="ai-edit-field">
                <span>Best Before / Use By / Expiry</span>
                <input
                  type="text"
                  placeholder="e.g. 12 months from packing"
                  value={editForm.bestBefore}
                  onChange={(e) => handleEditFormChange('bestBefore', e.target.value)}
                />
              </label>
              <label className="ai-edit-field ai-edit-grid--full">
                <span>Consumer Care / Grievance Details</span>
                <textarea
                  rows={2}
                  placeholder="Phone, email, or postal address"
                  value={editForm.consumerCare}
                  onChange={(e) => handleEditFormChange('consumerCare', e.target.value)}
                />
              </label>
              <label className="ai-edit-field">
                <span>Dimensions (if applicable)</span>
                <input
                  type="text"
                  value={editForm.dimensions}
                  onChange={(e) => handleEditFormChange('dimensions', e.target.value)}
                />
              </label>
            </div>
          </form>
        )}
      </Modal>

      {/* OCR Text Modal */}
      <Modal
        open={ocrTextModalOpen}
        onClose={() => setOcrTextModalOpen(false)}
        title="OCR Text"
        size="lg"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
            <Button variant="primary" onClick={() => setOcrTextModalOpen(false)}>
              Close
            </Button>
          </div>
        }
      >
        <div className="ai-ocr-traceability">
          <Alert tone="info" title="Traceability Guarantee">
            <p>
              This is the unmodified OCR text produced by the OCR engine from the processed package
              images.
            </p>
          </Alert>
          {combinedOcrText.trim() ? (
            <div className="ai-ocr-text-box" tabIndex={0}>
              {combinedOcrText}
            </div>
          ) : (
            <div className="ai-ocr-empty">
              <p className="ai-ocr-empty__title">No text detected</p>
              <p className="ai-ocr-empty__note">
                No readable text was detected in the uploaded image. Please retry OCR or upload
                another image.
              </p>
            </div>
          )}
          <div className="ai-ocr-actions">
            <Button
              variant="outline"
              size="sm"
              icon="copy"
              onClick={() => {
                if (!combinedOcrText.trim()) return
                try {
                  if (navigator.clipboard?.writeText) navigator.clipboard.writeText(combinedOcrText)
                } catch {
                  /* clipboard unavailable */
                }
              }}
            >
              Copy Text
            </Button>
            <Button variant="outline" size="sm" icon="refresh" onClick={onBackToOcr}>
              Re-run OCR
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
