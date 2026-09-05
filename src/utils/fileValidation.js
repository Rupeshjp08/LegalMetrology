export const MAX_FILE_SIZE_MB = 10
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png']
export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png']

/** Value used on `<input type="file" accept="...">`. */
export const UPLOAD_ACCEPT_ATTR = [...ACCEPTED_IMAGE_TYPES, ...ALLOWED_EXTENSIONS].join(',')

export const IMAGE_LABELS = [
  { value: 'front', label: 'Front Label' },
  { value: 'back', label: 'Back Label' },
  { value: 'side', label: 'Side Label' },
  { value: 'other', label: 'Other' },
]

export function getFileExtension(filename = '') {
  const index = filename.lastIndexOf('.')
  if (index === -1) return ''
  return filename.slice(index).toLowerCase()
}

export function hasAcceptedType(file) {
  if (!file) return false
  const matchesMime = ACCEPTED_IMAGE_TYPES.includes(file.type || '')
  const matchesExtension = ALLOWED_EXTENSIONS.includes(getFileExtension(file.name))
  return matchesMime || matchesExtension
}

/**
 * Validates an uploaded or dropped image file.
 * @returns {string | null} An error message, or `null` when the file is valid.
 */
export function validateImageFile(file) {
  if (!hasAcceptedType(file)) {
    return 'Unsupported file format. Please upload JPG, JPEG or PNG.'
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `File size exceeds ${MAX_FILE_SIZE_MB} MB. Please select a smaller image.`
  }

  return null
}

/** Formats a byte count into a compact, human readable string. */
export function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return 'Unknown size'
  if (bytes === 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB']
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** unitIndex
  const formatted = value >= 100 ? Math.round(value) : Math.round(value * 10) / 10

  return `${formatted} ${units[unitIndex]}`
}