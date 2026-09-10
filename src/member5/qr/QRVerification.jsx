import { useCallback, useEffect, useRef, useState } from 'react'
import {
  QrCode,
  Camera,
  CameraOff,
  ShieldCheck,
  ShieldX,
  CheckCircle2,
  AlertTriangle,
  Search,
  Loader2,
} from 'lucide-react'
import { Html5Qrcode } from 'html5-qrcode'
import AdminLayout from '../admin/components/AdminLayout'
import StatusBadge from '../admin/components/StatusBadge'
import {
  verifyQrData,
  verifyReportId,
  getSampleQrString,
} from './qrService'
import '../admin/adminDashboard.css'
import './qr.css'

const QR_READER_ID = 'member5-qr-reader'

function VerifyResult({ result }) {
  if (!result) return null
  const { valid, message, report } = result

  return (
    <div
      className={`qr-result ${valid ? 'qr-result--valid' : 'qr-result--invalid'}`}
      role="alert"
    >
      <div className="qr-result__banner">
        <span className="qr-result__icon">
          {valid ? (
            <CheckCircle2 size={28} aria-hidden="true" />
          ) : (
            <ShieldX size={28} aria-hidden="true" />
          )}
        </span>
        <div>
          <h3 className="qr-result__status">
            {valid ? 'Valid & Authentic' : 'Invalid'}
          </h3>
          <p className="qr-result__message">{message}</p>
        </div>
      </div>

      {valid && report && (
        <div className="qr-result__details">
          <h4 className="qr-result__details-title">Verified Report</h4>
          <div className="qr-result__grid">
            <div className="qr-result__row">
              <span className="qr-result__label">Report ID</span>
              <span className="qr-result__value">{report.reportId}</span>
            </div>
            <div className="qr-result__row">
              <span className="qr-result__label">Product Name</span>
              <span className="qr-result__value">{report.product.name}</span>
            </div>
            <div className="qr-result__row">
              <span className="qr-result__label">Brand</span>
              <span className="qr-result__value">{report.product.brand}</span>
            </div>
            <div className="qr-result__row">
              <span className="qr-result__label">Net Quantity</span>
              <span className="qr-result__value">
                {report.product.netQuantity}
              </span>
            </div>
            <div className="qr-result__row">
              <span className="qr-result__label">MRP</span>
              <span className="qr-result__value">{report.product.mrp}</span>
            </div>
            <div className="qr-result__row">
              <span className="qr-result__label">Compliance Score</span>
              <span className="qr-result__value">
                {report.compliance.score}%
              </span>
            </div>
            <div className="qr-result__row">
              <span className="qr-result__label">Compliance Status</span>
              <span className="qr-result__value">
                <StatusBadge status={report.compliance.status} />
              </span>
            </div>
            <div className="qr-result__row">
              <span className="qr-result__label">Scan Date &amp; Time</span>
              <span className="qr-result__value">{report.scanDate}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function QRVerification() {
  const [isScanning, setIsScanning] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [manualReportId, setManualReportId] = useState('')
  const [result, setResult] = useState(null)
  const [verifying, setVerifying] = useState(false)

  const scannerRef = useRef(null)
  const cameraStartedRef = useRef(false)

  const stopScanner = useCallback(async () => {
    if (scannerRef.current && cameraStartedRef.current) {
      try {
        await scannerRef.current.stop()
      } catch {
        // Scanner already stopped; ignore.
      }
      try {
        scannerRef.current.clear()
      } catch {
        // Clear failure is non-fatal.
      }
      cameraStartedRef.current = false
    }
    setIsScanning(false)
  }, [])

  const handleScanSuccess = useCallback(
    (decodedText) => {
      stopScanner().then(() => {
        const verification = verifyQrData(decodedText)
        setResult(verification)
      })
    },
    [stopScanner]
  )

  const startScanner = useCallback(async () => {
    stopScanner().then(async () => {
      setCameraError('')
      setResult(null)

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(QR_READER_ID)
      }

      try {
        await scannerRef.current.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          handleScanSuccess,
          () => {
            // decode failure (ignored); the scanner keeps running.
          }
        )
        cameraStartedRef.current = true
        setIsScanning(true)
      } catch {
        setCameraError(
          'Camera access is unavailable. Use the manual Report ID input below instead.'
        )
        setIsScanning(false)
      }
    })
  }, [handleScanSuccess, stopScanner])

  useEffect(() => {
    return () => {
      stopScanner()
    }
  }, [stopScanner])

  const handleManualVerify = (e) => {
    e.preventDefault()
    const id = manualReportId.trim()
    if (!id) return

    setResult(null)
    setVerifying(true)

    // Simulate async verification; later this calls the backend.
    setTimeout(() => {
      setResult(verifyReportId(id))
      setVerifying(false)
    }, 250)
  }

  return (
    <AdminLayout>
      <div className="admin-page qr-page">
        <div className="admin-page__header">
          <div>
            <h1 className="admin-page__heading">QR Verification</h1>
            <p className="admin-page__subheading">
              Scan the QR code from a compliance report to verify authenticity
            </p>
          </div>
        </div>

        <div className="qr-layout">
          <div className="dashboard-panel qr-panel">
            <div className="dashboard-panel__header">
              <h2 className="dashboard-panel__title">QR Scanner</h2>
              <span className="dashboard-panel__hint">
                Point camera at report QR code
              </span>
            </div>

            <div className="qr-scanner">
              <div
                id={QR_READER_ID}
                className="qr-scanner__viewport"
                aria-live="polite"
              />

              {!isScanning && !cameraError && (
                <div className="qr-scanner__placeholder">
                  <QrCode size={48} aria-hidden="true" />
                  <p>Scanner is idle</p>
                  {result && (
                    <p className="qr-scanner__reset-hint">
                      Ready to scan another report
                    </p>
                  )}
                </div>
              )}

              {cameraError && (
                <div className="qr-scanner__error">
                  <AlertTriangle size={18} aria-hidden="true" />
                  <p>{cameraError}</p>
                </div>
              )}

              <div className="qr-scanner__controls">
                {!isScanning ? (
                  <button
                    type="button"
                    className="qr-scanner__btn qr-scanner__btn--primary"
                    onClick={startScanner}
                  >
                    <Camera size={16} aria-hidden="true" />
                    Start Scanner
                  </button>
                ) : (
                  <button
                    type="button"
                    className="qr-scanner__btn"
                    onClick={stopScanner}
                  >
                    <CameraOff size={16} aria-hidden="true" />
                    Stop Scanner
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="dashboard-panel qr-panel">
            <div className="dashboard-panel__header">
              <h2 className="dashboard-panel__title">Manual Verification</h2>
              <span className="dashboard-panel__hint">
                Fallback when camera is unavailable
              </span>
            </div>

            <form className="qr-manual" onSubmit={handleManualVerify}>
              <label htmlFor="qr-manual-id" className="qr-manual__label">
                Report ID
              </label>
              <div className="qr-manual__input">
                <Search size={16} aria-hidden="true" />
                <input
                  id="qr-manual-id"
                  type="text"
                  placeholder="Enter Report ID e.g. RPT-2026-0857"
                  value={manualReportId}
                  onChange={(e) => setManualReportId(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="qr-manual__button"
                disabled={verifying || !manualReportId.trim()}
              >
                {verifying ? (
                  <Loader2 size={16} className="qr-manual__spinner" aria-hidden="true" />
                ) : (
                  <ShieldCheck size={16} aria-hidden="true" />
                )}
                Verify
              </button>

              <div className="qr-manual__hint">
                <p>Test with a sample genuine Report ID:</p>
                <button
                  type="button"
                  className="qr-manual__sample"
                  onClick={() => {
                    setManualReportId('RPT-2026-0857')
                  }}
                >
                  RPT-2026-0857
                </button>
                <span>or sample QR payload:</span>
                <code>{getSampleQrString()}</code>
              </div>
            </form>
          </div>
        </div>

        <div className="qr-layout__result">
          <VerifyResult result={result} />
        </div>
      </div>
    </AdminLayout>
  )
}

export default QRVerification