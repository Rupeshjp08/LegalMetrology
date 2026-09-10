import { useRef, useState } from 'react'
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
  const [imgError, setImgError] = useState(false)

  const openReplacePicker = () => replaceInputRef.current?.click()

  const handleReplaceChange = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) onReplace(image.id, file)
  }

  const labelText =
    IMAGE_LABELS.find((option) => option.value === image.label)?.label ?? image.label

  const imageSrc = image?.previewUrl || image?.preview || image?.url
  const fileName = image?.file?.name || 'Image'
  const fileSize = image?.file?.size ? formatFileSize(image.file.size) : null

  return (
    <article className={classNames('preview-card', className)}>
      <div className="preview-card__thumb">
        {imageSrc && !imgError ? (
          <img
            src={imageSrc}
            alt={`Preview of ${fileName}`}
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="preview-card__thumb-placeholder" title="Image preview unavailable">
            <Icon name="image" size={28} />
          </span>
        )}
      </div>

      <div className="preview-card__body">
        <div className="preview-card__file">
          <p className="preview-card__name" title={fileName}>
            {fileName}
          </p>
          <div className="preview-card__file-meta">
            {fileSize && <span className="preview-card__size">{fileSize}</span>}
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
            aria-label={`Replace ${fileName} with another image`}
          >
            <Icon name="upload" size={16} />
            <span>Replace Image</span>
          </button>
          <button
            type="button"
            className="preview-card__btn preview-card__btn--remove"
            onClick={() => onRemove(image.id)}
            aria-label={`Remove ${fileName}`}
          >
            <Icon name="trash" size={16} />
            <span>Remove Image</span>
          </button>
        </div>
      </div>
    </article>
  )
}