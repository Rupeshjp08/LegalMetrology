import { classNames } from '../../../utils/classNames'
import Icon from '../../ui/Icon/Icon'
import './FileValidationMessage.css'

const TONES = {
  error: 'fvm--error',
  warning: 'fvm--warning',
  success: 'fvm--success',
  hint: 'fvm--hint',
}

const TONE_ICONS = {
  error: 'alert',
  warning: 'alert-triangle',
  success: 'check-circle',
  hint: 'info',
}

/**
 * Inline validation feedback for file selection.
 * tone: error | warning | success | hint
 */
export default function FileValidationMessage({
  tone = 'error',
  title,
  messages = [],
  className = '',
}) {
  const hasContent = Boolean(title) || messages.length > 0
  if (!hasContent) return null

  const toneClass = TONES[tone] || TONES.hint
  const iconName = TONE_ICONS[tone] || 'info'
  const announceAs = tone === 'success' || tone === 'hint' ? 'status' : 'alert'

  return (
    <div
      className={classNames('fvm', toneClass, className)}
      role={announceAs}
    >
      <Icon name={iconName} size={18} className="fvm__icon" />
      <div className="fvm__content">
        {title && <p className="fvm__title">{title}</p>}
        {messages.length > 0 && (
          <ul className="fvm__list">
            {messages.map((message) => (
              <li key={message} className="fvm__item">
                {message}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}