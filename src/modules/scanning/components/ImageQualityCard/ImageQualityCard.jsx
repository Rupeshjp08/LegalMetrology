import { useRef } from 'react'
import { classNames } from '../../../../utils/classNames'
import Button from '../../../../components/ui/Button/Button'
import Icon from '../../../../components/ui/Icon/Icon'
import {
  IMAGE_LABELS,
  UPLOAD_ACCEPT_ATTR,
} from '../../../../utils/fileValidation'
import QualityIndicator from '../QualityIndicator/QualityIndicator'
import QualityResult, {
  QualityResultLoading,
  QualityResultError,
} from '../QualityResult/QualityResult'
import './ImageQualityCard.css'

const STATUS_LABELS = {
  idle: 'Not analyzed',
  loading: 'Analyzing…',
  done: 'Analyzed',
  error: 'Analysis failed',
}

/**
 * Per-image quality card used in the Image Quality Check section.
 * Shows the thumbnail, running status, the analysis result and the
 * View / Replace / Retake / Add actions for that single image.
 * With `hideResult`, the card renders preview + actions only so a
 * surrounding layout can show the full analysis panel separately.
 */
export default function ImageQualityCard({
  image,
  index = 0,
  analysis = { status: 'idle' },
  onView,
  onRemove,
  onReplace,
  onRetake,
  onPickUpload,
  onContinueAnyway,
  hideResult = false,
  className = '',
}) {
  const replaceInputRef = useRef(null)

  const openReplacePicker = () => replaceInputRef.current?.click()

  const handleReplaceChange = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) onReplace(image.id, file)
  }

  const statusLabel = analysis.status ? STATUS_LABELS[analysis.status] : STATUS_LABELS.idle
  const result = analysis.status === 'done' && analysis.result ? analysis.result : null
  const labelText =
    IMAGE_LABELS.find((option) => option.value === image.label)?.label ?? image.label

  return (
    <article className={classNames('iq-card', className)} aria-label={`Image ${index + 1}`}>
      <header className="iq-card__header">
        <h3 className="iq-card__title">
          Image {index + 1}
          <span className="iq-card__label-badge">{labelText}</span>
        </h3>
        {result ? (
          <QualityIndicator level={result.level} size="sm" />
        ) : (
          <span className="iq-card__status">{statusLabel}</span>
        )}
      </header>

      <button
        type="button"
        className="iq-card__thumb"
        onClick={() => onView?.(image)}
        aria-label={`View full size of ${image.file.name}`}
      >
        {image.previewUrl ? (
          <img src={image.previewUrl} alt={`Preview of ${image.file.name}`} />
        ) : (
          <span className="iq-card__thumb-placeholder">
            <Icon name="image" size={28} />
          </span>
        )}
      </button>

      {!hideResult && (
        <div className="iq-card__quality">
          {analysis.status === 'loading' && <QualityResultLoading />}
          {analysis.status === 'error' && (
            <QualityResultError message={analysis.message || 'The image could not be analyzed.'} />
          )}
          {analysis.status === 'done' && !result && (
            <QualityResultError message="No quality data is available for this image." />
          )}
          {result && <QualityResult result={result} compact />}
        </div>
      )}

      {result && (result.level === 'poor' || result.level === 'warning') && (
        <div className="iq-card__bad-actions">
          <Button variant="primary" size="sm" icon="camera" onClick={() => onRetake?.(image)}>
            Retake Image
          </Button>
          <Button variant="outline" size="sm" icon="upload" onClick={() => onPickUpload?.(image)}>
            Upload Another
          </Button>
          {result.level === 'warning' && onContinueAnyway && (
            <Button
              variant="success"
              size="sm"
              icon="arrowRight"
              iconPosition="right"
              className="iq-card__continue"
              onClick={() => onContinueAnyway(image)}
            >
              Continue Anyway
            </Button>
          )}
        </div>
      )}

      <footer className="iq-card__actions">
        <input
          ref={replaceInputRef}
          type="file"
          accept={UPLOAD_ACCEPT_ATTR}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={handleReplaceChange}
        />
        <Button variant="ghost" size="sm" icon="search" onClick={() => onView?.(image)}>
          View
        </Button>
        <Button variant="outline" size="sm" icon="upload" onClick={openReplacePicker}>
          Replace Image
        </Button>
        <Button variant="danger" size="sm" icon="trash" onClick={() => onRemove(image)}>
          Remove
        </Button>
      </footer>
    </article>
  )
}