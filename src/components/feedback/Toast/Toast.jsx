import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { classNames } from '../../../utils/classNames'
import Icon from '../../ui/Icon/Icon'
import './Toast.css'

const TONE_ICON_MAP = {
  info: 'info',
  success: 'check-circle',
  warning: 'alert-triangle',
  error: 'alert',
}

function ToastItem({ toast, onDismiss }) {
  useEffect(() => {
    if (toast.duration === 0) return undefined
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration || 5000)
    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, onDismiss])

  return (
    <div
      className={classNames('toast-item', `toast-item--${toast.tone || 'info'}`)}
      role="status"
      aria-live="polite"
    >
      <Icon
        name={TONE_ICON_MAP[toast.tone] || 'info'}
        size={18}
        className="toast-item__icon"
      />
      <p className="toast-item__message">{toast.message}</p>
      <button
        type="button"
        className="toast-item__dismiss"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
      >
        <Icon name="close" size={14} />
      </button>
    </div>
  )
}

export default function ToastContainer({ toasts = [], onDismiss }) {
  if (!toasts.length) return null

  return createPortal(
    <div className="toast-container" aria-label="Notifications">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>,
    document.body,
  )
}