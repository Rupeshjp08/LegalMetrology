import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { classNames } from '../../../../utils/classNames'
import Button from '../../../../components/ui/Button/Button'
import Card from '../../../../components/ui/Card/Card'
import Alert from '../../../../components/feedback/Alert/Alert'
import LoadingSpinner from '../../../../components/feedback/LoadingSpinner/LoadingSpinner'
import StatusBadge from '../../../../components/ui/StatusBadge/StatusBadge'
import Icon from '../../../../components/ui/Icon/Icon'
import {
  loadSourceBitmap,
  readImageOrientation,
  processSource,
  enhanceCanvas,
  canvasToImageOutput,
  cropSource,
  freeImageUrl,
  friendlyProcessingError,
} from '../../utils/imagePreprocessing'
import './ImagePreprocessingPanel.css'

const DEFAULT_MANUAL = { brightness: 0, contrast: 0, sharpness: 0, gray: false }

function getEntry(entries, id) {
  return entries.find((entry) => entry.id === id)
}

/**
 * Image Preprocessing step between quality check and OCR.
 *
 * Runs a measurement-based auto-enhancement on every approved image,
 * then lets the officer crop the label area and fine-tune brightness,
 * contrast, sharpness and grayscale on top of the auto result. Every
 * processed image must be acknowledged with "Use Processed Image"
 * before the officer can continue to OCR.
 *
 * The original image is never modified: processed results are produced
 * on fresh canvases and exposed as object-URL PNG blobs.
 */
export default function ImagePreprocessingPanel({
  images,
  onContinueToOcr,
  className = '',
}) {
  const [entries, setEntries] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [manual, setManual] = useState({})
  const [busy, setBusy] = useState(false)
  const [cropMode, setCropMode] = useState(false)
  const [cropRect, setCropRect] = useState({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 })

  const bitmapsRef = useRef(new Map())
  const baseCanvasesRef = useRef(new Map())
  const urlsRef = useRef(new Set())
  const imageFilesRef = useRef(new Map())

  const selected = useMemo(
    () => getEntry(entries, selectedId) || null,
    [entries, selectedId],
  )

  const updateEntry = useCallback((id, patch) => {
    setEntries((previous) =>
      previous.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)),
    )
  }, [])

  const getManual = (id) => manual[id] || DEFAULT_MANUAL
  const setManualFor = (id, patch) => {
    setManual((previous) => ({
      ...previous,
      [id]: { ...DEFAULT_MANUAL, ...previous[id], ...patch },
    }))
  }

  const autoProcessImage = useCallback(
    async (id) => {
      updateEntry(id, { status: 'processing', error: null })
      try {
        const file = imageFilesRef.current.get(id)
        let bitmap = bitmapsRef.current.get(id)
        if (!bitmap) {
          bitmap = await loadSourceBitmap(file)
          bitmapsRef.current.set(id, bitmap)
        }
        const orientation = await readImageOrientation(file)
        const { canvas, appliedOps } = processSource(bitmap, { exifOrientation: orientation })
        baseCanvasesRef.current.set(id, canvas)
        const { url, blob } = await canvasToImageOutput(canvas)
        urlsRef.current.add(url)
        updateEntry(id, {
          status: 'done',
          processedUrl: url,
          blob,
          ops: appliedOps,
          accepted: false,
          cropped: false,
          cropRect: null,
          tweaked: false,
          error: null,
        })
      } catch (error) {
        updateEntry(id, { status: 'error', error: friendlyProcessingError(error) })
      }
    },
    [updateEntry],
  )

  useEffect(() => {
    if (images.length === 0) {
      setEntries([])
      setSelectedId(null)
      return
    }
    const next = images.map((image) => {
      const existing = getEntry(entries, image.id)
      return existing
        ? { ...existing, name: image.name }
        : { id: image.id, name: image.name, status: 'processing', ops: [], accepted: false }
    })
    setEntries(next)
    imageFilesRef.current = new Map(images.map((image) => [image.id, image.file]))
    setSelectedId((current) => {
      if (current && images.some((image) => image.id === current)) return current
      return images[0].id
    })
    let cancelled = false
    const run = async () => {
      for (const image of images) {
        if (cancelled) break
        const existing = getEntry(entries, image.id)
        if (!existing) await autoProcessImage(image.id)
      }
    }
    run()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images])

  useEffect(() => {
    const urls = urlsRef.current
    const bitmaps = bitmapsRef.current
    return () => {
      urls.forEach((url) => freeImageUrl(url))
      urls.clear()
      bitmaps.forEach((bitmap) => {
        if (bitmap && typeof bitmap.close === 'function') bitmap.close()
      })
      bitmaps.clear()
    }
  }, [])

  const manualCanvas = useCallback(
    async (id) => {
      const base = baseCanvasesRef.current.get(id)
      if (!base) return null
      const values = getManual(id)
      return enhanceCanvas(base, {
        brightnessOffset: Math.round(values.brightness * 0.8),
        contrastFactor: 1 + (values.contrast * 1.2) / 100,
        gray: values.gray,
        sharpen: values.sharpness > 0 ? (values.sharpness * 1.2) / 100 : 0,
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [manual],
  )

  const handleApplyManual = async () => {
    if (!selected || selected.status !== 'done' || busy) return
    setBusy(true)
    try {
      const canvas = await manualCanvas(selected.id)
      if (!canvas) return
      const { url, blob } = await canvasToImageOutput(canvas)
      urlsRef.current.add(url)
      const previousUrl = selected.processedUrl
      updateEntry(selected.id, { processedUrl: url, blob, tweaked: true })
      if (previousUrl) {
        freeImageUrl(previousUrl)
        urlsRef.current.delete(previousUrl)
      }
    } catch (error) {
      updateEntry(selected.id, { status: 'error', error: friendlyProcessingError(error) })
    } finally {
      setBusy(false)
    }
  }

  const handleReset = async () => {
    if (!selected || busy) return
    setBusy(true)
    try {
      const base = baseCanvasesRef.current.get(selected.id)
      if (base) {
        baseCanvasesRef.current.delete(selected.id)
      }
      const currentUrl = selected.processedUrl
      if (currentUrl) {
        freeImageUrl(currentUrl)
        urlsRef.current.delete(currentUrl)
      }
      setManual((previous) => {
        const copy = { ...previous }
        delete copy[selected.id]
        return copy
      })
      setCropMode(false)
      setCropRect({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 })
      updateEntry(selected.id, {
        accepted: false,
        cropped: false,
        cropRect: null,
        tweaked: false,
        processedUrl: null,
        blob: null,
        ops: [],
      })
      await autoProcessImage(selected.id)
    } finally {
      setBusy(false)
    }
  }

  const handleApplyCrop = async () => {
    if (!selected || busy) return
    setBusy(true)
    try {
      const bitmap = bitmapsRef.current.get(selected.id)
      if (!bitmap) return
      const cropped = cropSource(bitmap, cropRect)
      baseCanvasesRef.current.set(selected.id, cropped)
      const currentUrl = selected.processedUrl
      if (currentUrl) {
        freeImageUrl(currentUrl)
        urlsRef.current.delete(currentUrl)
      }
      const { canvas, appliedOps } = processSource(cropped)
      baseCanvasesRef.current.set(selected.id, canvas)
      const { url, blob } = await canvasToImageOutput(canvas)
      urlsRef.current.add(url)
      setCropMode(false)
      updateEntry(selected.id, {
        processedUrl: url,
        blob,
        ops: appliedOps,
        accepted: false,
        cropped: true,
        cropRect: { ...cropRect },
        tweaked: false,
      })
    } catch (error) {
      updateEntry(selected.id, { status: 'error', error: friendlyProcessingError(error) })
    } finally {
      setBusy(false)
    }
  }

  const allDone = entries.length > 0 && entries.every((entry) => entry.status === 'done')
  const allAccepted = entries.length > 0 && entries.every((entry) => entry.accepted)
  const canContinue = allDone && allAccepted && !busy

  const selectedSourceUrl =
    selected && images.some((image) => image.id === selected.id)
      ? images.find((image) => image.id === selected.id).previewUrl
      : null

  if (images.length === 0) {
    return (
      <section className={classNames('pp-section', className)} aria-label="Image preprocessing">
        <div className="pp-section__empty">
          <Icon name="image" size={24} />
          <span>No images to preprocess.</span>
        </div>
      </section>
    )
  }

  return (
    <section className={classNames('pp-section', className)} aria-label="Image preprocessing">
      <h2 className="pp-section__title">Image Preprocessing</h2>
      <p className="pp-section__subtitle">
        Fix lighting, focus and contrast automatically, then fine-tune each label before OCR.
      </p>

      {entries.length > 1 && (
        <div className="pp-tabs" role="tablist" aria-label="Images">
          {entries.map((entry) => (
            <button
              type="button"
              key={entry.id}
              role="tab"
              aria-selected={entry.id === selectedId}
              className={classNames(
                'pp-tabs__tab',
                entry.id === selectedId && 'is-active',
                entry.status === 'error' && 'is-error',
                entry.accepted && 'is-accepted',
              )}
              onClick={() => setSelectedId(entry.id)}
            >
              <span className="pp-tabs__name" title={entry.name}>
                {entry.name || 'Label image'}
              </span>
              {entry.accepted && <Icon name="check-circle" size={14} className="pp-tabs__check" />}
            </button>
          ))}
        </div>
      )}

      {!selected ? (
        <div className="pp-section__empty">
          <LoadingSpinner />
          <span>Preparing images…</span>
        </div>
      ) : (
        <>
          {selected.status === 'error' && (
            <Alert tone="error" title="This image could not be processed.">
              <p>{selected.error}</p>
            </Alert>
          )}

          <div className="pp-grid">
            <div className="pp-image">
              <Card
                title="Original"
                subtitle="Unmodified product label"
                meta={
                  selected.cropped ? (
                    <StatusBadge status="warning" label="Cropped" />
                  ) : (
                    <StatusBadge status="neutral" label="Original" />
                  )
                }
              >
                <div className="pp-image__frame">
                  <img
                    src={selectedSourceUrl}
                    alt={`Original product label of ${selected.name || 'the image'}`}
                  />
                  {cropMode && <CropOverlay rect={cropRect} onChange={setCropRect} />}
                </div>
                {!cropMode ? (
                  <div className="pp-image__toolbar">
                    <Button
                      variant="outline"
                      size="sm"
                      icon="crop"
                      onClick={() => setCropMode(true)}
                    >
                      Crop Label Area
                    </Button>
                  </div>
                ) : (
                  <div className="pp-image__toolbar">
                    <Button variant="outline" size="sm" icon="close" onClick={() => setCropMode(false)}>
                      Cancel Crop
                    </Button>
                    <Button variant="primary" size="sm" icon="check" onClick={handleApplyCrop}>
                      Apply Crop
                    </Button>
                  </div>
                )}
              </Card>
            </div>

            <div className="pp-image">
              <Card
                title="OCR Ready Image"
                subtitle={busy ? 'Processing…' : 'Preprocessed for text extraction'}
                meta={
                  selected.status === 'done' ? (
                    <StatusBadge status="success" label="READY FOR OCR" />
                  ) : selected.status === 'processing' ? (
                    <StatusBadge status="processing" label="Processing…" />
                  ) : (
                    <StatusBadge status="error" label="Failed" />
                  )
                }
              >
                <div className="pp-image__frame">
                  {selected.status === 'processing' && (
                    <div className="pp-image__loading" role="status">
                      <LoadingSpinner />
                      <span>Processing image…</span>
                    </div>
                  )}
                  {selected.status === 'done' && selected.processedUrl && (
                    <img
                      src={selected.processedUrl}
                      alt={`Processed product label ready for OCR of ${selected.name || 'the image'}`}
                    />
                  )}
                  {selected.status === 'done' && (
                    <div className="pp-done" role="status">
                      <Icon name="check-circle" size={18} />
                      <span>Image processed successfully</span>
                      {selected.tweaked && <span className="pp-done__note">· manual adjustments applied</span>}
                    </div>
                  )}
                </div>

                {selected.status === 'done' && (
                  <div className="pp-ops">
                    <p className="pp-ops__title">Enhancements applied automatically</p>
                    {selected.ops.length > 0 ? (
                      <ul className="pp-ops__list">
                        {selected.ops.map((operation) => (
                          <li key={operation.key} className="pp-ops__item">
                            <Icon name="check" size={14} className="pp-ops__check" />
                            <span>{operation.label}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="pp-ops__none">No adjustments were necessary for this image.</p>
                    )}
                  </div>
                )}
              </Card>
            </div>
          </div>

          {selected.status === 'done' && (
            <div className="pp-controls">
              <div className="pp-controls__group">
                <label className="pp-controls__label" htmlFor="pp-brightness">
                  Brightness <span>{manual[selected.id]?.brightness ?? 0}</span>
                </label>
                <input
                  id="pp-brightness"
                  type="range"
                  min="-100"
                  max="100"
                  step="5"
                  value={manual[selected.id]?.brightness ?? 0}
                  onChange={(event) =>
                    setManualFor(selected.id, { brightness: Number(event.target.value) })
                  }
                />
              </div>

              <div className="pp-controls__group">
                <label className="pp-controls__label" htmlFor="pp-contrast">
                  Contrast <span>{manual[selected.id]?.contrast ?? 0}</span>
                </label>
                <input
                  id="pp-contrast"
                  type="range"
                  min="-100"
                  max="100"
                  step="5"
                  value={manual[selected.id]?.contrast ?? 0}
                  onChange={(event) =>
                    setManualFor(selected.id, { contrast: Number(event.target.value) })
                  }
                />
              </div>

              <div className="pp-controls__group">
                <label className="pp-controls__label" htmlFor="pp-sharpness">
                  Sharpness <span>{manual[selected.id]?.sharpness ?? 0}</span>
                </label>
                <input
                  id="pp-sharpness"
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={manual[selected.id]?.sharpness ?? 0}
                  onChange={(event) =>
                    setManualFor(selected.id, { sharpness: Number(event.target.value) })
                  }
                />
              </div>

              <div className="pp-controls__group pp-controls__group--toggle">
                <label className="pp-controls__toggle">
                  <input
                    type="checkbox"
                    checked={manual[selected.id]?.gray ?? false}
                    onChange={(event) =>
                      setManualFor(selected.id, { gray: event.target.checked })
                    }
                  />
                  <span>Grayscale</span>
                </label>
              </div>

              <div className="pp-controls__actions">
                <Button
                  variant="ghost"
                  size="sm"
                  icon="rotate"
                  onClick={handleReset}
                  disabled={busy}
                  loading={busy}
                >
                  Reset
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  icon="adjust"
                  onClick={handleApplyManual}
                  disabled={busy}
                >
                  Apply Changes
                </Button>
              </div>
            </div>
          )}

          <div className="pp-actions">
            <Button
              variant="secondary"
              icon="check"
              iconPosition="left"
              disabled={selected.status !== 'done' || selected.accepted || busy}
              onClick={() => updateEntry(selected.id, { accepted: true })}
            >
              {selected.accepted ? 'Image used' : 'Use Processed Image'}
            </Button>
            <Button
              variant="primary"
              size="lg"
              icon="arrowRight"
              iconPosition="right"
              disabled={!canContinue}
              onClick={() =>
                onContinueToOcr(
                  entries.map((entry) => ({
                    id: entry.id,
                    name: entry.name,
                    url: entry.processedUrl,
                    blob: entry.blob,
                  })),
                )
              }
            >
              Continue to OCR
            </Button>
          </div>

          {!allAccepted && (
            <p className="pp-hint" role="status">
              Confirm each image with “Use Processed Image” to continue to OCR.
            </p>
          )}
        </>
      )}
    </section>
  )
}

/**
 * Draggable, resizable crop rectangle overlaying the source image.
 * Coordinates are normalized 0..1 so they survive responsive resizing.
 */
function CropOverlay({ rect, onChange }) {
  const stageRef = useRef(null)
  const pointerRef = useRef(null)

  const handlePointerDown = (event, mode) => {
    if (!stageRef.current) return
    pointerRef.current = { mode, startX: event.clientX, startY: event.clientY, rect: { ...rect } }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event) => {
    if (!pointerRef.current || !stageRef.current) return
    const stage = stageRef.current.getBoundingClientRect()
    const { mode, startX, startY, rect: startRect } = pointerRef.current
    const dx = (event.clientX - startX) / stage.width
    const dy = (event.clientY - startY) / stage.height

    if (mode === 'move') {
      const x = Math.max(0, Math.min(1 - startRect.w, startRect.x + dx))
      const y = Math.max(0, Math.min(1 - startRect.h, startRect.y + dy))
      onChange({ ...startRect, x, y })
    } else {
      const w = Math.max(0.05, Math.min(1 - startRect.x, startRect.w + dx))
      const h = Math.max(0.05, Math.min(1 - startRect.y, startRect.h + dy))
      onChange({ ...startRect, w, h })
    }
  }

  const handlePointerUp = () => {
    pointerRef.current = null
  }

  return (
    <div
      ref={stageRef}
      className="pp-crop"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div
        className="pp-crop__box"
        style={{
          left: `${rect.x * 100}%`,
          top: `${rect.y * 100}%`,
          width: `${rect.w * 100}%`,
          height: `${rect.h * 100}%`,
        }}
        onPointerDown={(event) => handlePointerDown(event, 'move')}
      >
        <span
          className="pp-crop__handle"
          onPointerDown={(event) => handlePointerDown(event, 'resize')}
          aria-label="Resize crop area"
        />
      </div>
    </div>
  )
}