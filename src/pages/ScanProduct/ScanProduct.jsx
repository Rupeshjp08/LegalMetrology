import { useCallback, useEffect, useRef, useState } from 'react'
import ActionCard from '../../components/upload/ActionCard/ActionCard'
import FileValidationMessage from '../../components/upload/FileValidationMessage/FileValidationMessage'
import ImagePreviewCard from '../../components/upload/ImagePreviewCard/ImagePreviewCard'
import UploadArea from '../../components/upload/UploadArea/UploadArea'
import Button from '../../components/ui/Button/Button'
import Card from '../../components/ui/Card/Card'
import Icon from '../../components/ui/Icon/Icon'
import PageHeader from '../../components/ui/PageHeader/PageHeader'
import {
  IMAGE_LABELS,
  UPLOAD_ACCEPT_ATTR,
  validateImageFile,
} from '../../utils/fileValidation'
import './ScanProduct.css'

const ACTION_CARDS = [
  {
    key: 'camera',
    icon: 'camera',
    title: 'Capture Image',
    description: 'Open the device camera to photograph the product package.',
    ctaLabel: 'Open Camera',
    notice: 'The camera capture module will be implemented in a later release.',
  },
  {
    key: 'upload',
    icon: 'upload',
    title: 'Upload Image',
    description: 'Add product images from this device for the inspection.',
    ctaLabel: 'Upload Product Image',
  },
  {
    key: 'scan',
    icon: 'barcode',
    title: 'Scan QR / Barcode',
    description: 'Read the package QR or barcode to prefill product details.',
    ctaLabel: 'Scan QR / Barcode',
    notice: 'QR / barcode scanning will be implemented in a later release.',
  },
]

const PROCESSING_DELAY_MS = 600

export default function ScanProduct() {
  const pickerRef = useRef(null)
  const previewUrlsRef = useRef([])
  const processingTimerRef = useRef(null)

  const [images, setImages] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadErrors, setUploadErrors] = useState([])
  const [replaceErrors, setReplaceErrors] = useState([])
  const [featureNotice, setFeatureNotice] = useState('')
  const [qualityCheckNotice, setQualityCheckNotice] = useState(false)

  const openPicker = () => pickerRef.current?.click()

  const buildImageEntry = useCallback((file) => {
    const previewUrl = URL.createObjectURL(file)
    previewUrlsRef.current.push(previewUrl)
    return {
      id: `${file.name}-${file.lastModified}-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
      file,
      previewUrl,
      label: IMAGE_LABELS[0].value,
    }
  }, [])

  const releasePreviewUrl = useCallback((previewUrl) => {
    URL.revokeObjectURL(previewUrl)
    previewUrlsRef.current = previewUrlsRef.current.filter((url) => url !== previewUrl)
  }, [])

  const handleFilesSelected = useCallback((fileList) => {
    const incoming = fileList ? Array.from(fileList) : []
    if (incoming.length === 0) return

    if (processingTimerRef.current) clearTimeout(processingTimerRef.current)
    setIsProcessing(true)
    setUploadErrors([])
    setReplaceErrors([])

    processingTimerRef.current = window.setTimeout(() => {
      const errors = []
      const accepted = []

      incoming.forEach((file) => {
        const error = validateImageFile(file)
        if (error) {
          errors.push(`${file.name}: ${error}`)
        } else {
          accepted.push(file)
        }
      })

      setUploadErrors(errors)

      if (accepted.length > 0) {
        const newImages = accepted.map(buildImageEntry)
        setImages((previous) => [...previous, ...newImages])
        setFeatureNotice('')
      }

      setIsProcessing(false)
    }, PROCESSING_DELAY_MS)
  }, [buildImageEntry])

  const handleReplaceImage = (id, file) => {
    const error = validateImageFile(file)
    if (error) {
      setReplaceErrors([`${file.name}: ${error}`])
      return
    }

    const newPreviewUrl = URL.createObjectURL(file)
    previewUrlsRef.current.push(newPreviewUrl)

    setReplaceErrors([])
    setImages((previous) =>
      previous.map((image) => {
        if (image.id !== id) return image
        releasePreviewUrl(image.previewUrl)
        return { ...image, file, previewUrl: newPreviewUrl }
      }),
    )
  }

  const handleRemoveImage = (id) => {
    setImages((previous) => {
      const target = previous.find((image) => image.id === id)
      if (target?.previewUrl) releasePreviewUrl(target.previewUrl)
      return previous.filter((image) => image.id !== id)
    })
  }

  const handleLabelChange = (id, label) => {
    setImages((previous) =>
      previous.map((image) => (image.id === id ? { ...image, label } : image)),
    )
  }

  const handleContinue = () => {
    setQualityCheckNotice(true)
  }

  const showFeaturePlaceholder = (notice) => {
    setFeatureNotice(notice)
  }

  useEffect(() => {
    return () => {
      if (processingTimerRef.current) clearTimeout(processingTimerRef.current)
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [])

  const previewSubtitle = `${images.length} image${images.length === 1 ? '' : 's'} selected`

  const renderUploadMessage = () => {
    if (isProcessing) {
      return (
        <FileValidationMessage
          tone="hint"
          title="Processing images"
          messages={['Reading selected files and checking the format.']}
        />
      )
    }

    if (uploadErrors.length > 0) {
      return (
        <FileValidationMessage
          tone="error"
          title="Some images could not be added"
          messages={uploadErrors}
        />
      )
    }

    if (images.length === 0) {
      return (
        <FileValidationMessage
          tone="warning"
          title="No image selected"
          messages={['Add at least one product image to continue.']}
        />
      )
    }

    return (
      <FileValidationMessage
        tone="success"
        title="Image added successfully"
        messages={['Selected image(s) passed the required file checks.']}
      />
    )
  }

  return (
    <div className="container">
      <PageHeader
        overline="Product Scanning & AI · Legal Metrology"
        title="Product Inspection"
        description="Upload or capture package images to begin the inspection."
      />

      <input
        ref={pickerRef}
        type="file"
        accept={UPLOAD_ACCEPT_ATTR}
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          handleFilesSelected(event.target.files)
          event.target.value = ''
        }}
      />

      <section className="scan-section" aria-labelledby="scan-actions-title">
        <h2 id="scan-actions-title" className="scan-section__title">
          Begin Inspection
        </h2>
        <div className="scan-actions">
          {ACTION_CARDS.map((action) => (
            <ActionCard
              key={action.key}
              icon={action.icon}
              title={action.title}
              description={action.description}
            >
              {action.key === 'upload' ? (
                <Button icon="upload" onClick={openPicker}>
                  {action.ctaLabel}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  icon={action.icon}
                  onClick={() => showFeaturePlaceholder(action.notice)}
                >
                  {action.ctaLabel}
                </Button>
              )}
            </ActionCard>
          ))}
        </div>

        {featureNotice && (
          <div className="scan-feature-notice" role="status">
            <Icon name="info" size={18} className="scan-feature-notice__icon" />
            <span>{featureNotice}</span>
          </div>
        )}
      </section>

      <section className="scan-section" aria-labelledby="scan-upload-title">
        <h2 id="scan-upload-title" className="scan-section__title">
          Upload Product Images
        </h2>
        <Card>
          <UploadArea onFilesSelected={handleFilesSelected} disabled={isProcessing} />
          <div className="scan-upload-messages">{renderUploadMessage()}</div>
        </Card>
      </section>

      {images.length > 0 && (
        <section className="scan-section" aria-labelledby="scan-preview-title">
          <Card
            title="Selected Images"
            subtitle={previewSubtitle}
            meta={
              <Button
                variant="outline"
                size="sm"
                icon="plus"
                onClick={openPicker}
                disabled={isProcessing}
              >
                Add Another Image
              </Button>
            }
          >
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

            {replaceErrors.length > 0 && (
              <div className="scan-replace-errors">
                <FileValidationMessage
                  tone="error"
                  title="Image could not be replaced"
                  messages={replaceErrors}
                />
              </div>
            )}
          </Card>
        </section>
      )}

      <section className="scan-section scan-continue" aria-label="Continue inspection">
        <Button
          variant="primary"
          size="lg"
          icon="arrowRight"
          iconPosition="right"
          disabled={images.length === 0}
          onClick={handleContinue}
        >
          Continue to Image Quality Check
        </Button>
        {qualityCheckNotice && (
          <div className="scan-continue__notice" role="status">
            <Icon name="info" size={18} className="scan-continue__notice-icon" />
            <span>Image Quality Check will be implemented in the next step.</span>
          </div>
        )}
      </section>
    </div>
  )
}