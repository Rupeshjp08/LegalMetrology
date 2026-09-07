import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { BarcodeFormat, DecodeHintType } from '@zxing/library'
import Button from '../../components/ui/Button/Button'
import Icon from '../../components/ui/Icon/Icon'
import Modal from '../../components/ui/Modal/Modal'
import './QRBarcodeScannerModal.css'

const DENIED_MESSAGE =
  'Camera access was denied. Please allow camera permission or use Upload Product Image instead.'

const UNSUPPORTED_MESSAGE =
  'QR/Barcode scanning is not supported on this device. Please use Upload Product Image instead.'

const DENIED_ERRORS = ['NotAllowedError', 'PermissionDeniedError', 'SecurityError']
const UNSUPPORTED_ERRORS = [
  'NotFoundError',
  'OverconstrainedError',
  'NotReadableError',
  'NotSupportedError',
  'AbortError',
]

const FORMAT_DECODE_HINTS = new Map([
  [
    DecodeHintType.POSSIBLE_FORMATS,
    [BarcodeFormat.QR_CODE, BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.CODE_128],
  ],
])

const FORMAT_LABELS = {
  [BarcodeFormat.QR_CODE]: 'QR Code',
  [BarcodeFormat.EAN_13]: 'EAN-13',
  [BarcodeFormat.EAN_8]: 'EAN-8',
  [BarcodeFormat.UPC_A]: 'UPC-A',
  [BarcodeFormat.CODE_128]: 'Code 128',
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

function mediaErrorMessage(error) {
  const name = error?.name || ''
  if (isDeniedError(name)) return { kind: 'denied', message: DENIED_MESSAGE }
  if (isUnsupportedError(name)) return { kind: 'unsupported', message: UNSUPPORTED_MESSAGE }
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return { kind: 'unsupported', message: UNSUPPORTED_MESSAGE }
  }
  return { kind: 'unsupported', message: UNSUPPORTED_MESSAGE }
}

export default function QRBarcodeScannerModal({ open, onClose, onResult }) {
  const videoRef = useRef(null)
  const controlsRef = useRef(null)
  const codeReaderRef = useRef(null)
  const detectingRef = useRef(false)

  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [detected, setDetected] = useState(null)

  const stopScanner = () => {
    if (controlsRef.current) {
      try {
        controlsRef.current.stop()
      } catch {
        // ignore cleanup errors
      }
      controlsRef.current = null
    }
    if (codeReaderRef.current) {
      try {
        codeReaderRef.current.reset()
      } catch {
        // ignore cleanup errors
      }
      codeReaderRef.current = null
    }
  }

  useEffect(() => {
    if (!open) return undefined

    let cancelled = false
    setStatus('starting')
    setErrorMessage('')
    setDetected(null)

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatus('unsupported')
      setErrorMessage(UNSUPPORTED_MESSAGE)
      return undefined
    }

    let reader
    try {
      reader = new BrowserMultiFormatReader(FORMAT_DECODE_HINTS, {
        delayBetweenScanAttempts: 300,
      })
    } catch {
      setStatus('unsupported')
      setErrorMessage(UNSUPPORTED_MESSAGE)
      return undefined
    }
    codeReaderRef.current = reader

    reader
      .decodeFromVideoDevice(undefined, videoRef.current, (result, error) => {
        if (cancelled || detectingRef.current) return
        if (result) {
          detectingRef.current = true
          const text = result.getText()
          const format = result.getBarcodeFormat()
          stopScanner()
          setDetected({ text, format: formatLabel(format) })
          setStatus('detected')
          return
        }
        if (error && (isDeniedError(error.name) || isUnsupportedError(error.name))) {
          detectingRef.current = true
          stopScanner()
          const mapped = mediaErrorMessage(error)
          setStatus(mapped.kind)
          setErrorMessage(mapped.message)
        }
      })
      .catch((error) => {
        if (cancelled) return
        detectingRef.current = true
        stopScanner()
        const mapped = mediaErrorMessage(error)
        setStatus(mapped.kind)
        setErrorMessage(mapped.message)
      })

    return () => {
      cancelled = true
      stopScanner()
    }
  }, [open])

  const handleClose = () => {
    stopScanner()
    onClose?.()
  }

  const handleScanAgain = () => {
    stopScanner()
    setDetected(null)
    setStatus('starting')
    setErrorMessage('')
    detectingRef.current = false

    let reader
    try {
      reader = new BrowserMultiFormatReader(FORMAT_DECODE_HINTS, {
        delayBetweenScanAttempts: 300,
      })
    } catch {
      setStatus('unsupported')
      setErrorMessage(UNSUPPORTED_MESSAGE)
      return
    }
    codeReaderRef.current = reader

    reader
      .decodeFromVideoDevice(undefined, videoRef.current, (result, error) => {
        if (detectingRef.current) return
        if (result) {
          detectingRef.current = true
          stopScanner()
          setDetected({
            text: result.getText(),
            format: formatLabel(result.getBarcodeFormat()),
          })
          setStatus('detected')
          return
        }
        if (error && (isDeniedError(error.name) || isUnsupportedError(error.name))) {
          detectingRef.current = true
          stopScanner()
          const mapped = mediaErrorMessage(error)
          setStatus(mapped.kind)
          setErrorMessage(mapped.message)
        }
      })
      .catch((error) => {
        detectingRef.current = true
        stopScanner()
        const mapped = mediaErrorMessage(error)
        setStatus(mapped.kind)
        setErrorMessage(mapped.message)
      })
  }

  const handleUseResult = () => {
    if (detected && onResult) {
      onResult(detected)
    }
    handleClose()
  }

  const showScanning = status === 'ready' || status === 'starting'

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Scan QR / Barcode"
      size="lg"
      className="scanner-modal"
    >
      <div className="scanner-modal__stage">
        <video ref={videoRef} className="scanner-modal__video" autoPlay muted playsInline />

        {showScanning && (
          <>
            <div className="scanner-modal__frame" aria-hidden="true">
              <span className="scanner-modal__corner scanner-modal__corner--tl" />
              <span className="scanner-modal__corner scanner-modal__corner--tr" />
              <span className="scanner-modal__corner scanner-modal__corner--bl" />
              <span className="scanner-modal__corner scanner-modal__corner--br" />
            </div>
            <div className="scanner-modal__hint" role="status">
              Position the QR code or barcode inside the frame.
            </div>
          </>
        )}

        {status === 'starting' && (
          <div className="scanner-modal__overlay" role="status">
            <span className="scanner-modal__spinner" aria-hidden="true" />
            <p className="scanner-modal__overlay-text">Starting camera…</p>
          </div>
        )}

        {(status === 'denied' || status === 'unsupported') && (
          <div className="scanner-modal__overlay" role="alert">
            <span className="scanner-modal__overlay-icon">
              <Icon name={status === 'denied' ? 'alert-triangle' : 'info'} size={32} />
            </span>
            <p className="scanner-modal__overlay-text">{errorMessage}</p>
          </div>
        )}

        {status === 'detected' && detected && (
          <div className="scanner-modal__result" role="status">
            <span className="scanner-modal__result-icon">
              <Icon name="check-circle" size={32} />
            </span>
            <h3 className="scanner-modal__result-title">Code detected successfully.</h3>
            <dl className="scanner-modal__result-details">
              <div className="scanner-modal__result-row">
                <dt>Code Type</dt>
                <dd>{detected.format}</dd>
              </div>
              <div className="scanner-modal__result-row">
                <dt>Detected Value</dt>
                <dd className="scanner-modal__result-value" title={detected.text}>
                  {detected.text}
                </dd>
              </div>
            </dl>
            <div className="scanner-modal__result-actions">
              <Button variant="outline" icon="barcode" onClick={handleScanAgain}>
                Scan Again
              </Button>
              <Button variant="primary" icon="check" onClick={handleUseResult}>
                Use Result
              </Button>
              <Button variant="ghost" onClick={handleClose}>
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
