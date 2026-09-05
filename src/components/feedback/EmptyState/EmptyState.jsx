import Icon from '../../ui/Icon/Icon'
import './EmptyState.css'

export default function EmptyState({
  icon = 'info',
  title = 'No data available',
  description,
  action,
  className = '',
}) {
  return (
    <div className={`empty-state ${className}`}>
      <span className="empty-state__icon">
        <Icon name={icon} size={36} />
      </span>
      <h3 className="empty-state__title">{title}</h3>
      {description && <p className="empty-state__description">{description}</p>}
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  )
}
