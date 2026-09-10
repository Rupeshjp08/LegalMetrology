/**
 * Deterministic, client-side image quality analysis.
 *
 * Computes real metrics from the actual image pixels (dimensions,
 * sharpness via Sobel gradients, brightness and contrast via luma
 * statistics) so the result is never faked. Used to decide whether a
 * packaged-commodity photograph is suitable for OCR / label analysis.
 *
 * The analysis does not modify the original file - it reads pixels into
 * an offscreen canvas and returns a plain result object.
 */

export const QUALITY_LEVELS = {
  GOOD: 'good',
  WARNING: 'warning',
  POOR: 'poor',
}

export const QUALITY_LEVEL_ORDER = {
  good: 0,
  warning: 1,
  poor: 2,
}

export const QUALITY_LEVEL_LABELS = {
  good: 'Good',
  warning: 'Warning',
  poor: 'Poor',
}

export const QUALITY_SUMMARIES = {
  good: 'Image is suitable for further processing.',
  warning: 'Image may work, but quality could affect OCR accuracy.',
  poor: 'Image should be captured or uploaded again.',
}

const ANALYSIS_SCALE = 320
const SOBEL_X = [-1, 0, 1, -2, 0, 2, -1, 0, 1]
const SOBEL_Y = [-1, -2, -1, 0, 0, 0, 1, 2, 1]

export class ImageAnalysisError extends Error {
  constructor(userMessage, options = {}) {
    super(userMessage)
    this.name = 'ImageAnalysisError'
    this.kind = options.kind || 'analysis-failed'
    this.userMessage = userMessage
  }
}

function isPoorLevel(level) {
  return level === QUALITY_LEVELS.POOR
}

function levelFromThreshold(value, goodMin, goodMax, warnMin, warnMax) {
  if (value >= goodMin && value <= goodMax) return QUALITY_LEVELS.GOOD
  if (value >= warnMin && value <= warnMax) return QUALITY_LEVELS.WARNING
  return QUALITY_LEVELS.POOR
}

function scoreForLevel(level) {
  if (level === QUALITY_LEVELS.GOOD) return 90
  if (level === QUALITY_LEVELS.WARNING) return 55
  return 25
}

function worstLevel(levels) {
  return levels.reduce(
    (worst, level) =>
      QUALITY_LEVEL_ORDER[level] > QUALITY_LEVEL_ORDER[worst] ? level : worst,
    QUALITY_LEVELS.GOOD,
  )
}

/**
 * Loads a File/Blob into an ImageBitmap without leaking object URLs.
 */
function loadImageBitmap(file) {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(file)
  }
  throw new ImageAnalysisError('Image processing is not supported on this device.', {
    kind: 'unsupported',
  })
}

function computeLumaArray(imageData) {
  const data = imageData.data
  const luma = new Float32Array(imageData.width * imageData.height)
  for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
    luma[p] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
  }
  return luma
}

/**
 * Mean + standard deviation of luminance. Reflects overall brightness
 * and contrast of the frame.
 */
function computeLumaStats(luma, count) {
  let sum = 0
  let sumSq = 0
  for (let i = 0; i < count; i += 1) {
    const value = luma[i]
    sum += value
    sumSq += value * value
  }
  const mean = sum / count
  const variance = Math.max(0, sumSq / count - mean * mean)
  return { mean, std: Math.sqrt(variance) }
}

/**
 * Average Sobel gradient magnitude plus edge statistics. Low gradient =
 * blurry/unfocused; high gradient = sharp edges (typical of readable
 * print labels). `midFrequency` captures grain/noise: pixels whose
 * gradient is above flatness but below a strong edge.
 */
function computeGradientStats(luma, width, height) {
  let gradientSum = 0
  let countedPixels = 0
  let edgePixels = 0
  let midPixels = 0

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      let gx = 0
      let gy = 0
      for (let ky = -1; ky <= 1; ky += 1) {
        const rowOffset = (y + ky) * width
        const kernelRow = (ky + 1) * 3
        for (let kx = -1; kx <= 1; kx += 1) {
          const pixel = luma[rowOffset + x + kx]
          const kernelIndex = kernelRow + (kx + 1)
          gx += pixel * SOBEL_X[kernelIndex]
          gy += pixel * SOBEL_Y[kernelIndex]
        }
      }
      const magnitude = Math.hypot(gx, gy)
      gradientSum += magnitude
      countedPixels += 1
      if (magnitude > 40) edgePixels += 1
      else if (magnitude > 6) midPixels += 1
    }
  }

  if (countedPixels === 0) return { avgGradient: 0, edgeDensity: 0, midFrequency: 0 }
  return {
    avgGradient: gradientSum / countedPixels,
    edgeDensity: edgePixels / countedPixels,
    midFrequency: midPixels / countedPixels,
  }
}

function computeMeanSaturation(imageData) {
  const data = imageData.data
  const count = imageData.width * imageData.height
  let saturation = 0
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    saturation += max - min
  }
  return saturation / Math.max(1, count)
}

/**
 * Shared, deterministic measurement of an image source (ImageBitmap or
 * canvas). Used by the Image Quality Check analyzer and reused by the
 * Image Preprocessing engine so both steps are consistent.
 *
 * @param {ImageBitmap|HTMLCanvasElement} source
 * @returns {{
 *   width: number,
 *   height: number,
 *   brightnessMean: number,
 *   contrastStd: number,
 *   avgGradient: number,
 *   edgeDensity: number,
 *   meanSaturation: number,
 *   noiseRatio: number,
 * }}
 */
export function computeImageMetrics(source) {
  const imageData = drawScaledBitmap(source)
  const luma = computeLumaArray(imageData)
  const pixelCount = luma.length
  const { mean: brightnessMean, std: contrastStd } = computeLumaStats(luma, pixelCount)
  const { avgGradient, edgeDensity, midFrequency } = computeGradientStats(
    luma,
    imageData.width,
    imageData.height,
  )
  const meanSaturation = computeMeanSaturation(imageData)
  return {
    width: imageData.width,
    height: imageData.height,
    brightnessMean,
    contrastStd,
    avgGradient,
    edgeDensity,
    meanSaturation,
    noiseRatio: midFrequency,
  }
}

function drawScaledBitmap(source) {
  const canvas = document.createElement('canvas')
  const scale = Math.min(1, ANALYSIS_SCALE / Math.max(source.width, source.height))
  canvas.width = Math.max(1, Math.round(source.width * scale))
  canvas.height = Math.max(1, Math.round(source.height * scale))
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) {
    throw new ImageAnalysisError('The image could not be processed on this device.', {
      kind: 'unsupported',
    })
  }
  context.drawImage(source, 0, 0, canvas.width, canvas.height)
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
  canvas.width = 0
  canvas.height = 0
  return imageData
}

function analyzeResolution(width, height) {
  const pixels = width * height
  if (pixels < 10000 || width < 100 || height < 100) {
    return {
      name: 'resolution',
      label: 'Resolution',
      level: QUALITY_LEVELS.POOR,
      score: 25,
      value: `${width} × ${height}`,
      reason: 'Image is too small for readable text extraction.',
    }
  }
  if (width >= 800 && height >= 600) {
    return {
      name: 'resolution',
      label: 'Resolution',
      level: QUALITY_LEVELS.GOOD,
      score: 90,
      value: `${width} × ${height}`,
      reason: 'Resolution is sufficient for text extraction.',
    }
  }
  if (width >= 400 && height >= 300) {
    return {
      name: 'resolution',
      label: 'Resolution',
      level: QUALITY_LEVELS.WARNING,
      score: 55,
      value: `${width} × ${height}`,
      reason: 'Resolution is below the recommended size; small text may be hard to read.',
    }
  }
  return {
    name: 'resolution',
    label: 'Resolution',
    level: QUALITY_LEVELS.POOR,
    score: 25,
    value: `${width} × ${height}`,
    reason: 'Image resolution is too low for OCR.',
  }
}

function analyzeSharpness(avgGradient) {
  return {
    name: 'sharpness',
    label: 'Sharpness',
    level: levelFromThreshold(avgGradient, 14, Infinity, 7, 14),
    value: `Gradient ${avgGradient.toFixed(1)}`,
    reason: '',
  }
}

function analyzeBrightness(meanLuma) {
  const level = levelFromThreshold(meanLuma, 40, 235, 30, 248)
  return {
    name: 'brightness',
    label: 'Brightness',
    level,
    value: meanLuma.toFixed(0),
    reason: '',
  }
}

function analyzeContrast(stdLuma) {
  const level = levelFromThreshold(stdLuma, 35, Infinity, 12, 35)
  return {
    name: 'contrast',
    label: 'Contrast',
    level,
    value: stdLuma.toFixed(1),
    reason: '',
  }
}

const CHECK_REASONS = {
  sharpness: {
    good: 'The image is sharp and in focus.',
    warning: 'The image is somewhat soft; fine text may be less clear.',
    poor: 'The image is too blurry; text may not be readable.',
  },
  brightness: {
    good: 'The image is well-lit.',
    warning:
      meanLuma => `Brightness is ${meanLuma < 40 ? 'too low' : 'too high'}; adjust lighting for best results.`,
    poor:
      meanLuma => (meanLuma < 30
        ? 'The image is too dark for text extraction.'
        : 'The image is overexposed; text may be washed out.'),
  },
  contrast: {
    good: 'The image has good contrast.',
    warning: 'Contrast is moderate; text may need brighter lighting.',
    poor: 'Contrast is too low; text may not be distinguishable.',
  },
  textVisibility: {
    good: 'Text is clearly visible in the image.',
    warning: 'Text visibility may be reduced in some areas.',
    poor: 'Text is not clearly visible; re-capture with better lighting and focus.',
  },
}

function resolveReason(check, metricValues) {
  const { name, level } = check
  const table = CHECK_REASONS[name]
  if (!table) return ''
  const entry = table[level]
  if (typeof entry === 'function') return entry(metricValues.brightnessMean)
  return entry
}

/**
 * Analyzes an image file and returns a deterministic quality result.
 *
 * @param {File|Blob} file
 * @returns {Promise<{
 *   level: 'good'|'warning'|'poor',
 *   score: number,
 *   dimensions: { width: number, height: number },
 *   checks: Array<{ name, label, level, score, value, reason }>,
 *   problems: string[],
 *   suggestions: string[],
 *   summary: string
 * }>}
 */
export async function analyzeImageQuality(file) {
  if (!file) throw new ImageAnalysisError('No image was provided.', { kind: 'invalid-image' })

  let bitmap
  try {
    bitmap = await loadImageBitmap(file)
  } catch (error) {
    if (error instanceof ImageAnalysisError) throw error
    throw new ImageAnalysisError('The selected file could not be read as an image.', {
      kind: 'invalid-image',
      cause: error,
    })
  }

  try {
    const dimensionCheck = analyzeResolution(bitmap.width, bitmap.height)

    const metricValues = computeImageMetrics(bitmap)
    const { brightnessMean, contrastStd, avgGradient } = metricValues

    const sharpnessCheck = analyzeSharpness(avgGradient)
    sharpnessCheck.score = scoreForLevel(sharpnessCheck.level)
    sharpnessCheck.reason = resolveReason(sharpnessCheck, { brightnessMean })

    const brightnessCheck = analyzeBrightness(brightnessMean)
    brightnessCheck.score = scoreForLevel(brightnessCheck.level)
    brightnessCheck.reason = resolveReason(brightnessCheck, { brightnessMean })

    const contrastCheck = analyzeContrast(contrastStd)
    contrastCheck.score = scoreForLevel(contrastCheck.level)
    contrastCheck.reason = resolveReason(contrastCheck, { brightnessMean })

    const textVisibilityLevel = worstLevel([
      sharpnessCheck.level,
      contrastCheck.level,
    ])
    const textVisibilityCheck = {
      name: 'textVisibility',
      label: 'Text Visibility',
      level: textVisibilityLevel,
      score: scoreForLevel(textVisibilityLevel),
      value:
        textVisibilityLevel === QUALITY_LEVELS.GOOD
          ? 'Readable'
          : textVisibilityLevel === QUALITY_LEVELS.WARNING
            ? 'Partially readable'
            : 'Not readable',
      reason: resolveReason(
        { name: 'textVisibility', level: textVisibilityLevel },
        { brightnessMean },
      ),
    }

    const checks = [
      dimensionCheck,
      brightnessCheck,
      sharpnessCheck,
      contrastCheck,
      textVisibilityCheck,
    ]

    const weights = {
      resolution: 0.15,
      brightness: 0.15,
      contrast: 0.2,
      sharpness: 0.25,
      textVisibility: 0.25,
    }

    const rawScore = checks.reduce(
      (total, check) => total + check.score * weights[check.name],
      0,
    )
    const score = Math.round(rawScore)

    const worstCheckLevel = worstLevel(checks.map((check) => check.level))
    const computedLevel =
      worstCheckLevel === QUALITY_LEVELS.POOR || score < 60
        ? QUALITY_LEVELS.POOR
        : worstCheckLevel === QUALITY_LEVELS.WARNING || score < 80
          ? QUALITY_LEVELS.WARNING
          : QUALITY_LEVELS.GOOD

    const problems = checks
      .filter((check) => isPoorLevel(check.level))
      .map((check) => check.reason)
      .filter(Boolean)

    const warnings = checks
      .filter((check) => check.level === QUALITY_LEVELS.WARNING)
      .map((check) => check.reason)
      .filter(Boolean)

    const suggestions = []
    if (problems.some((message) => message.includes('blur'))) {
      suggestions.push('Hold the camera steady and wait for focus before capturing.')
    }
    if (problems.some((message) => message.includes('dark'))) {
      suggestions.push('Use better lighting or move closer to a light source.')
    }
    if (problems.some((message) => message.includes('overexposed') || message.includes('washed'))) {
      suggestions.push('Reduce glare or move away from direct light.')
    }
    if (problems.some((message) => message.includes('too low'))) {
      suggestions.push('Capture the label closer with the full package in frame.')
    }
    if (dimensionCheck.level !== QUALITY_LEVELS.GOOD) {
      suggestions.push('Capture the image at a higher resolution.')
    }
    if (suggestions.length === 0 && warnings.length > 0) {
      suggestions.push('Reframe the package to keep the label fully visible.')
    }

    return {
      level: computedLevel,
      score,
      dimensions: { width: bitmap.width, height: bitmap.height },
      checks,
      problems: [...new Set(problems)].slice(0, 5),
      warnings: [...new Set(warnings)].slice(0, 5),
      suggestions: [...new Set(suggestions)].slice(0, 4),
      summary: QUALITY_SUMMARIES[computedLevel],
    }
  } catch (error) {
    if (error instanceof ImageAnalysisError) throw error
    throw new ImageAnalysisError('The image could not be analyzed. Please try another image.', {
      kind: 'analysis-failed',
      cause: error,
    })
  } finally {
    if (bitmap && typeof bitmap.close === 'function') bitmap.close()
  }
}