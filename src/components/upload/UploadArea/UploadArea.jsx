import { useRef, useState } from 'react'
import { classNames } from '../../../utils/classNames'
import { MAX_FILE_SIZE_MB, UPLOAD_ACCEPT_ATTR } from '../../../utils/fileValidation'
import Icon from '../../ui/Icon/Icon'
import './UploadArea.css'

/**
 * Professional drag-and-drop area for product images.
 * Local selection only — no file is transmitted.
 */
export default function UploadArea({ onFilesSelected, disabled = false }) {
  const inputRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragCounter = useRef(0)

  const openPicker = () => {
    if (!disabled) inputRef.current?.click()
  }

  const handleChange = (event) => {
    onFilesSelected(event.target.files)
    // Allow the same file to be selected again after a removal.
    event.target.value = ''
  }

  const handleDrop = (event) => {
    event.preventDefault()
    dragCounter.current = 0
    setIsDragging(false)
    if (!disabled && event.dataTransfer?.files?.length) {
      onFilesSelected(event.dataTransfer.files)
    }
  }

  return (
    <div
      className={classNames('upload-area', isDragging && 'is-dragging', disabled && 'is-disabled')}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="Upload product images. Drag and drop files here, or press Enter to browse files."
      onClick={openPicker}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          openPicker()
        }
      }}
      onDragEnter={(event) => {
        event.preventDefault()
        dragCounter.current += 1
        setIsDragging(true)
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={(event) => {
        event.preventDefault()
        dragCounter.current -= 1
        if (dragCounter.current <= 0) {
          dragCounter.current = 0
          setIsDragging(false)
        }
      }}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept={UPLOAD_ACCEPT_ATTR}
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={handleChange}
      />
      <Icon name="image" size={36} className="upload-area__icon" />
      <p className="upload-area__title">Drag &amp; drop product images here</p>
      <p className="upload-area__browse">
        <span className="upload-area__browse-link">or Browse Files</span>
      </p>
      <p className="upload-area__meta">
        Supported formats: JPG, JPEG, PNG &bull; Maximum {MAX_FILE_SIZE_MB} MB
      </p>
    </div>
  )
}