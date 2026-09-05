import { classNames } from '../../../utils/classNames'
import Icon from '../../ui/Icon/Icon'
import './ActionCard.css'

/**
 * Action card with an icon, title, description and a control area.
 * Used to present the main "Capture / Upload / Scan" actions.
 */
export default function ActionCard({ icon, title, description, children, className = '' }) {
  return (
    <div className={classNames('action-card', className)}>
      {icon && (
        <span className="action-card__icon">
          <Icon name={icon} size={26} />
        </span>
      )}
      <h2 className="action-card__title">{title}</h2>
      {description && <p className="action-card__description">{description}</p>}
      {children && <div className="action-card__cta">{children}</div>}
    </div>
  )
}