import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { BarcodeFormat, DecodeHintType } from '@zxing/library'
import Button from '../../components/ui/Button/Button'
import Icon from '../../components/ui/Icon/Icon'
import Modal from '../../components/ui/Modal/Modal'
import './QRBarcodeScannerModal.css'

const VERIFY_TIMEOUT_MS = 15000
const NO_DETECT_TIMEOUT_MS = 25000
const VIDEO_READY_CHECK_INTERVAL_MS = 100
const NATIVE_SCAN_INTERVAL_MS = 100
const FRAME_DECODE_INTERVAL_MS = 250

const DENIED_ERRORS = ['NotAllowedError', 'PermissionDeniedError', 'SecurityError']
const UNSUPPORTED_ERRORS = [
  'NotFoundError',
  'OverconstrainedError',
  'NotReadableError',
  'NotSupportedError',
  'AbortError',
]

const FORMAT_DECODE_HINTS = new Map([
  [DecodeHintType.TRY_HARDER, true],
])

const FORMAT_LABELS = {
  [BarcodeFormat.QR_CODE]: 'QR Code',
  [BarcodeFormat.AZTEC]: 'Aztec',
  [BarcodeFormat.CODABAR]: 'Codabar',
  [BarcodeFormat.DATA_MATRIX]: 'Data Matrix',
  [BarcodeFormat.EAN_13]: 'EAN-13',
  [BarcodeFormat.EAN_8]: 'EAN-8',
  [BarcodeFormat.UPC_A]: 'UPC-A',
  [BarcodeFormat.UPC_E]: 'UPC-E',
  [BarcodeFormat.CODE_128]: 'Code 128',
  [BarcodeFormat.CODE_39]: 'Code 39',
  [BarcodeFormat.ITF]: 'ITF',
  [BarcodeFormat.PDF_417]: 'PDF417',
  [BarcodeFormat.RSS_14]: 'RSS-14',
  [BarcodeFormat.RSS_EXPANDED]: 'RSS Expanded',
}

function formatLabel(format) {
  return FORMAT_LABELS[format] || String(format ?? '').replace(/_/g, ' ')
}

function isDeniedError(name) {
  return DENIED_ERRORS.includes(name)
}

function isUnsupportedError(name) {
  return UNSUPPORTED_ERRORS.includes(name)
}

function mediaFailureState(error) {
  const name = error?.name || ''
  if (isDeniedError(name)) return 'denied'
  if (isUnsupportedError(name)) return 'unsupported'
  if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return 'unsupported'
  }
  return 'error'
}

function stopStream(stream) {
  if (!stream) return
  stream.getTracks().forEach((track) => {
    try {
      track.stop()
    } catch {
      // ignore cleanup errors
    }
  })
}

function isMobileDevice() {
  if (typeof navigator === 'undefined') return false
  return /Android|iPhone|iPad|iPod|Mobile|Windows Phone/i.test(navigator.userAgent || '')
}

/**
 * Wait until the video element reports valid dimensions and is actually
 * playing. Resolves with the video element or rejects on timeout.
 */
function waitForVideoReady(videoEl, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    if (!videoEl) return reject(new Error('Video element not found.'))

    const isReady = () =>
      videoEl.videoWidth > 0 &&
      videoEl.videoHeight > 0 &&
      videoEl.readyState >= 2 &&
      !videoEl.paused

    if (isReady()) return resolve(videoEl)

    const startTime = Date.now()
    const check = () => {
      if (isReady()) {
        cleanup()
        return resolve(videoEl)
      }
      if (Date.now() - startTime > timeoutMs) {
        cleanup()
        return reject(new Error('Timed out waiting for video to become ready.'))
      }
    }

    const intervalId = setInterval(check, VIDEO_READY_CHECK_INTERVAL_MS)

    const onPlay = () => check()
    const onLoadedData = () => check()
    videoEl.addEventListener('play', onPlay)
    videoEl.addEventListener('loadeddata', onLoadedData)

    function cleanup() {
      clearInterval(intervalId)
      videoEl.removeEventListener('play', onPlay)
      videoEl.removeEventListener('loadeddata', onLoadedData)
    }
  })
}

/**
 * Capture the current video frame and, when reliable, attempt to crop a
 * square region around the detected barcode. Falls back to the full frame.
 */
function captureFrame(videoRef, points) {
  const video = videoRef.current
  if (!video || video.videoWidth === 0 || video.videoHeight === 0) return null

  let left = 0
  let top = 0
  let width = video.videoWidth
  let height = video.videoHeight

  if (Array.isArray(points) && points.length > 2) {
    const xs = points.map((p) => p.x)
    const ys = points.map((p) => p.y)
    const rawLeft = Math.min(...xs)
    const rawTop = Math.min(...ys)
    const rawRight = Math.max(...xs)
    const rawBottom = Math.max(...ys)

    const padding = 12
    left = Math.max(0, Math.floor(rawLeft - padding))
    top = Math.max(0, Math.floor(rawTop - padding))
    width = Math.min(video.videoWidth - left, Math.ceil(rawRight - rawLeft + padding * 2))
    height = Math.min(video.videoHeight - top, Math.ceil(rawBottom - rawTop + padding * 2))
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.drawImage(video, left, top, width, height, 0, 0, width, height)

  const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
  return { dataUrl, region: points ? 'barcode' : 'full' }
}

function decodeBarcodeFromImage(reader, image) {
  const rotations = [0, 180, 90, 270]
  const scale = Math.max(2, Math.min(4, 1600 / Math.max(image.width, image.height)))

  for (const rotation of rotations) {
    const quarterTurn = rotation === 90 || rotation === 270
    const canvas = document.createElement('canvas')
    canvas.width = Math.round((quarterTurn ? image.height : image.width) * scale)
    canvas.height = Math.round((quarterTurn ? image.width : image.height) * scale)
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) continue

    context.save()
    context.translate(canvas.width / 2, canvas.height / 2)
    context.rotate((rotation * Math.PI) / 180)
    context.filter = 'grayscale(1) contrast(1.35) brightness(1.08)'
    context.drawImage(
      image,
      -(image.width * scale) / 2,
      -(image.height * scale) / 2,
      image.width * scale,
      image.height * scale,
    )
    context.restore()

    try {
      return { result: reader.decodeFromCanvas(canvas), dataUrl: canvas.toDataURL('image/jpeg', 0.9) }
    } catch {
      // Try the next orientation; packaging photos are often upside down.
    }
  }

  throw new Error('Barcode was not found in the image.')
}

function decodeVideoFrame(reader, video, context, canvas) {
  const sourceWidth = video.videoWidth
  const sourceHeight = video.videoHeight
  const candidates = [
    { left: 0, top: 0, width: sourceWidth, height: sourceHeight },
    { left: 0.05, top: 0.2, width: 0.9, height: 0.6 },
    { left: 0.15, top: 0.3, width: 0.7, height: 0.4 },
    { left: 0, top: 0.25, width: 0.58, height: 0.5 },
    { left: 0.42, top: 0.2, width: 0.58, height: 0.6 },
  ]
  const filters = [
    'none',
    'grayscale(1) contrast(1.25) brightness(1.05)',
    'grayscale(1) contrast(1.8) brightness(1.15)',
    'grayscale(1) contrast(1.5) brightness(0.85) invert(1)',
  ]

  for (const candidate of candidates) {
    const cropLeft = Math.floor(sourceWidth * candidate.left)
    const cropTop = Math.floor(sourceHeight * candidate.top)
    const cropWidth = Math.floor(sourceWidth * candidate.width)
    const cropHeight = Math.floor(sourceHeight * candidate.height)
    const scale = Math.min(2.5, 1920 / Math.max(cropWidth, cropHeight))

    canvas.width = Math.floor(cropWidth * scale)
    canvas.height = Math.floor(cropHeight * scale)
    for (const filter of filters) {
      context.filter = filter
      context.drawImage(
        video,
        cropLeft,
        cropTop,
        cropWidth,
        cropHeight,
        0,
        0,
        canvas.width,
        canvas.height,
      )
      context.filter = 'none'

      try {
        return reader.decodeFromCanvas(canvas)
      } catch {
        // Try another enhancement or crop from the same camera frame.
      }
    }
  }

  throw new Error('Barcode was not found in the camera frame.')
}

export default function QRBarcodeScannerModal({ open, onClose, onResult, onRequestUpload }) {
  const videoRef = useRef(null)
  const imagePickerRef = useRef(null)
  const controlsRef = useRef(null)
  const codeReaderRef = useRef(null)
  const streamRef = useRef(null)
  const detectingRef = useRef(false)
  const generationRef = useRef(0)
  const verifyTimerRef = useRef(null)
  const noDetectTimerRef = useRef(null)
  const activeDeviceIdRef = useRef('')
  const selectedDeviceIdRef = useRef('')
  const nativeScanFrameRef = useRef(null)
  const nativeScanLastRunRef = useRef(0)
  const frameDecodeTimerRef = useRef(null)

  const [status, setStatus] = useState('idle')
  const [detected, setDetected] = useState(null)
  const [devices, setDevices] = useState([])
  const [selectedDeviceId, setSelectedDeviceId] = useState('')
  const [guideMessage, setGuideMessage] = useState('')
  const [showNoDetectHint, setShowNoDetectHint] = useState(false)
  const [manualEntry, setManualEntry] = useState(false)
  const [manualBarcode, setManualBarcode] = useState('')
  const [captureMessage, setCaptureMessage] = useState('')

  const isMobile = useMemo(isMobileDevice, [])

  const clearTimers = useCallback(() => {
    if (verifyTimerRef.current) {
      clearTimeout(verifyTimerRef.current)
      verifyTimerRef.current = null
    }
    if (noDetectTimerRef.current) {
      clearTimeout(noDetectTimerRef.current)
      noDetectTimerRef.current = null
    }
  }, [])

  /**
   * Stop whatever is active (decode loop + MediaStream tracks) and
   * invalidate any pending async scanner work. Safe to call repeatedly.
   */
  const stopScanner = useCallback(() => {
    generationRef.current += 1
    detectingRef.current = true
    clearTimers()
    setGuideMessage('')

    if (controlsRef.current) {
      try {
        controlsRef.current.stop()
      } catch {
        // ignore cleanup errors
      }
      controlsRef.current = null
    }
    codeReaderRef.current = null
    if (nativeScanFrameRef.current) {
      cancelAnimationFrame(nativeScanFrameRef.current)
      nativeScanFrameRef.current = null
    }
    if (frameDecodeTimerRef.current) {
      clearInterval(frameDecodeTimerRef.current)
      frameDecodeTimerRef.current = null
    }

    stopStream(streamRef.current)
    streamRef.current = null

    if (videoRef.current) {
      try {
        videoRef.current.srcObject = null
      } catch {
        // ignore cleanup errors
      }
    }
  }, [clearTimers])

  const loadDevices = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      setDevices([])
      setSelectedDeviceId('')
      return
    }

    try {
      const deviceList = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = deviceList.filter((device) => device.kind === 'videoinput')
      setDevices(videoDevices)

      const currentId = activeDeviceIdRef.current
      if (currentId && videoDevices.some((device) => device.deviceId === currentId)) {
        selectedDeviceIdRef.current = currentId
        setSelectedDeviceId(currentId)
        return
      }
      const fallbackId = videoDevices[0]?.deviceId || ''
      selectedDeviceIdRef.current = fallbackId
      setSelectedDeviceId(fallbackId)
    } catch {
      // Enumerating devices is best-effort; scanning still works without a list.
      setDevices([])
      selectedDeviceIdRef.current = ''
      setSelectedDeviceId('')
    }
  }, [])

  const startScanner = useCallback(() => {
    stopScanner()
    detectingRef.current = false
    setDetected(null)
    setShowNoDetectHint(false)
    setStatus('starting')

    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatus('unsupported')
      return
    }

    const myGen = generationRef.current

    const handleFailure = (error) => {
      if (generationRef.current !== myGen) return
      console.error('[QRBarcodeScanner] Scanner failed:', error)
      stopScanner()
      setStatus(mediaFailureState(error))
    }

    const deviceId = selectedDeviceIdRef.current
    const videoConstraints = isMobile
      ? {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        }
      : deviceId
        ? {
            deviceId: { exact: deviceId },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          }
        : { width: { ideal: 1920 }, height: { ideal: 1080 } }

    const startCamera = () =>
      navigator.mediaDevices
        .getUserMedia({ video: videoConstraints, audio: false })
        .catch((error) => {
          if (!['OverconstrainedError', 'NotFoundError', 'NotReadableError'].includes(error?.name)) {
            throw error
          }
          return navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        })

    startCamera()
      .then((stream) => {
        if (generationRef.current !== myGen) {
          stopStream(stream)
          return undefined
        }
        streamRef.current = stream
        const trackSettings = stream.getVideoTracks()[0]?.getSettings?.()
        if (trackSettings?.deviceId) {
          activeDeviceIdRef.current = trackSettings.deviceId
        }
        const track = stream.getVideoTracks()[0]
        const capabilities = track?.getCapabilities?.()
        if (capabilities?.focusMode?.includes('continuous')) {
          track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] }).catch(() => undefined)
        }
        if (capabilities?.zoom) {
          const zoom = Math.min(capabilities.zoom.max, Math.max(capabilities.zoom.min, capabilities.zoom.min + 1))
          track.applyConstraints({ advanced: [{ zoom }] }).catch(() => undefined)
        }
        loadDevices()
        const videoEl = videoRef.current
        if (!videoEl) throw new Error('Camera preview element is missing.')
        videoEl.srcObject = stream
        return videoEl.play().catch(() => undefined)
      })
      .then(() => {
        if (generationRef.current !== myGen) return
        if (detectingRef.current) return

        const videoEl = videoRef.current
        if (!videoEl) throw new Error('Camera preview element is missing.')

        return waitForVideoReady(videoEl, 5000)
      })
      .then((videoEl) => {
        if (generationRef.current !== myGen) return
        if (detectingRef.current) return

        if (verifyTimerRef.current) clearTimeout(verifyTimerRef.current)
        verifyTimerRef.current = window.setTimeout(() => {
          handleFailure(new Error('Timed out waiting for the camera stream to become ready.'))
        }, VERIFY_TIMEOUT_MS)

        if (noDetectTimerRef.current) clearTimeout(noDetectTimerRef.current)
        noDetectTimerRef.current = window.setTimeout(() => {
          if (generationRef.current !== myGen) return
          setGuideMessage('Barcode not detected. Place the complete barcode inside the scanning frame and keep the camera steady.')
          setShowNoDetectHint(true)
        }, NO_DETECT_TIMEOUT_MS)

        const handleDecoded = (text, format, points) => {
          if (!text || detectingRef.current || generationRef.current !== myGen) return
          detectingRef.current = true
          const frame = captureFrame(videoRef, points)
          stopScanner()
          setShowNoDetectHint(false)
          setDetected({ format, text, frame })
          setStatus('detected')
        }

        const BarcodeDetectorApi = globalThis.BarcodeDetector
        if (BarcodeDetectorApi) {
          const nativeFormats = [
            'aztec',
            'codabar',
            'code_128',
            'code_39',
            'data_matrix',
            'ean_13',
            'ean_8',
            'itf',
            'pdf417',
            'qr_code',
            'upc_a',
            'upc_e',
          ]
          try {
            const detector = new BarcodeDetectorApi({ formats: nativeFormats })
            const scanNativeFrame = (timestamp) => {
              if (detectingRef.current || generationRef.current !== myGen) return
              if (timestamp - nativeScanLastRunRef.current >= NATIVE_SCAN_INTERVAL_MS) {
                nativeScanLastRunRef.current = timestamp
                detector
                  .detect(videoEl)
                  .then((barcodes) => {
                    const barcode = barcodes[0]
                    if (barcode) {
                      handleDecoded(
                        barcode.rawValue,
                        formatLabel(barcode.format),
                        barcode.cornerPoints,
                      )
                    }
                  })
                  .catch(() => {
                    // ZXing remains active when native detection is unavailable.
                  })
              }
              nativeScanFrameRef.current = requestAnimationFrame(scanNativeFrame)
            }
            nativeScanFrameRef.current = requestAnimationFrame(scanNativeFrame)
          } catch {
            // Use ZXing when the browser does not support these native formats.
          }
        }

        let reader
        try {
          reader = new BrowserMultiFormatReader(FORMAT_DECODE_HINTS, {
            delayBetweenScanAttempts: 100,
          })
        } catch (error) {
          handleFailure(error)
          return
        }
        codeReaderRef.current = reader

        const frameCanvas = document.createElement('canvas')
        const frameContext = frameCanvas.getContext('2d', { willReadFrequently: true })
        let decodingFrame = false
        frameDecodeTimerRef.current = window.setInterval(() => {
          if (detectingRef.current || decodingFrame || !frameContext) return
          if (!videoEl.videoWidth || !videoEl.videoHeight) return

          decodingFrame = true
          try {
            const result = decodeVideoFrame(reader, videoEl, frameContext, frameCanvas)
            handleDecoded(
              result.getText(),
              formatLabel(result.getBarcodeFormat()),
              undefined,
            )
          } catch {
            // Most frames do not contain a complete barcode; live decoding continues.
          } finally {
            decodingFrame = false
          }
        }, FRAME_DECODE_INTERVAL_MS)

        const scanCb = (result, error, controls) => {
          if (controls) controlsRef.current = controls
          if (detectingRef.current) return

          if (result) {
            handleDecoded(result.getText(), formatLabel(result.getBarcodeFormat()), result.getResultPoints?.())
            return
          }

          if (error && (isDeniedError(error.name) || isUnsupportedError(error.name))) {
            stopScanner()
            setStatus(mediaFailureState(error))
          }
        }

        reader
          .decodeFromVideoElement(videoEl, scanCb)
          .then((controls) => {
            if (generationRef.current !== myGen) return
            controlsRef.current = controls
            if (verifyTimerRef.current) {
              clearTimeout(verifyTimerRef.current)
              verifyTimerRef.current = null
            }
            setStatus('ready')
            setGuideMessage('Place the complete barcode inside the frame. It should scan within a few seconds.')
          })
          .catch((error) => {
            if (generationRef.current !== myGen) return
            handleFailure(error)
          })
      })
      .catch(handleFailure)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopScanner, isMobile, loadDevices, clearTimers])

  const handleDeviceChange = (event) => {
    const deviceId = event.target.value
    selectedDeviceIdRef.current = deviceId || ''
    activeDeviceIdRef.current = deviceId || ''
    setSelectedDeviceId(deviceId || '')
    startScanner()
  }

  useEffect(() => {
    if (!open) return undefined
    loadDevices()
    startScanner()
    return () => stopScanner()
  }, [open, loadDevices, startScanner, stopScanner])

  const handleClose = () => {
    stopScanner()
    onClose?.()
  }

  const handleViewDetails = () => {
    const result = detected
    stopScanner()
    onResult?.(result)
    onClose?.()
  }

  const handleScanAgain = () => {
    startScanner()
  }

  const handleCaptureAndScan = () => {
    const video = videoRef.current
    if (!video || !video.videoWidth || !video.videoHeight) {
      setCaptureMessage('Camera is not ready yet. Please wait a moment and try again.')
      return
    }

    try {
      const reader = new BrowserMultiFormatReader(FORMAT_DECODE_HINTS)
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d', { willReadFrequently: true })
      if (!context) throw new Error('Unable to capture the camera frame.')
      const result = decodeVideoFrame(reader, video, context, canvas)
      const frame = { dataUrl: canvas.toDataURL('image/jpeg', 0.92), region: 'barcode' }
      stopScanner()
      setDetected({
        format: formatLabel(result.getBarcodeFormat()),
        text: result.getText(),
        frame,
      })
      setStatus('detected')
      setCaptureMessage('')
    } catch {
      setCaptureMessage('Barcode not clear enough. Hold the package steady, move closer, and capture again.')
    }
  }

  const handleUseUploadInstead = () => {
    stopScanner()
    onRequestUpload?.()
    onClose?.()
  }

  const handleManualSubmit = (event) => {
    event.preventDefault()
    const code = manualBarcode.trim()
    if (!code) return
    stopScanner()
    onResult?.({
      format: 'Manual Entry',
      text: code,
      frame: null,
    })
    onClose?.()
  }

  const handleImageSelected = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const imageUrl = URL.createObjectURL(file)
    const image = new Image()
    image.onload = async () => {
      try {
        const reader = new BrowserMultiFormatReader(FORMAT_DECODE_HINTS)
        const decoded = decodeBarcodeFromImage(reader, image)
        const result = decoded.result
        stopScanner()
        setDetected({
          format: formatLabel(result.getBarcodeFormat()),
          text: result.getText(),
          frame: { dataUrl: decoded.dataUrl, region: 'full' },
        })
        URL.revokeObjectURL(imageUrl)
        setStatus('detected')
      } catch {
        URL.revokeObjectURL(imageUrl)
        setGuideMessage('Barcode was not found in that photo. Take a clear, close photo of the complete barcode.')
        setShowNoDetectHint(true)
      }
    }
    image.onerror = () => {
      URL.revokeObjectURL(imageUrl)
      setGuideMessage('The selected image could not be read. Please choose another barcode photo.')
      setShowNoDetectHint(true)
    }
    image.src = imageUrl
  }

  const showLoadingPane = status === 'starting'
  const showScanningPane = status === 'ready'
  const showDetectedPane = status === 'detected' && detected

  const showDeviceSelector =
    !isMobile && devices.length > 1 && (status === 'starting' || status === 'ready')

  const errorTone =
    status === 'denied'
      ? {
          icon: 'alert-triangle',
          title: 'Camera access was denied.',
          hint: 'Please allow camera permission in your browser settings, or use Upload Product Image instead.',
          canRetry: true,
        }
      : status === 'unsupported'
        ? {
            icon: 'info',
            title: 'Camera is not available on this device.',
            hint: 'No working camera was found. You can continue by uploading a product image instead.',
            canRetry: true,
          }
        : {
            icon: 'alert',
            title: 'Unable to start the scanner.',
            hint: 'The camera could not be initialised. Close any other app using the camera and try again.',
            canRetry: true,
          }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Scan QR / Barcode"
      size="lg"
      className="scanner-modal"
      footer={
        showLoadingPane || showScanningPane ? (
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
        ) : undefined
      }
    >
      <div className="scanner-modal__body">
        <input
          ref={imagePickerRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={handleImageSelected}
        />
        <p className="scanner-modal__subtitle">
          Point your camera at the QR code or barcode on the product package. Detection scans the
          complete camera view automatically.
        </p>

        <div className="scanner-modal__stage">
          <video
            ref={videoRef}
            className="scanner-modal__video"
            autoPlay
            muted
            playsInline
            aria-label="Live camera preview for scanning a barcode or QR code"
          />

          {showScanningPane && (
            <>
              <div className="scanner-modal__frame" aria-hidden="true">
                <span className="scanner-modal__corner scanner-modal__corner--tl" />
                <span className="scanner-modal__corner scanner-modal__corner--tr" />
                <span className="scanner-modal__corner scanner-modal__corner--bl" />
                <span className="scanner-modal__corner scanner-modal__corner--br" />
                <span className="scanner-modal__scanline" />
              </div>
              <div className="scanner-modal__scanning" role="status">
                <span className="scanner-modal__scan-indicator" aria-hidden="true" />
                Scanning…
              </div>
            </>
          )}

          {showLoadingPane && (
            <div className="scanner-modal__overlay" role="status">
              <span className="scanner-modal__spinner" aria-hidden="true" />
              <p className="scanner-modal__overlay-text">Starting camera…</p>
            </div>
          )}

          {(status === 'denied' || status === 'unsupported' || status === 'error') && (
            <div className="scanner-modal__overlay" role="alert">
              <span className="scanner-modal__overlay-icon">
                <Icon name={errorTone.icon} size={32} />
              </span>
              <p className="scanner-modal__overlay-title">{errorTone.title}</p>
              {errorTone.hint && <p className="scanner-modal__overlay-text">{errorTone.hint}</p>}
              <div className="scanner-modal__overlay-actions">
                {errorTone.canRetry && (
                  <Button variant="primary" icon="camera" onClick={handleScanAgain}>
                    Try Again
                  </Button>
                )}
                <Button variant="outline" icon="upload" onClick={handleUseUploadInstead}>
                  Upload Image
                </Button>
                <Button variant="ghost" onClick={handleClose}>
                  Close
                </Button>
              </div>
            </div>
          )}

          {showDetectedPane && (
            <div className="scanner-modal__result" role="status">
              <span className="scanner-modal__result-icon">
                <Icon name="check-circle" size={32} />
              </span>
              <h3 className="scanner-modal__result-title">Barcode / QR detected</h3>

              {detected.frame && (
                <img
                  className="scanner-modal__capture"
                  src={detected.frame.dataUrl}
                  alt="Captured barcode region"
                />
              )}

              <dl className="scanner-modal__result-details">
                <div className="scanner-modal__result-row">
                  <dt>Barcode</dt>
                  <dd className="scanner-modal__result-value" title={detected.text}>
                    {detected.text}
                  </dd>
                </div>
                <div className="scanner-modal__result-row">
                  <dt>Format</dt>
                  <dd>{detected.format}</dd>
                </div>
              </dl>

              <div className="scanner-modal__result-actions">
                <Button variant="outline" icon="barcode" onClick={handleScanAgain}>
                  Scan Again
                </Button>
                <Button variant="primary" icon="arrowRight" onClick={handleViewDetails}>
                  Continue
                </Button>
              </div>
            </div>
          )}
        </div>

        {showDeviceSelector && (
          <div className="scanner-modal__devices">
            <label className="scanner-modal__devices-label" htmlFor="scanner-camera-select">
              Camera
            </label>
            <select
              id="scanner-camera-select"
              className="scanner-modal__devices-select"
              value={selectedDeviceId}
              onChange={handleDeviceChange}
            >
              {devices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || 'Camera'}
                </option>
              ))}
            </select>
          </div>
        )}

        {showScanningPane && (
          <div className="scanner-modal__guide" role="note">
            <p className="scanner-modal__guide-text">
              {showNoDetectHint
                ? 'Barcode not detected. Place the complete barcode inside the scanning frame and keep the camera steady.'
                : guideMessage}
            </p>
            <div className="scanner-modal__guide-tips">
              <span>Place the barcode inside the frame</span>
              <span>Keep the barcode horizontal and clearly visible</span>
              <span>Move closer if the barcode looks too far away</span>
            </div>
            <div className="scanner-modal__manual">
              <Button variant="primary" size="sm" icon="camera" onClick={handleCaptureAndScan}>
                Capture &amp; Scan
              </Button>
              {captureMessage && <p className="scanner-modal__capture-message">{captureMessage}</p>}
              <Button
                variant="outline"
                size="sm"
                icon="camera"
                onClick={() => imagePickerRef.current?.click()}
              >
                Scan from a barcode photo
              </Button>
              {!manualEntry ? (
                <Button
                  variant="ghost"
                  size="sm"
                  icon="barcode"
                  onClick={() => setManualEntry(true)}
                >
                  Enter barcode manually
                </Button>
              ) : (
                <form className="scanner-modal__manual-form" onSubmit={handleManualSubmit}>
                  <input
                    type="text"
                    className="scanner-modal__manual-input"
                    placeholder="Type barcode number..."
                    value={manualBarcode}
                    onChange={(e) => setManualBarcode(e.target.value)}
                    autoFocus
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={!manualBarcode.trim()}
                  >
                    Submit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setManualEntry(false); setManualBarcode('') }}
                  >
                    Cancel
                  </Button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
