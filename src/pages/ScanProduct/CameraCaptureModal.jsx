import { useEffect, useRef, useState } from 'react'
import Button from '../../components/ui/Button/Button'
import Icon from '../../components/ui/Icon/Icon'
import Modal from '../../components/ui/Modal/Modal'
import './CameraCaptureModal.css'

const IMAGE_TYPE = 'image/png'
const IMAGE_EXTENSION = 'png'

const DENIED_MESSAGE =
  'Camera access was denied. Please allow camera permission or use Upload Product Image instead.'

const UNSUPPORTED_MESSAGE =
  'Camera capture is not supported on this device. Please use Upload Product Image instead.'

const DENIED_ERRORS = ['NotAllowedError', 'PermissionDeniedError', 'SecurityError']
const UNSUPPORTED_ERRORS = [
  'NotFoundError',
  'OverconstrainedError',
  'NotReadableError',
  'NotSupportedError',
  'AbortError',
]

function isDeniedError(name) {
  return DENIED_ERRORS.includes(name)
}

function isUnsupportedError(name) {
  return UNSUPPORTED_ERRORS.includes(name)
}

function stopStream(stream) {
  if (!stream) return
  stream.getTracks().forEach((track) => {
    track.stop()
  })
}

function captureFrame(videoRef) {
  const video = videoRef.current
  if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
    return Promise.resolve(null)
  }

  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob ? new File([blob], `camera-capture-${Date.now()}.${IMAGE_EXTENSION}`, { type: IMAGE_TYPE }) : null),
      IMAGE_TYPE,
    )
  })
}

export default function CameraCaptureModal({ open, onClose, onCapture }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [isCapturing, setIsCapturing] = useState(false)

  useEffect(() => {
    if (!open) return undefined

    let cancelled = false
    const videoEl = videoRef.current
    let activeStream = null

    const timer = setTimeout(() => {
      setStatus('starting')
      setErrorMessage('')
      setIsCapturing(false)
    }, 0)

    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const unsupportedTimer = setTimeout(() => {
        setStatus('unsupported')
        setErrorMessage(UNSUPPORTED_MESSAGE)
      }, 0)
      return () => {
        clearTimeout(timer)
        clearTimeout(unsupportedTimer)
      }
    }

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((mediaStream) => {
        if (cancelled) {
          stopStream(mediaStream)
          return
        }
        activeStream = mediaStream
        streamRef.current = mediaStream
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
          videoRef.current.play().catch(() => {
            // Autoplay could be restricted by browser policy
          })
          setStatus('ready')
        }
      })
      .catch((error) => {
        if (cancelled) return
        const name = error?.name || ''
        if (isDeniedError(name)) {
          setStatus('denied')
          setErrorMessage(DENIED_MESSAGE)
        } else if (isUnsupportedError(name)) {
          setStatus('unsupported')
          setErrorMessage(UNSUPPORTED_MESSAGE)
        } else {
          setStatus('unsupported')
          setErrorMessage(UNSUPPORTED_MESSAGE)
        }
      })

    return () => {
      cancelled = true
      clearTimeout(timer)
      if (activeStream) {
        stopStream(activeStream)
      }
      if (streamRef.current) {
        stopStream(streamRef.current)
        streamRef.current = null
      }
      if (videoEl) {
        try {
          videoEl.srcObject = null
        } catch {
          // ignore
        }
      }
    }
  }, [open])

  const handleCapture = async () => {
    if (status !== 'ready' || isCapturing) return

    setIsCapturing(true)
    try {
      const file = await captureFrame(videoRef)
      if (file && onCapture) {
        stopStream(streamRef.current)
        streamRef.current = null
        if (videoRef.current) {
          try {
            videoRef.current.srcObject = null
          } catch {
            // ignore
          }
        }
        onCapture(file)
        onClose?.()
      }
    } finally {
      setIsCapturing(false)
    }
  }

  const handleClose = () => {
    stopStream(streamRef.current)
    streamRef.current = null
    if (videoRef.current) {
      try {
        videoRef.current.srcObject = null
      } catch {
        // ignore
      }
    }
    setStatus('idle')
    onClose?.()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Capture Product Image"
      size="lg"
      className="camera-modal"
      footer={
        <div className="camera-modal__actions">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            icon="camera"
            onClick={handleCapture}
            disabled={status !== 'ready' || isCapturing}
          >
            Capture Image
          </Button>
        </div>
      }
    >
      <div className="camera-modal__stage">
        <video
          ref={videoRef}
          className="camera-modal__video"
          autoPlay
          muted
          playsInline
        />

        {status === 'starting' && (
          <div className="camera-modal__overlay" role="status">
            <span className="camera-modal__spinner" aria-hidden="true" />
            <p className="camera-modal__overlay-text">Starting camera…</p>
          </div>
        )}

        {(status === 'denied' || status === 'unsupported') && (
          <div className="camera-modal__overlay" role="alert">
            <span className="camera-modal__overlay-icon">
              <Icon name={status === 'denied' ? 'alert-triangle' : 'info'} size={32} />
            </span>
            <p className="camera-modal__overlay-text">{errorMessage}</p>
          </div>
        )}
      </div>
    </Modal>
  )
}
