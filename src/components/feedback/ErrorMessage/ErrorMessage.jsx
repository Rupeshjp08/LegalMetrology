import Icon from '../../ui/Icon/Icon'
import Button from '../../ui/Button/Button'
import './ErrorMessage.css'

export default function ErrorMessage({
  title = 'Something went wrong',
  message,
  onRetry,
  className = '',
}) {
  return (
    <div className={`error-message ${className}`} role="alert">
      <span className="error-message__icon-wrap">
        <Icon name="alert-triangle" size={32} />
      </span>
      <h3 className="error-message__title">{title}</h3>
      {message && <p className="error-message__text">{message}</p>}
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  )
}
