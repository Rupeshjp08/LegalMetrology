/**
 * Client-side OCR via Tesseract.js (v6).
 *
 * The module owns a single long-lived worker so re-runs are fast. The
 * raw extracted text is returned untouched - OCR only reads text, it
 * never judges quality or compliance.
 *
 * Progress events come straight from Tesseract's own logger:
 *  - traineddata / core loading: status "loading language traineddata" etc.
 *  - recognition: status "recognizing text" with 0..1 progress.
 */

import { createWorker, OEM } from 'tesseract.js'

export class OcrError extends Error {
  constructor(userMessage, options = {}) {
    super(userMessage)
    this.name = 'OcrError'
    this.kind = options.kind || 'processing-failed'
    this.userMessage = userMessage
  }
}

const OCR_LANGUAGE = 'eng'
const MAX_ESTIMATED_INPUT = 15 * 1024 * 1024

let ocrWorker = null
let workerPromise = null
let progressListener = null

// Tesseract workers reject concurrent recognize() calls. Serialize them so
// StrictMode double-effects, re-runs and multi-item batches never overlap.
let recognizeQueue = Promise.resolve()

function runRecognize(input) {
  const attempt = recognizeQueue.then(() => ocrWorker.recognize(input))
  recognizeQueue = attempt.catch(() => undefined)
  return attempt
}

function handleLogger(message) {
  if (!progressListener) return
  let phase = 'reading'
  let progress = typeof message.progress === 'number' ? message.progress : null

  if (/loading tesseract core/i.test(message.status)) phase = 'initializing'
  else if (/initializing tesseract/i.test(message.status)) phase = 'initializing'
  else if (/loading language traineddata/i.test(message.status)) phase = 'initializing'
  else if (/initializing api/i.test(message.status)) phase = 'initializing'
  else if (/recognizing text/i.test(message.status)) phase = 'reading'

  progressListener({ phase, progress })
}

function setProgressListener(listener) {
  progressListener = listener
}

/**
 * Starts (once) and reuses a single Tesseract worker, deduplicating
 * concurrent initialization requests. Uses the package's default CDN
 * for the core + English language data on first load.
 */
function getWorker() {
  if (ocrWorker) return Promise.resolve(ocrWorker)
  if (!workerPromise) {
    workerPromise = createWorker(OCR_LANGUAGE, OEM.LSTM_ONLY, {
      logger: handleLogger,
    })
      .then((worker) => {
        ocrWorker = worker
        workerPromise = null
        return worker
      })
      .catch((error) => {
        workerPromise = null
        console.error('[OCR ERROR] Failed to initialize Tesseract.js worker:', error.message || error)
        throw new OcrError(
          'The OCR engine could not start. Please check your connection and try again.',
          { kind: 'ocr-init-failed', cause: error },
        )
      })
  }
  return workerPromise
}

function normalizeText(raw) {
  if (!raw || typeof raw !== 'string') return ''
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * Decides whether the extracted text is reliable enough for review.
 * Uses real OCR output only - never invents characters.
 *
 * @returns {{ text: string, confidence: number|null, lowQuality: boolean }}
 */
export function evaluateOcrResult(rawText, rawConfidence) {
  const text = normalizeText(rawText)
  const confidence =
    typeof rawConfidence === 'number' && Number.isFinite(rawConfidence)
      ? Math.max(0, Math.min(100, rawConfidence))
      : null

  const significantCharacters = text.replace(/\s+/g, '').length
  const meaningfulLines = text.split('\n').filter((line) => line.trim().length > 1).length

  const tooLittleText = significantCharacters < 12 || meaningfulLines < 2
  const lowConfidence = confidence !== null && confidence < 55

  return { text, confidence, lowQuality: tooLittleText || lowConfidence }
}

/** Prepares an OCR input blob (preprocessed image expected). */
export function prepareOcrInput(fileOrBlob) {
  if (!fileOrBlob) throw new OcrError('No image was provided for text extraction.', { kind: 'invalid-image' })
  if (fileOrBlob.size > MAX_ESTIMATED_INPUT) {
    throw new OcrError('This image is too large for text extraction. Please use the processed image.', {
      kind: 'too-large',
    })
  }
  return fileOrBlob
}

/**
 * Runs OCR on an image blob. Progress is delivered through the same
 * listener used by initializeOcrProgress('recognize').
 *
 * @param {Blob} blob  preprocessed image
 * @param {object} [hooks]
 * @param {(state:{phase:string,progress:number|null})=>void} [hooks.onProgress]
 * @returns {Promise<{ text: string, confidence: number|null, lowQuality: boolean, durationMs: number }>}
 */
export async function extractTextFromImage(blob, hooks = {}) {
  const input = prepareOcrInput(blob)
  const started = Date.now()
  const previousListener = progressListener
  setProgressListener(hooks.onProgress || null)

  try {
    await getWorker()
    const result = await runRecognize(input)
    const rawText = result.data?.text || ''
    const rawConfidence = result.data?.confidence
    const evaluated = evaluateOcrResult(rawText, rawConfidence)
    return {
      ...evaluated,
      durationMs: Date.now() - started,
    }
  } catch (error) {
    if (error instanceof OcrError) throw error
    console.error('[OCR ERROR] Recognition failed:', error.message || error)
    throw new OcrError(
      'Unable to extract readable text from this image. Please capture a clearer package image.',
      { kind: 'processing-failed', cause: error },
    )
  } finally {
    setProgressListener(previousListener)
  }
}

/**
 * Runs OCR directly on a raw (unprocessed) image File or Blob.
 * Used as a fallback when the preprocessed image yields no text.
 *
 * @param {File|Blob} fileOrBlob  original image
 * @param {object} [hooks]
 * @returns {Promise<{ text: string, confidence: number|null, lowQuality: boolean, durationMs: number }>}
 */
export async function extractTextFromRawImage(fileOrBlob, hooks = {}) {
  const input = prepareOcrInput(fileOrBlob)
  const started = Date.now()
  const previousListener = progressListener
  setProgressListener(hooks.onProgress || null)

  try {
    await getWorker()
    const result = await runRecognize(input)
    const rawText = result.data?.text || ''
    const rawConfidence = result.data?.confidence
    const evaluated = evaluateOcrResult(rawText, rawConfidence)
    return {
      ...evaluated,
      durationMs: Date.now() - started,
    }
  } catch (error) {
    console.error('[OCR ERROR] Fallback OCR failed:', error.message || error)
    throw new OcrError(
      'Unable to extract readable text from this image.',
      { kind: 'processing-failed', cause: error },
    )
  } finally {
    setProgressListener(previousListener)
  }
}

/** Friendly message for any OcrError (never exposes raw errors). */
export function friendlyOcrError(error) {
  if (error instanceof OcrError) return error.userMessage
  return 'Unable to extract readable text from this image. Please capture a clearer package image.'
}

/**
 * Releases the shared worker. Safe to call on logout/unmount of the app.
 */
export async function shutdownOcr() {
  if (!ocrWorker) return
  try {
    await ocrWorker.terminate()
  } catch {
    /* worker already gone - ignore */
  }
  ocrWorker = null
}
