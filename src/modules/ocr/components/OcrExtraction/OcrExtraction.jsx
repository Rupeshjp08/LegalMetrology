import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { classNames } from '../../../../utils/classNames'
import Button from '../../../../components/ui/Button/Button'
import Card from '../../../../components/ui/Card/Card'
import Alert from '../../../../components/feedback/Alert/Alert'
import LoadingSpinner from '../../../../components/feedback/LoadingSpinner/LoadingSpinner'
import StatusBadge from '../../../../components/ui/StatusBadge/StatusBadge'
import Icon from '../../../../components/ui/Icon/Icon'
import Modal from '../../../../components/ui/Modal/Modal'
import { extractTextFromImage, friendlyOcrError } from '../../utils/tesseractOcr'
import './OcrExtraction.css'

const LOW_QUALITY_REASONS = [
  'Image is blurry',
  'Text is too small',
  'Poor lighting',
  'Text is partially hidden',
  'Package angle is difficult',
]

function getResult(results, id) {
  return results[id] || { status: 'idle' }
}

/**
 * OCR Text Extraction step. Reads package declarations from the
 * processed images produced in STEP 6 using a real Tesseract.js
 * engine. The extracted text is shown as-is for officer review;
 * compliance judgement happens later, never here.
 */
export default function OcrExtraction({
  items,
  onReprocess,
  onRetake,
  onContinueToAi,
  onOcrComplete,
  className = '',
}) {
  const [results, setResults] = useState({})
  const [selectedId, setSelectedId] = useState(null)
  const [progress, setProgress] = useState(null)
  const [copiedId, setCopiedId] = useState(null)
  const [ocrTextModalOpen, setOcrTextModalOpen] = useState(false)
  const runRef = useRef(0)

  const updateResult = useCallback((id, patch) => {
    setResults((previous) => ({ ...previous, [id]: patch }))
  }, [])

  const runOcrForId = useCallback(
    async (id, runToken) => {
      const item = items.find((entry) => entry.id === id)
      if (!item || !item.blob) {
        updateResult(id, {
          status: 'error',
          text: '',
          confidence: null,
          lowQuality: false,
          error: 'No processed image is available for text extraction.',
        })
        return
      }
      setSelectedId(id)
      setProgress({ phase: 'initializing', progress: null })
      updateResult(id, { status: 'loading' })
      try {
        const output = await extractTextFromImage(item.blob, {
          onProgress: (state) => {
            if (runRef.current !== runToken) return
            setProgress(state)
          },
        })
        if (runRef.current !== runToken) return
        updateResult(id, {
          status: output.text.trim().length === 0 ? 'error' : (output.lowQuality ? 'low' : 'done'),
          text: output.text,
          confidence: output.confidence,
          lowQuality: output.lowQuality,
          durationMs: output.durationMs,
          error: output.text.trim().length === 0 ? 'No readable text was found in this image. The image may be too blurry, rotated, or contain no visible text.' : null,
        })
        setProgress(null)
      } catch (error) {
        if (runRef.current !== runToken) return
        console.error('[OCR ERROR] OCR failed for item:', item.name, error)
        updateResult(id, {
          status: 'error',
          text: '',
          confidence: null,
          lowQuality: false,
          error: friendlyOcrError(error),
        })
        setProgress(null)
      }
    },
    [items, updateResult],
  )

  useEffect(() => {
    if (items.length === 0) {
      setResults({})
      setSelectedId(null)
      return
    }
    runRef.current += 1
    const token = runRef.current
    setResults({})
    setSelectedId(items[0].id)
    const runAll = async () => {
      for (const item of items) {
        if (runRef.current !== token) break
        await runOcrForId(item.id, token)
      }
    }
    runAll()
    return () => {
      runRef.current += 1
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])

  useEffect(() => {
    const allDone = items.length > 0 && items.every((item) => {
      const s = (results[item.id] || {}).status
      return s === 'done' || s === 'low' || s === 'error'
    })
    if (allDone && onOcrComplete) {
      onOcrComplete(results)
    }
  }, [results, items, onOcrComplete])

  const selected = useMemo(() => getResult(results, selectedId), [results, selectedId])
  const selectedItem = items.find((item) => item.id === selectedId) || null

  const anyRunning = items.some((item) => (results[item.id] || {}).status === 'loading')
  const anyFailed = items.some((item) => (results[item.id] || {}).status === 'error')
  const allComplete =
    items.length > 0 &&
    items.every((item) => {
      const status = (results[item.id] || {}).status
      return status === 'done' || status === 'low' || status === 'error'
    })
  const hasLowQuality = items.some((item) => (results[item.id] || {}).status === 'low')
  const anyHasText = items.some((item) => {
    const t = (results[item.id] || {}).text || ''
    return t.trim().length > 0
  })

  const overallTitle = anyRunning ? 'OCR Text Extraction' : anyFailed && !anyHasText ? 'OCR Extraction Issue' : 'OCR Text Extracted'
  const overallMeta =
    anyRunning ? 'Reading text from package…' :
    hasLowQuality ? 'Some results may need attention' :
    anyFailed && !anyHasText ? 'No readable text was extracted' :
    allComplete ? 'All text extracted' :
    'Reading text from package…'

  const handleRerun = (ids) => {
    const token = runRef.current + 1
    runRef.current = token
    const runAll = async () => {
      for (const id of ids) {
        if (runRef.current !== token) break
        await runOcrForId(id, token)
      }
    }
    runAll()
  }

  const handleCopy = async (text) => {
    if (!text) return
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = text
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        textarea.remove()
      }
      setCopiedId(selectedId)
      setTimeout(() => setCopiedId(null), 1800)
    } catch {
      setCopiedId(null)
    }
  }

  const handleContinueLocked =
    !allComplete || anyRunning || (anyFailed && !anyHasText)

  const handleContinueToAi = () => {
    if (!allComplete || anyRunning || (anyFailed && !anyHasText)) return
    const payload = items.map((item) => {
      const result = results[item.id] || {}
      const entry = { name: item.name }
      if (item.originalUrl) entry.originalImage = item.originalUrl
      entry.processedImage = item.processedUrl
      entry.rawOcrText = result.text || ''
      if (typeof result.confidence === 'number') entry.ocrConfidence = result.confidence
      if (result.durationMs) entry.ocrDurationMs = result.durationMs
      return entry
    })
    onContinueToAi(payload)
  }

  return (
    <section className={classNames('ocr-section', className)} aria-label="OCR text extraction">
      <div className="ocr-section__header">
        <div>
          <h2 className="ocr-section__title">{overallTitle}</h2>
          <p className="ocr-section__subtitle">{overallMeta}</p>
        </div>
        {allComplete && !anyRunning && !anyFailed && (
          <StatusBadge status="success" label="Extraction completed" />
        )}
        {allComplete && !anyRunning && anyFailed && anyHasText && (
          <StatusBadge status="warning" label="Partial extraction" />
        )}
        {allComplete && !anyRunning && anyFailed && !anyHasText && (
          <StatusBadge status="error" label="Extraction failed" />
        )}
        {anyRunning && <StatusBadge status="processing" label="Extracting…" />}
      </div>

      {items.length > 1 && (
        <div className="ocr-tabs" role="tablist" aria-label="Images for OCR">
          {items.map((item, index) => {
            const status = (results[item.id] || {}).status
            return (
              <button
                type="button"
                key={item.id}
                role="tab"
                aria-selected={item.id === selectedId}
                className={classNames(
                  'ocr-tabs__tab',
                  item.id === selectedId && 'is-active',
                  status === 'error' && 'is-error',
                  (status === 'done' || status === 'low') && 'is-done',
                )}
                onClick={() => setSelectedId(item.id)}
              >
                <span className="ocr-tabs__name" title={item.name}>
                  {item.name || `Label image ${index + 1}`}
                </span>
                {status === 'done' && <Icon name="check-circle" size={14} className="ocr-tabs__check" />}
                {status === 'low' && <Icon name="alert-triangle" size={14} className="ocr-tabs__warn" />}
                {status === 'loading' && <LoadingSpinner size="sm" />}
              </button>
            )
          })}
        </div>
      )}

      {!selectedItem ? (
        <div className="ocr-section__empty">
          <Icon name="image" size={24} />
          <span>No processed images are available for OCR.</span>
        </div>
      ) : (
        <div className="ocr-grid">
          <div className="ocr-image">
            <Card
              title="Processed Package Image"
              subtitle="Image used for text extraction"
              meta={<StatusBadge status="neutral" label="Preprocessed" />}
            >
              <div className="ocr-image__frame">
                <img
                  src={selectedItem.processedUrl}
                  alt={`Processed package image used for OCR of ${selectedItem.name || 'the label'}`}
                />
              </div>
              <div className="ocr-image__meta">
                <span>{selectedItem.name || 'Label image'}</span>
              </div>
            </Card>
          </div>

          <div className="ocr-result">
            <Card
              title="Extracted Text"
              subtitle="Read directly from the processed image"
              meta={
                selected.status === 'done' ? (
                  <StatusBadge status="success" label="Extracted" />
                ) : selected.status === 'low' ? (
                  <StatusBadge status="warning" label="Low quality" />
                ) : selected.status === 'error' ? (
                  <StatusBadge status="error" label="Failed" />
                ) : (
                  <StatusBadge status="processing" label="Reading…" />
                )
              }
            >
              {selected.status === 'loading' && (
                <div className="ocr-progress" role="status">
                  <img
                    className="ocr-progress__icon"
                    src={selectedItem.processedUrl}
                    alt=""
                    aria-hidden="true"
                  />
                  <div className="ocr-progress__row">
                    <LoadingSpinner />
                    <span>Reading package text…</span>
                  </div>
                  <progress
                    className="ocr-progress__bar"
                    max="100"
                    value={
                      progress && typeof progress.progress === 'number'
                        ? Math.round(progress.progress * 100)
                        : undefined
                    }
                    aria-label={progress?.phase === 'reading' ? 'Reading text' : 'Loading OCR engine'}
                  />
                  <p className="ocr-progress__note">Please wait…</p>
                </div>
              )}

              {selected.status === 'done' && selected.text && (
                <>
                  <div className="ocr-success" role="status">
                    <Icon name="check-circle" size={18} />
                    <span>Text extraction completed</span>
                  </div>
                  {typeof selected.confidence === 'number' && (
                    <p className="ocr-confidence">
                      OCR Confidence: <strong>{Math.round(selected.confidence)}%</strong>
                    </p>
                  )}
                  <div className="ocr-text" tabIndex="0" aria-label="Extracted text">
                    {selected.text}
                  </div>
                  <div className="ocr-result__actions">
                    <Button variant="outline" size="sm" icon="copy" onClick={() => handleCopy(selected.text)}>
                      {copiedId === selectedId ? 'Copied' : 'Copy Text'}
                    </Button>
                  </div>
                </>
              )}

              {selected.status === 'low' && (
                <>
                  <Alert tone="warning" title="Text extraction quality is low">
                    <p>Fewer characters than expected were read from this image. Possible reasons:</p>
                    <ul className="ocr-reasons">
                      {LOW_QUALITY_REASONS.map((reason) => (
                        <li key={reason}>{reason}</li>
                      ))}
                    </ul>
                  </Alert>
                  {selected.text && (
                    <div className="ocr-text ocr-text--partial" tabIndex="0" aria-label="Partially extracted text">
                      {selected.text}
                    </div>
                  )}
                  <div className="ocr-result__actions">
                    <Button variant="primary" size="sm" icon="refresh" onClick={() => handleRerun([selectedId])}>
                      Run OCR Again
                    </Button>
                    <Button variant="outline" size="sm" icon="adjust" onClick={() => onReprocess(selectedItem)}>
                      Reprocess Image
                    </Button>
                    <Button variant="outline" size="sm" icon="camera" onClick={() => onRetake(selectedItem)}>
                      Retake Image
                    </Button>
                  </div>
                </>
              )}

              {selected.status === 'error' && (
                <>
                  <Alert tone="error" title="Text extraction failed">
                    <p>{selected.error}</p>
                  </Alert>
                  <div className="ocr-result__actions">
                    <Button variant="primary" size="sm" icon="refresh" onClick={() => handleRerun([selectedId])}>
                      Run OCR Again
                    </Button>
                    <Button variant="outline" size="sm" icon="adjust" onClick={() => onReprocess(selectedItem)}>
                      Reprocess Image
                    </Button>
                    <Button variant="outline" size="sm" icon="camera" onClick={() => onRetake(selectedItem)}>
                      Retake Image
                    </Button>
                  </div>
                </>
              )}

              {selected.status === 'idle' && (
                <div className="ocr-section__empty">
                  <Icon name="image" size={24} />
                  <span>Waiting for the OCR engine…</span>
                </div>
              )}
            </Card>

            <div className="ocr-footer">
              {items.length > 1 && allComplete && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon="copy"
                  onClick={() =>
                    handleCopy(
                      items
                        .map((item) => `${item.name || 'Label'}\n${(results[item.id] || {}).text || ''}`)
                        .join('\n\n'),
                    )
                  }
                >
                  Copy All Text
                </Button>
              )}
              <Button variant="outline" icon="refresh" onClick={() => handleRerun(items.map((i) => i.id))}>
                Re-run OCR
              </Button>
              <Button
                variant="primary"
                size="lg"
                icon="arrowRight"
                iconPosition="right"
                disabled={handleContinueLocked}
                onClick={handleContinueToAi}
              >
                Continue to AI Extraction
              </Button>
            </div>
            {handleContinueLocked && !anyRunning && (
              <p className="ocr-hint" role="status">
                {anyFailed && !anyHasText
                  ? 'OCR could not extract text from any image. Try retaking the image or reprocessing it.'
                  : 'Resolve the failed result, or use "Run OCR Again" before continuing.'}
              </p>
            )}
          </div>
        </div>
      )}

      <Modal
        open={ocrTextModalOpen}
        onClose={() => setOcrTextModalOpen(false)}
        title="OCR Extracted Text"
        size="lg"
        footer={
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
            <Button
              variant="outline"
              icon="copy"
              onClick={() => {
                const allText = items
                  .map((item) => `${item.name || 'Label'}\n${(results[item.id] || {}).text || ''}`)
                  .join('\n\n')
                if (allText.trim()) handleCopy(allText)
              }}
            >
              Copy Text
            </Button>
            <Button variant="primary" onClick={() => setOcrTextModalOpen(false)}>
              Close
            </Button>
          </div>
        }
      >
        <div className="ocr-modal-text">
          {items.map((item, index) => {
            const result = results[item.id] || {}
            const text = result.text || ''
            return (
              <div key={item.id} className="ocr-modal-text__section">
                <h4 className="ocr-modal-text__label">{item.name || `Label ${index + 1}`}</h4>
                {text.trim() ? (
                  <div className="ocr-modal-text__content" tabIndex={0}>
                    {text}
                  </div>
                ) : (
                  <p className="ocr-modal-text__empty">
                    No text was extracted from this image.
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </Modal>
    </section>
  )
}
