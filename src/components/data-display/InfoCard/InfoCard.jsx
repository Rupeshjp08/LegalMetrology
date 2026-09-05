import { classNames } from '../../../utils/classNames'
import Icon from '../../ui/Icon/Icon'
import './InfoCard.css'

export default function InfoCard({
  icon,
  title,
  value,
  description,
  variant = 'default',
  className = '',
}) {
  return (
    <div className={classNames('info-card', `info-card--${variant}`, className)}>
      {icon && (
        <span className="info-card__icon">
          <Icon name={icon} size={22} />
        </span>
      )}
      <div className="info-card__content">
        {title && <p className="info-card__title">{title}</p>}
        {value && <p className="info-card__value">{value}</p>}
        {description && <p className="info-card__description">{description}</p>}
      </div>
    </div>
  )
}
