import { useRef } from 'react'
import { classNames } from '../../../utils/classNames'
import { formatFileSize, IMAGE_LABELS, UPLOAD_ACCEPT_ATTR } from '../../../utils/fileValidation'
import Icon from '../../ui/Icon/Icon'
import ImageLabelSelector from '../ImageLabelSelector/ImageLabelSelector'
import './ImagePreviewCard.css'

/**
 * Preview card for a locally selected product image.
 * Shows the thumbnail, file name, size, type, a label selector and
 * Replace / Remove actions.
 */
export default function ImagePreviewCard({ image, onRemove, onLabelChange, onReplace, className = '' }) {
  const replaceInputRef = useRef(null)

  const openReplacePicker = () => replaceInputRef.current?.click()

  const handleReplaceChange = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) onReplace(image.id, file)
  }

  const labelText =
    IMAGE_LABELS.find((option) => option.value === image.label)?.label ?? image.label

  return (
    <article className={classNames('preview-card', className)}>
      <div className="preview-card__thumb">
        {image.previewUrl ? (
          <img src={image.previewUrl} alt={`Preview of ${image.file.name}`} />
        ) : (
          <span className="preview-card__thumb-placeholder">
            <Icon name="image" size={28} />
          </span>
        )}
      </div>

      <div className="preview-card__body">
        <div className="preview-card__file">
          <p className="preview-card__name" title={image.file.name}>
            {image.file.name}
          </p>
          <div className="preview-card__file-meta">
            <span className="preview-card__size">{formatFileSize(image.file.size)}</span>
            <span className="preview-card__type-badge">{labelText}</span>
          </div>
        </div>

        <ImageLabelSelector
          id={`image-label-${image.id}`}
          value={image.label}
          onChange={(label) => onLabelChange(image.id, label)}
        />

        <div className="preview-card__actions">
          <input
            ref={replaceInputRef}
            type="file"
            accept={UPLOAD_ACCEPT_ATTR}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={handleReplaceChange}
          />
          <button
            type="button"
            className="preview-card__btn preview-card__btn--replace"
            onClick={openReplacePicker}
            aria-label={`Replace ${image.file.name} with another image`}
          >
            <Icon name="upload" size={16} />
            <span>Replace Image</span>
          </button>
          <button
            type="button"
            className="preview-card__btn preview-card__btn--remove"
            onClick={() => onRemove(image.id)}
            aria-label={`Remove ${image.file.name}`}
          >
            <Icon name="trash" size={16} />
            <span>Remove Image</span>
          </button>
        </div>
      </div>
    </article>
  )
}