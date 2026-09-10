/**
 * Deterministic, client-side OCR image preprocessing.
 *
 * The auto-enhancement pipeline decides what to do from real measured
 * image properties (reusing `computeImageMetrics` from the Image
 * Quality Check step) and applies only the operations the image
 * actually needs. The original image is never modified - every step
 * works on a fresh canvas copy.
 */

import { computeImageMetrics } from '../../scanning/utils/imageQualityAnalysis'

export const PREPROCESS_OPERATIONS = {
  resolution: 'Resolution optimized',
  orientation: 'Orientation corrected',
  brightness: 'Brightness adjusted',
  contrast: 'Contrast enhanced',
  noise: 'Noise reduced',
  textVisibility: 'Text visibility improved',
  threshold: 'Binary threshold applied',
}

const MAX_WORK_WIDTH = 1600
const TARGET_OCR_WIDTH = 1200

export class ImageProcessingError extends Error {
  constructor(userMessage, options = {}) {
    super(userMessage)
    this.name = 'ImageProcessingError'
    this.kind = options.kind || 'processing-failed'
    this.userMessage = userMessage
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

/**
 * Decodes a File/Blob into an ImageBitmap. Respects EXIF orientation
 * automatically (browser default for createImageBitmap).
 */
export async function loadSourceBitmap(file) {
  if (!file) {
    throw new ImageProcessingError('No image was provided.', { kind: 'invalid-image' })
  }
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file)
      return bitmap
    } catch (error) {
      throw new ImageProcessingError('The selected file could not be read as an image.', {
        kind: 'invalid-image',
        cause: error,
      })
    }
  }
  throw new ImageProcessingError('Image processing is not supported on this device.', {
    kind: 'unsupported',
  })
}

function makeCanvas(width, height) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

function getContext(canvas) {
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) {
    throw new ImageProcessingError('The image could not be processed in the browser.', {
      kind: 'canvas-failed',
    })
  }
  return context
}

/**
 * Creates a working canvas from a source (bitmap or canvas), optionally
 * up-scaling small images to a size more suitable for OCR.
 */
export function makeWorkingCanvas(source, opts = {}) {
  const targetWidth = opts.resizeWidth ? Math.min(opts.resizeWidth, MAX_WORK_WIDTH) : null

  let width = source.width
  let height = source.height

  if (targetWidth && targetWidth > source.width) {
    width = targetWidth
    height = Math.max(1, Math.round((source.height / source.width) * width))
  } else if (width > MAX_WORK_WIDTH) {
    height = Math.max(1, Math.round((height / width) * MAX_WORK_WIDTH))
    width = MAX_WORK_WIDTH
  }

  const canvas = makeCanvas(width, height)
  const context = getContext(canvas)
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(source, 0, 0, width, height)
  return canvas
}

/**
 * Raw JPEG EXIF orientation (1..8) so "Correct orientation" can be
 * reported truthfully. The bitmap itself is decoded already-rotated by
 * the browser; this only signals that an orientation correction was
 * applied during decode.
 */
async function getExifOrientation(file) {
  try {
    if (file.type && file.type.toLowerCase() !== 'image/jpeg') return null
    const size = Math.min(file.size || Infinity, 65536)
    const data = new Uint8Array(await file.slice(0, size).arrayBuffer())
    if (data.length < 8 || data[0] !== 0xff || data[1] !== 0xd8) return null

    let offset = 2
    while (offset + 4 <= data.length) {
      if (data[offset] !== 0xff) {
        offset += 1
        continue
      }
      const marker = data[offset + 1]
      if (marker === 0xe1) {
        const length = (data[offset + 2] << 8) | data[offset + 3]
        const segment = offset + 4
        const isExif =
          data[segment] === 0x45 &&
          data[segment + 1] === 0x78 &&
          data[segment + 2] === 0x69 &&
          data[segment + 3] === 0x66 &&
          data[segment + 4] === 0 &&
          data[segment + 5] === 0
        if (isExif) return readTiffOrientation(data, segment + 6)
        offset += 2 + length
      } else if ((marker >= 0xe0 && marker <= 0xef) || marker === 0xdb || marker === 0xc4 || marker === 0xfe) {
        offset += 2 + ((data[offset + 2] << 8) | data[offset + 3])
      } else if (marker >= 0xd0 && marker <= 0xd8) {
        offset += 2
      } else {
        offset += 2 + ((data[offset + 2] << 8) | data[offset + 3])
      }
    }
    return null
  } catch {
    return null
  }
}

function readTiffOrientation(data, start) {
  try {
    if (start + 8 > data.length) return null
    const littleEndian = data[start] === 0x49 && data[start + 1] === 0x49
    const read16 = (o) =>
      littleEndian ? data[o] | (data[o + 1] << 8) : (data[o] << 8) | data[o + 1]
    const read32 = (o) =>
      littleEndian
        ? data[o] | (data[o + 1] << 8) | (data[o + 2] << 16) | (data[o + 3] << 24)
        : (data[o] << 24) | (data[o + 1] << 16) | (data[o + 2] << 8) | data[o + 3]

    if (read16(start + 2) !== 0x2a) return null
    const ifd0 = read32(start + 4)
    if (ifd0 + 2 > data.length) return null
    const entries = read16(start + ifd0)
    for (let i = 0; i < entries; i += 1) {
      const entry = start + ifd0 + 2 + i * 12
      if (entry + 10 > data.length) return null
      if (read16(entry) === 0x0112) return read16(entry + 8)
    }
    return null
  } catch {
    return null
  }
}

export async function readImageOrientation(file) {
  return getExifOrientation(file)
}

/* ------------------------------------------------------------------ */
/* Pixel operations on ImageData                                       */
/* ------------------------------------------------------------------ */

function grayscaleImageData(imageData) {
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    const luma = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])
    data[i] = luma
    data[i + 1] = luma
    data[i + 2] = luma
  }
}

function brightnessContrastImageData(imageData, opts) {
  const data = imageData.data
  const offset = opts.brightnessOffset || 0
  const factor = opts.contrastFactor || 1
  for (let i = 0; i < data.length; i += 4) {
    data[i] = clamp((data[i] - 128) * factor + 128 + offset, 0, 255)
    data[i + 1] = clamp((data[i + 1] - 128) * factor + 128 + offset, 0, 255)
    data[i + 2] = clamp((data[i + 2] - 128) * factor + 128 + offset, 0, 255)
  }
}

function boxBlurImageData(imageData, radius = 1) {
  const { width, height, data } = imageData
  const copy = Uint8ClampedArray.from(data)
  const diameter = (radius * 2 + 1) * (radius * 2 + 1)
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let sumR = 0
      let sumG = 0
      let sumB = 0
      for (let dy = -radius; dy <= radius; dy += 1) {
        for (let dx = -radius; dx <= radius; dx += 1) {
          const px = clamp(x + dx, 0, width - 1)
          const py = clamp(y + dy, 0, height - 1)
          const i = (py * width + px) * 4
          sumR += copy[i]
          sumG += copy[i + 1]
          sumB += copy[i + 2]
        }
      }
      const i = (y * width + x) * 4
      data[i] = sumR / diameter
      data[i + 1] = sumG / diameter
      data[i + 2] = sumB / diameter
    }
  }
}

function sharpenImageData(imageData, amount) {
  const { width, height, data } = imageData
  const kernel = [1, 2, 1, 2, 4, 2, 1, 2, 1]
  const copy = Uint8ClampedArray.from(data)

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let sumR = 0
      let sumG = 0
      let sumB = 0
      let k = 0
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          const px = clamp(x + dx, 0, width - 1)
          const py = clamp(y + dy, 0, height - 1)
          const i = (py * width + px) * 4
          sumR += copy[i] * kernel[k]
          sumG += copy[i + 1] * kernel[k]
          sumB += copy[i + 2] * kernel[k]
          k += 1
        }
      }
      const i = (y * width + x) * 4
      const blurR = sumR / 16
      const blurG = sumG / 16
      const blurB = sumB / 16
      data[i] = clamp(copy[i] + (copy[i] - blurR) * amount, 0, 255)
      data[i + 1] = clamp(copy[i + 1] + (copy[i + 1] - blurG) * amount, 0, 255)
      data[i + 2] = clamp(copy[i + 2] + (copy[i + 2] - blurB) * amount, 0, 255)
    }
  }
}

function otsuThresholdImageData(imageData) {
  const { width, height, data } = imageData
  const histogram = new Uint32Array(256)
  const luma = new Uint8ClampedArray(width * height)
  for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
    const value = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])
    luma[p] = value
    histogram[value] += 1
  }
  const total = width * height
  let sum = 0
  for (let t = 0; t < 256; t += 1) sum += t * histogram[t]
  let sumBackground = 0
  let backgroundWeight = 0
  let maxVariance = -1
  let threshold = 128
  for (let t = 0; t < 256; t += 1) {
    backgroundWeight += histogram[t]
    if (backgroundWeight === 0) continue
    const foregroundWeight = total - backgroundWeight
    if (foregroundWeight === 0) break
    sumBackground += t * histogram[t]
    const backgroundMean = sumBackground / backgroundWeight
    const foregroundMean = (sum - sumBackground) / foregroundWeight
    const variance = backgroundWeight * foregroundWeight * (backgroundMean - foregroundMean) ** 2
    if (variance > maxVariance) {
      maxVariance = variance
      threshold = t
    }
  }
  for (let p = 0; p < luma.length; p += 1) {
    const binary = luma[p] >= threshold ? 255 : 0
    const i = p * 4
    data[i] = binary
    data[i + 1] = binary
    data[i + 2] = binary
  }
}

/**
 * Applies an explicit pipeline to a source canvas, producing a new
 * processed canvas. Never touches the source.
 *
 * opts: { brightnessOffset, contrastFactor, gray, denoise, sharpen, threshold }
 */
export function enhanceCanvas(sourceCanvas, opts = {}) {
  const canvas = makeCanvas(sourceCanvas.width, sourceCanvas.height)
  const context = getContext(canvas)
  context.drawImage(sourceCanvas, 0, 0)
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height)

  if (opts.brightnessOffset || opts.contrastFactor && opts.contrastFactor !== 1) {
    brightnessContrastImageData(imageData, opts)
  }
  if (opts.gray) grayscaleImageData(imageData)
  if (opts.denoise) boxBlurImageData(imageData, 1)
  if (opts.sharpen) sharpenImageData(imageData, opts.sharpen)
  if (opts.threshold) otsuThresholdImageData(imageData)

  context.putImageData(imageData, 0, 0)
  return canvas
}

/**
 * Decides which enhancement operations an image actually needs based on
 * measured properties. Returns { appliedOps, pipeline } where only the
 * applied operations are listed for the information card.
 */
export function decideAutoEnhancement(metrics, sourceWidth, sourceHeight, exifOrientation = null) {
  const pipeline = {
    resizeWidth: null,
    brightnessOffset: 0,
    contrastFactor: 1,
    gray: false,
    denoise: false,
    sharpen: 0,
    threshold: false,
  }
  const appliedOps = []

  if (sourceWidth < 800 || sourceHeight < 600) {
    pipeline.resizeWidth = Math.max(1000, Math.min(TARGET_OCR_WIDTH, sourceWidth * 3))
    appliedOps.push({ key: 'resolution', label: PREPROCESS_OPERATIONS.resolution })
  }

  if (exifOrientation && exifOrientation > 1) {
    appliedOps.push({ key: 'orientation', label: PREPROCESS_OPERATIONS.orientation })
  }

  if (metrics.brightnessMean < 60) {
    pipeline.brightnessOffset = Math.round(clamp(150 - metrics.brightnessMean, 20, 120))
    appliedOps.push({ key: 'brightness', label: PREPROCESS_OPERATIONS.brightness })
  } else if (metrics.brightnessMean > 225) {
    pipeline.brightnessOffset = Math.round(clamp(190 - metrics.brightnessMean, -60, -20))
    appliedOps.push({ key: 'brightness', label: PREPROCESS_OPERATIONS.brightness })
  }

  if (metrics.contrastStd < 30) {
    pipeline.contrastFactor = clamp(60 / Math.max(1, metrics.contrastStd), 1.15, 2.6)
    appliedOps.push({ key: 'contrast', label: PREPROCESS_OPERATIONS.contrast })
  }

  if (metrics.noiseRatio > 0.34) {
    pipeline.denoise = true
    appliedOps.push({ key: 'noise', label: PREPROCESS_OPERATIONS.noise })
  }

  const wantsGray = metrics.meanSaturation < 28
  if (wantsGray) pipeline.gray = true

  if (metrics.avgGradient < 14) {
    pipeline.sharpen = metrics.avgGradient < 7 ? 0.9 : 0.5
  }

  if (wantsGray || pipeline.sharpen > 0) {
    appliedOps.push({
      key: 'textVisibility',
      label: PREPROCESS_OPERATIONS.textVisibility,
    })
  }

  if (wantsGray && metrics.contrastStd < 12 && metrics.brightnessMean < 110) {
    pipeline.threshold = true
    appliedOps.push({ key: 'threshold', label: PREPROCESS_OPERATIONS.threshold })
  }

  return { appliedOps, pipeline }
}

/**
 * Runs the full auto-enhancement pipeline for one source (bitmap or
 * canvas). Returns the processed canvas, the applied operations and the
 * measured metrics used for the decision.
 */
export function processSource(source, { exifOrientation = null, sourceWidth = 0, sourceHeight = 0 } = {}) {
  const width = sourceWidth || source.width
  const height = sourceHeight || source.height
  const metrics = computeImageMetrics(source)
  const decision = decideAutoEnhancement(metrics, width, height, exifOrientation)
  const working = makeWorkingCanvas(source, decision.pipeline)
  const enhanced = enhanceCanvas(working, decision.pipeline)
  return { canvas: enhanced, appliedOps: decision.appliedOps, metrics }
}

/**
 * Converts a canvas to an object-URL-backed Blob. The caller owns the
 * returned URL and must revoke it via freeImageUrl.
 */
export function canvasToImageOutput(canvas) {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new ImageProcessingError('The image could not be exported.', { kind: 'canvas-failed' }))
            return
          }
          resolve({ blob, url: URL.createObjectURL(blob) })
        },
        'image/png',
      )
    } catch (error) {
      reject(new ImageProcessingError('The image could not be exported.', {
        kind: 'canvas-failed',
        cause: error,
      }))
    }
  })
}

export function freeImageUrl(url) {
  if (url && typeof url === 'string') URL.revokeObjectURL(url)
}

export function friendlyProcessingError(error) {
  if (error instanceof ImageProcessingError) return error.userMessage
  return 'Unable to process this image. Please try another image.'
}

/**
 * Crops a source (bitmap or canvas) to a normalized rectangle
 * { x, y, w, h } (0..1) and returns a new canvas.
 */
export function cropSource(source, rect) {
  const left = Math.max(0, Math.round(rect.x * source.width))
  const top = Math.max(0, Math.round(rect.y * source.height))
  const width = Math.max(1, Math.min(source.width - left, Math.round(rect.w * source.width)))
  const height = Math.max(1, Math.min(source.height - top, Math.round(rect.h * source.height)))

  const canvas = makeCanvas(width, height)
  const context = getContext(canvas)
  context.drawImage(source, left, top, width, height, 0, 0, width, height)
  return canvas
}