import { useCallback, useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { DecodeHintType } from '@zxing/library'
import Card from '../../components/ui/Card/Card'
import StatusBadge from '../../components/ui/StatusBadge/StatusBadge'
import PageHeader from '../../components/ui/PageHeader/PageHeader'
import Button from '../../components/ui/Button/Button'
import Icon from '../../components/ui/Icon/Icon'
import { verifyReportId, verifyQrData } from '../../modules/admin/services/qrService'
import '../../modules/admin/admin.css'

const DECODE_HINTS = new Map([[DecodeHintType.TRY_HARDER, true]])

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

function VerificationResult({ result }) {
  const report = result.report

  return (
    <div className={result.valid ? 'm5-result m5-result--valid' : 'm5-result m5-result--invalid'}>
      <h3 className="m5-result__title">
        {result.valid ? 'Verification Successful' : 'Verification Failed'}
      </h3>
      <p className="m5-result__message">{result.message}</p>

      {result.valid && report && (
        <div className="m5-kv">
          <div className="m5-kv__item">
            <span className="m5-kv__label">Report ID</span>
            <span className="m5-kv__value">{report.reportId}</span>
          </div>
          <div className="m5-kv__item">
            <span className="m5-kv__label">Product</span>
            <span className="m5-kv__value">{report.productName}</span>
          </div>
          <div className="m5-kv__item">
            <span className="m5-kv__label">Category</span>
            <span className="m5-kv__value">{report.category}</span>
          </div>
          <div className="m5-kv__item">
            <span className="m5-kv__label">Scan Date</span>
            <span className="m5-kv__value">{report.scanDate}</span>
          </div>
          <div className="m5-kv__item">
            <span className="m5-kv__label">Compliance Score</span>
            <span className="m5-kv__value">{report.complianceScore}%</span>
          </div>
          <div className="m5-kv__item">
            <span className="m5-kv__label">Status</span>
            <span className="m5-kv__value">
              <StatusBadge status={report.status} />
            </span>
          </div>
          <div className="m5-kv__item">
            <span className="m5-kv__label">Violations</span>
            <span className="m5-kv__value">{report.violations}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function QRVerification() {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const generationRef = useRef(0)
  const processingRef = useRef(false)
  const [scanning, setScanning] = useState(false)
  const [scanStatus, setScanStatus] = useState('idle')
  const [result, setResult] = useState(null)
  const [manualId, setManualId] = useState('')

  const stopScanner = useCallback(() => {
    generationRef.current += 1
    processingRef.current = false
    stopStream(streamRef.current)
    streamRef.current = null
    if (videoRef.current) {
      try {
        videoRef.current.srcObject = null
      } catch {
        // ignore cleanup errors
      }
    }
    setScanStatus('idle')
    setScanning(false)
  }, [])

  const handleResult = useCallback(
    (rawText) => {
      if (processingRef.current) return
      processingRef.current = true
      const outcome = verifyQrData(rawText)
      stopScanner()
      setResult(outcome)
    },
    [stopScanner],
  )

  const startScanning = useCallback(() => {
    setResult(null)
    setScanStatus('starting')
    setScanning(true)
  }, [])

  useEffect(() => {
    if (!scanning) return undefined

    const myGeneration = generationRef.current

    const reader = new BrowserMultiFormatReader(DECODE_HINTS, {
      delayBetweenScanAttempts: 200,
    })

    let cancelled = false

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .catch((error) => {
        if (
          ['OverconstrainedError', 'NotFoundError', 'NotReadableError'].includes(
            error?.name,
          )
        ) {
          return navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        }
        throw error
      })
      .then((stream) => {
        if (cancelled || generationRef.current !== myGeneration) {
          stopStream(stream)
          return null
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
        return videoRef.current?.play().catch(() => undefined)
      })
      .then(() => {
        if (cancelled || generationRef.current !== myGeneration || !videoRef.current) {
          return null
        }
        reader
          .decodeFromVideoElement(videoRef.current, (decoded, error) => {
            if (cancelled || generationRef.current !== myGeneration) return
            if (decoded) {
              handleResult(decoded.getText())
              return
            }
            if (
              error &&
              ['NotAllowedError', 'NotFoundError', 'NotReadableError', 'SecurityError'].includes(
                error.name,
              )
            ) {
              if (error.name === 'NotAllowedError') {
                setScanStatus('denied')
              } else {
                setScanStatus('error')
              }
              stopScanner()
            }
          })
          .then(() => {
            if (!cancelled && generationRef.current === myGeneration) {
              setScanStatus('ready')
            }
          })
          .catch(() => {
            if (!cancelled && generationRef.current === myGeneration) {
              setScanStatus('error')
              stopScanner()
            }
          })
        return null
      })
      .catch((error) => {
        if (cancelled || generationRef.current !== myGeneration) return
        const name = error?.name || ''
        if (name === 'NotAllowedError') {
          setScanStatus('denied')
        } else if (['NotFoundError', 'OverconstrainedError'].includes(name)) {
          setScanStatus('unsupported')
        } else {
          setScanStatus('error')
        }
        setScanning(false)
      })

    return () => {
      cancelled = true
      generationRef.current += 1
      stopStream(streamRef.current)
      streamRef.current = null
      try {
        reader.reset()
      } catch {
        // reader may already be released
      }
    }
  }, [scanning, handleResult, stopScanner])

  const handleManualVerify = () => {
    const id = manualId.trim()
    if (!id) return
    setResult(verifyReportId(id))
  }

  const scannerOverlay =
    scanStatus === 'starting' ? (
      <div className="m5-qr__stage-overlay" role="status">
        <span className="m5-qr__stage-icon">
          <span className="table__spinner" aria-hidden="true" />
        </span>
        <p className="m5-qr__stage-title">Starting camera…</p>
      </div>
    ) : scanStatus === 'denied' || scanStatus === 'unsupported' || scanStatus === 'error' ? (
      <div className="m5-qr__stage-overlay" role="alert">
        <span className="m5-qr__stage-icon">
          <Icon name="camera-off" size={26} />
        </span>
        <p className="m5-qr__stage-title">
          {scanStatus === 'denied'
            ? 'Camera access was denied.'
            : scanStatus === 'unsupported'
              ? 'Camera is not available on this device.'
              : 'Unable to start the scanner.'}
        </p>
        <p className="m5-qr__stage-text">
          {scanStatus === 'denied'
            ? 'Allow camera permission in your browser settings, or verify a report ID manually below.'
            : 'You can still verify a compliance report by typing its report ID below.'}
        </p>
        <Button variant="primary" size="sm" icon="refresh" onClick={startScanning}>
          Try Again
        </Button>
      </div>
    ) : null

  return (
    <div className="m5-page">
      <PageHeader
        overline="PCLMCS · Officer Workspace"
        title="QR Verification"
        description="Scan a compliance report QR code or verify a report ID against the recorded inspection data."
      />

      <div className="m5-qr__layout">
        <Card title="Scan Report QR Code" subtitle="Point the camera at a generated PDF report code">
          <div className="m5-qr__stage">
            {scanning && scanStatus !== 'denied' && (
              <video
                ref={videoRef}
                className="m5-qr__video"
                autoPlay
                muted
                playsInline
                aria-label="Live camera preview for QR verification"
              />
            )}
            {scanning && scanStatus === 'ready' && <div className="m5-qr__frame" aria-hidden="true" />}
            {scanning && scanStatus === 'ready' && <div className="m5-qr__scanline" aria-hidden="true" />}
            {!scanning && (
              <div className="m5-qr__stage-overlay">
                <span className="m5-qr__stage-icon">
                  <Icon name="qr" size={26} />
                </span>
                <p className="m5-qr__stage-title">Camera is paused</p>
                <Button variant="primary" size="sm" icon="camera" onClick={startScanning}>
                  Start Scanner
                </Button>
              </div>
            )}
            {scannerOverlay}
          </div>
        </Card>

        <Card title="Verify Manually" subtitle="Type a report ID from a printed compliance report">
          <div className="m5-qr__manual">
            <div className="m5-qr__manual-row">
              <input
                id="m5-manual-id"
                type="text"
                className="m5-input m5-qr__manual-input"
                placeholder="Enter report ID, e.g. INS-1234567890"
                value={manualId}
                onChange={(event) => setManualId(event.target.value)}
              />
              <Button
                variant="primary"
                icon="check-circle"
                disabled={!manualId.trim()}
                onClick={handleManualVerify}
              >
                Verify
              </Button>
            </div>
            <p className="m5-hint">
              The scanner and manual entry both check the report against the official
              compliance records stored on this system.
            </p>
          </div>
        </Card>

        {result && <VerificationResult result={result} />}
      </div>
    </div>
  )
}