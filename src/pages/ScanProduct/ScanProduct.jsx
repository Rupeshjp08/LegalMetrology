import { useCallback, useEffect, useRef, useState } from 'react'
import EmptyState from '../../components/feedback/EmptyState/EmptyState'
import FileValidationMessage from '../../components/upload/FileValidationMessage/FileValidationMessage'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'
import ActionCard from '../../components/upload/ActionCard/ActionCard'
import ImagePreviewCard from '../../components/upload/ImagePreviewCard/ImagePreviewCard'
import Button from '../../components/ui/Button/Button'
import Card from '../../components/ui/Card/Card'
import Icon from '../../components/ui/Icon/Icon'
import Modal from '../../components/ui/Modal/Modal'
import PageHeader from '../../components/ui/PageHeader/PageHeader'
import { ROUTES } from '../../constants'
import {
  IMAGE_LABELS,
  UPLOAD_ACCEPT_ATTR,
  validateImageFile,
} from '../../utils/fileValidation'
import CameraCaptureModal from './CameraCaptureModal'
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
    usesCamera: true,
  },
  {
    key: 'scan',
    icon: 'barcode',
    title: 'Scan QR / Barcode',
    description: 'Scan the QR code or barcode available on the package.',
    ctaLabel: 'Start Scanner',
    coming: 'QR / barcode scanning',
  },
]

export default function ScanProduct() {
  const pickerRef = useRef(null)
  const previewUrlsRef = useRef([])

  const [images, setImages] = useState([])
  const [uploadErrors, setUploadErrors] = useState([])
  const [cameraOpen, setCameraOpen] = useState(false)
  const [comingStep, setComingStep] = useState(null)
  const [continueNotice, setContinueNotice] = useState(false)

  const openPicker = () => pickerRef.current?.click()

  const handleCameraCapture = (file) => {
    addImages([file])
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

  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
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
              ) : method.usesCamera ? (
                <Button variant="outline" icon={method.icon} onClick={() => setCameraOpen(true)}>
                  {method.ctaLabel}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  icon={method.icon}
                  onClick={() => setComingStep(method.coming)}
                >
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

      <Modal
        open={comingStep !== null}
        onClose={() => setComingStep(null)}
        title="Coming in the next step"
      >
        <div className="scan-feature-notice">
          <Icon name="info" size={18} className="scan-feature-notice__icon" />
          <span>
            {comingStep ? `${comingStep} will be available in the next step.` : ''}
          </span>
        </div>
      </Modal>

      <CameraCaptureModal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={handleCameraCapture}
      />
    </div>
  )
}
