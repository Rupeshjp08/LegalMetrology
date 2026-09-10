import { classNames } from '../../../utils/classNames'
import Icon from '../../ui/Icon/Icon'
import './Alert.css'

const TONE_CONFIG = {
  info: { icon: 'info', className: 'alert--info' },
  success: { icon: 'check-circle', className: 'alert--success' },
  warning: { icon: 'alert-triangle', className: 'alert--warning' },
  error: { icon: 'alert', className: 'alert--error' },
}

export default function Alert({
  tone = 'info',
  title,
  children,
  onClose,
  className = '',
}) {
  const config = TONE_CONFIG[tone] || TONE_CONFIG.info
  const role = tone === 'error' ? 'alert' : 'status'

  return (
    <div
      className={classNames('alert', config.className, className)}
      role={role}
    >
      <Icon name={config.icon} size={20} className="alert__icon" />
      <div className="alert__content">
        {title && <p className="alert__title">{title}</p>}
        {children && <div className="alert__body">{children}</div>}
      </div>
      {onClose && (
        <button
          type="button"
          className="alert__close"
          onClick={onClose}
          aria-label="Dismiss alert"
        >
          <Icon name="close" size={16} />
        </button>
      )}
    </div>
  )
}
